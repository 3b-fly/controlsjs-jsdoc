/*global env: true */
var template = require('jsdoc/template'),
    fs = require('jsdoc/fs'),
    path = require('jsdoc/path'),
    taffy = require('taffydb').taffy,
    _ = require('underscore'),
    prism = require('node-prismjs'),

    hasOwnProp = Object.prototype.hasOwnProperty,
    data,
    view,
    outdir = env.opts.destination;

var helper = require('./modules/jsdoc/templateHelper.js');

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet);

    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if(
      (doclet.kind === 'function')
      || (doclet.kind === 'event')
      || (doclet.kind === 'class')
    ){
      needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function addSignatureParams(f) {
    var params = helper.getSignatureParams(f, 'optional');

    f.signature = (f.signature || '') + '('+params.join(', ')+')';
}

function addSignatureReturns(f) {
    var returnTypes = helper.getSignatureReturns(f);

    f.signature = '<span class="signature">'+(f.signature || '') + '</span>';

    if (returnTypes.length) {
        f.signature += '<span class="arrow-right"></span><span class="type-signature returnType">'+(returnTypes.length ? '{'+returnTypes.join('|')+'}' : '')+'</span>';
    }
}

function addSignatureTypes(f) {
    var types = helper.getSignatureTypes(f);

    f.signature = (f.signature || '') + '<span class="type-signature">'+(types.length? ' :'+types.join('|') : '')+'</span>';
}

function resolveSourcePath(filepath) {
    return path.resolve(process.cwd(), filepath);
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return;
    }

    var filepath = doclet.meta.path && doclet.meta.path !== 'null' ?
        doclet.meta.path + '/' + doclet.meta.filename :
        doclet.meta.filename;

    return filepath;
}

function getLinkPath(tmplConf,sourcePath){
  var path = null;
  if(tmplConf.sourceLinks && sourcePath){
    for(var srcPath in tmplConf.sourceLinks){
      var absSrcPath = resolveSourcePath(srcPath);
      if(sourcePath.substring(0,absSrcPath.length) === absSrcPath){
        path = tmplConf.sourceLinks[srcPath].replace(
          '%path%',sourcePath.substring(absSrcPath.length+1)
        );
      }
    };
  }
  return path;
}

