module.exports = function(data,members){
  var self = null;
  var fs = require('fs');
  var path = require('path');
  var _ = require('underscore');
  var less = require('less');
  var helper = require('jsdoc/util/templateHelper');

  self = {
    _nav: [],
    _template: null,
    _fileCache: [],
    _templateSettings: {
      evaluate: /<\?js([\s\S]+?)\?>/g,
      interpolate: /<\?js=([\s\S]+?)\?>/g,
      escape: /<\?js~([\s\S]+?)\?>/g
    },

    getMemberSignatures: function(member){
      var signs = [];

      if(member.type && member.type.names){
        for(var i in member.type.names){
          signs.push(member.type.names[i]);
        }
      }

      var kindSignature = null;
      switch(member.kind){
        case 'module': kindSignature = 'module'; break;
        case 'namespace': kindSignature = 'namespace'; break;
        case 'class':
          kindSignature = (member.hideconstructor) ? 'object' : 'class';
        break;
      }

      if(kindSignature && signs.indexOf(kindSignature) < 0){
        signs.unshift(kindSignature);
      }

      return signs;
    },

    addNavName: function(target){
      if(Array.isArray(target)){
        _.each(target,function(item){self.addNavName(item);});
      }
      else if(target){
        var name = (target.longname) ? target.longname : target.name;
        target.navname = (name) ? name.substring(name.indexOf(':')+1) : '';
      }
    },

    addNavItemNames: function(item){
      self.addNavName(item);
      self.addNavName(item.properties);
      self.addNavName(item.typedefs);
      self.addNavName(item.members);
      self.addNavName(item.definitions);
      self.addNavName(item.interfaces);
      self.addNavName(item.methods);
      self.addNavName(item.callbacks);
      self.addNavName(item.events);
    },

    buildNavItem: function(data,member,type){
      return {
        type: type,
        name: member.name,
        longname: member.longname,
        memberof: member.memberof,
        properties: member.properties,
        signatures: self.getMemberSignatures(member),
        childitems: [],

        typedefs: helper.find(data,{
          kind: 'typedef',
          memberof: member.longname
        }),
        members: helper.find(data,{
          kind: 'member',
          memberof: member.longname
        }),
        definitions: helper.find(data,{
          kind: 'definition',
          memberof: member.longname
        }),
        interfaces: helper.find(data,{
          kind: 'interface',
          memberof: member.longname
        }),
        methods: helper.find(data,{
          kind: 'function',
          callback: {isUndefined: true},
          memberof: member.longname
        }),
        callbacks: helper.find(data,{
          kind: 'function',
          callback: true,
          memberof: member.longname
        }),
        events: helper.find(data,{
          kind: 'event',
          memberof: member.longname
        })
      };
    },

    buildNavItems: function(data,members){
      var items = {};

      if(members.modules.length){
        _.each(members.modules,function(member){
          items[member.longname] = self.buildNavItem(data,member,'module');
        });
      }

      if(members.namespaces.length){
        _.each(members.namespaces,function(member){
          items[member.longname] = self.buildNavItem(data,member,'namespace');
        });
      }

      if(members.classes.length){
        _.each(members.classes,function(member){
          items[member.longname] = self.buildNavItem(data,member,'class');
        });
      }

      return items;
    },

    buildNav: function(data,members){
      self._nav = [];
      var items = self.buildNavItems(data,members);

      for(var longname in items){
        var item = items[longname];
        self.addNavItemNames(item);

        var parentItem = items[item.memberof];
        if(parentItem){parentItem.childitems.push(item);}
        else{self._nav.push(item);}
      }
    },

    readFile: function(file){
      if(!self._fileCache[file]){
        var filePath = path.join(__dirname,file);
        self._fileCache[file] = fs.readFileSync(filePath,'utf8');
      }
      return self._fileCache[file];
    },

    renderLess: function(file){
      var css = '';
      less.render(self.readFile(file),{},function(error,output){
        if(error){console.log(error);}
        else{css = output.css;}
      });
      return css;
    },

    callTemplate: function(file,data){
      file = self.readFile(file);
      file = _.template(file,self._templateSettings);

      return file.call({
        data: data,
        linkto: self._template.linkto,
        partial: function(file,data){
          return self.callTemplate(file,data);
        },
        readFile: function(file){
          return self.readFile(file);
        },
        renderLess: function(file){
          return self.renderLess(file);
        }
      });
    },

    generate: function(template){
      self._template = template;
      return self.callTemplate('navigation.tmpl',self._nav);
    }
  };

  if(data && members){self.buildNav(data,members);}

  return self;
};