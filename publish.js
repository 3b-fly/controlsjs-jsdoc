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
    if (
        (doclet.kind === 'function')
        || ((doclet.kind === 'class') && (doclet.scope !== 'static'))
    ) {
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

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    if (attribs.length) {
      f.attribs = '';
      for (var i in attribs){
        f.attribs += '<span class="type-signature ' + attribs[i] + '">' + helper.htmlsafe(attribs[i]) + '</span>';
      }
    }
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
  if(tmplConf.linkPaths && sourcePath){
    for(var srcPath in tmplConf.linkPaths){
      var absSrcPath = resolveSourcePath(srcPath);
      if(sourcePath.substring(0,absSrcPath.length) === absSrcPath){
        path = tmplConf.linkPaths[srcPath].replace(
          '%path%',sourcePath.substring(absSrcPath.length+1)
        );
      }
    };
  }
  return path;
}

function generate(title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks === false ? false : true;

    var docData = {
        filename: filename,
        title: title,
        docs: docs
    };

    var outpath = path.join(outdir, filename),
        html = view.render('container.tmpl', docData);

    if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        // Add a link target for external links @davidshimjs
        html = html.toString().replace(/<a\s+([^>]*href\s*=\s*['"]*[^\s'"]*:\/\/)/ig, '<a target="_blank" $1');
    }

    fs.writeFileSync(outpath,html.replace(/^\s*[\r]/gm,''),'utf8');
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbol;
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.module = symbols[module.longname];
            module.module.name = module.module.name.replace('module:', 'require("') + '")';
        }
    });
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

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

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
      doclet.attribs = '';

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

    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join(outdir, packageInfo.name, packageInfo.version);
    }
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

    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);
//TODO
        if (doclet.meta) {
            var sourceFile = sourceFiles[getPathFromDoclet(doclet)];

            // replace the filename with a shortened version of the full path
            if(sourceFile.resolved){
              doclet.meta.filename = sourceFile.resolved
                .replace(commonPrefix,'')
                .replace(new RegExp('\\\\','g'), '/');
            }

            // replace link wildcards by doclet meta data
            if(sourceFile.link){ //TODO
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

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
            addAttribs(doclet);
        }

    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
        }
    });

    var members = helper.getMembers(data);
    members.definitions = helper.find(data,{kind:'definition'});
    members.tutorials = tutorials.children;

    // add template helpers
    view.find = find;
    view.linkto = helper.linkto;
    view.resolveAuthorLinks = helper.resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = helper.htmlsafe;
    view.members = members;

    // once for all
    view.navigation = require("./modules/navigation/navigation.js")(data,members);

    attachModuleSymbols( find({ kind: ['class', 'function'], longname: {left: 'module:'} }),
        members.modules );

    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }

    // index page displays information from package.json and lists files
    var files = find({kind: 'file'}),
        packages = find({kind: 'package'});

    generate('Index',
        packages.concat(
            [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}]
        ).concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    var definitions = taffy(members.definitions);
    var interfaces = taffy(members.interfaces);
//console.log(members);
    for (var longname in helper.longnameToUrl) {
        if ( hasOwnProp.call(helper.longnameToUrl, longname) ) {
            var myClasses = helper.find(classes, {longname: longname});
            if (myClasses.length) {
                generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
            }

            var myModules = helper.find(modules, {longname: longname});
            if (myModules.length) {
                generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
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