function generate(title,docs,filename,resolveLinks,template) {
    resolveLinks = resolveLinks === false ? false : true;
    template = template || 'container.tmpl';

    var docData = {
      filename: filename,
      title: title,
      docs: docs
    };

    var outpath = path.join(outdir,filename);
    var html = view.render(template,docData);

    if(resolveLinks){
      // turn {@link foo} into <a href="foodoc.html">foo</a>
      html = helper.resolveLinks(html);
      // Add a link target for external links @davidshimjs
      html = html.toString().replace(/<a\s+([^>]*href\s*=\s*['"]*[^\s'"]*:\/\/)/ig, '<a target="_blank" $1');
    }

    html = html.replace(/(?:^|<\/pre>)[^]*?(?:<pre>|$)/g,function(m){
      return m.replace(/^\s*[\r]/gm,'');
    });

    fs.writeFileSync(outpath,html,'utf8');
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var tmplConf = env.conf.templates || {};
    tmplConf['default'] = tmplConf['default'] || {};

    var templatePath = opts.template;
    view = new template.Template(templatePath + '/tmpl');

    var urls = {
      index: helper.getUniqueFilename('index'),
      files: helper.getUniqueFilename('files'),
      packages: helper.getUniqueFilename('packages'),
      global: helper.getUniqueFilename('global')
    };

    _.each(urls,function(url,name){
      helper.registerLink(name,url);
    });

    // set up templating
    view.layout = 'layout.tmpl';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];

    data().each(function(doclet){
        if(doclet.examples){
          doclet.examples = doclet.examples.map(
            function(example){
              return prism.highlight(
                example.replace(/(<([^>]+)>)/ig,''),
                prism.languages.javascript
              );
            }
          );
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        if (doclet.meta) {
            var sourcePath = getPathFromDoclet(doclet);
            var resolvedSourcePath = resolveSourcePath(sourcePath);
            var linkPath = getLinkPath(tmplConf,sourcePath);

            sourceFiles[sourcePath] = {
                source: sourcePath,
                resolved: resolvedSourcePath,
                link: linkPath
            };
            sourceFilePaths.push(resolvedSourcePath);
        }
    });

    fs.mkPath(outdir);

    // copy the template's static files to outdir
    var fromDir = path.join(templatePath, 'static');
    var staticFiles = fs.ls(fromDir, 3);

    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });

    // copy user-specified static files to outdir
    var staticFilePaths;
    var staticFileFilter;
    var staticFileScanner;
    if (tmplConf['default'].staticFiles) {
        staticFilePaths = tmplConf['default'].staticFiles.paths || [];
        staticFileFilter = new (require('jsdoc/src/filter')).Filter(tmplConf['default'].staticFiles);
        staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function(filePath) {
            var extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function(fileName) {
                var sourcePath = fs.statSync(filePath).isDirectory() ? filePath :
                    path.dirname(filePath);
                var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    var commonPrefix = path.commonPrefix(sourceFilePaths);

    data().each(function(doclet){

        if(doclet.kind === 'file'){
          var url = urls.files+'#'+doclet.longname;
          helper.registerLink(doclet.longname,url);
        }
        else if(doclet.kind === 'package'){
          var url = urls.packages+'#'+doclet.longname;
          helper.registerLink(doclet.longname,url);
        }
        else{
          var url = helper.createLink(doclet);
          helper.registerLink(doclet.longname,url);
        }

        if(doclet.meta){
          var sourceFile = sourceFiles[getPathFromDoclet(doclet)];

          // replace the filename with a shortened version of the full path
          if(sourceFile.resolved){
            doclet.meta.filename = sourceFile.resolved
              .replace(commonPrefix,'')
              .replace(new RegExp('\\\\','g'), '/');
          }

          // replace link wildcards by doclet meta data
          if(sourceFile.link){
            doclet.meta.linkpath = sourceFile.link
              .replace("%lineno%",doclet.meta.lineno)
              .replace(new RegExp('\\\\','g'), '/');
          }
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if(needsSignature(doclet)){
          if(!doclet.hideconstructor){
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
          }
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            doclet.kind = 'member';
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // add template helpers
    view.find = find;
    view.linkto = helper.linkto;
    view.resolveAuthorLinks = helper.resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = helper.htmlsafe;
    view.members = members;

    view.navigation = require("./modules/navigation/navigation.js")(data,members);

    generate('Index',[{ kind: 'mainpage', readme: opts.readme }],urls.index);

    if(members.files.length){
      generate('Files',members.files,urls.files,true,'files.tmpl');
    }
    if(members.packages.length){
      generate('Packages',members.packages,urls.packages,true,'packages.tmpl');
    }
    if(members.globals.length){
      generate('Global',[{kind: 'globalobj'}],urls.global);
    }

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    var definitions = taffy(members.definitions);
    var interfaces = taffy(members.interfaces);

    for (var longname in helper.longnameToUrl) {
        if ( hasOwnProp.call(helper.longnameToUrl, longname) ) {
            var myClasses = helper.find(classes, {longname: longname});
            if (myClasses.length) {
                generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
            }

            var myNamespaces = helper.find(namespaces, {longname: longname});
            if (myNamespaces.length) {
                generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
            }

            var myMixins = helper.find(mixins, {longname: longname});
            if (myMixins.length) {
                generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
            }

            var myExternals = helper.find(externals, {longname: longname});
            if (myExternals.length) {
                generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
            }

            var myDefinitions = helper.find(definitions, {longname: longname});
            if (myDefinitions.length) {
                generate('Definition: ' + myDefinitions[0].name, myDefinitions, helper.longnameToUrl[longname]);
            }

            var myInterfaces = helper.find(interfaces, {longname: longname});
            if (myInterfaces.length) {
                generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
            }
        }
    }

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };

        var tutorialPath = path.join(outdir, filename),
            html = view.render('tutorial.tmpl', tutorialData);

        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
