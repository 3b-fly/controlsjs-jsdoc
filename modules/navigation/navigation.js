module.exports = function(data,members){
  var self = null;
  var helper = require('../helper/helper.js')(__dirname);

  self = {
    _nav: [],
    _modules: [],
    _files: [],
    _links: [],

    getMemberSignatures: function(member){
      var signs = [];

      if(member.type && member.type.names){
        for(var i in member.type.names){
          signs.push(member.type.names[i]);
        }
      }

      var kindSignature = null;
      switch(member.kind){
        case 'namespace':
          kindSignature = 'namespace';
        break;
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
        for(var i in target){
          self.addNavName(target[i]);
        }
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

        typedefs: data({
          kind: 'typedef',
          memberof: member.longname
        }).get(),
        members: data({
          kind: 'member',
          memberof: member.longname
        }).get(),
        definitions: data({
          kind: 'definition',
          memberof: member.longname
        }).get(),
        interfaces: data({
          kind: 'interface',
          memberof: member.longname
        }).get(),
        methods: data({
          kind: 'function',
          callback: {isUndefined: true},
          memberof: member.longname
        }).get(),
        callbacks: data({
          kind: 'function',
          callback: true,
          memberof: member.longname
        }).get(),
        events: data({
          kind: 'event',
          memberof: member.longname
        }).get()
      };
    },

    buildNavItems: function(data,members){
      var items = {};

      if(members){
        if(members.namespaces && members.namespaces.length){
          for(var i in members.namespaces){
            var member = members.namespaces[i];
            items[member.longname] = self.buildNavItem(
              data,member,'namespace'
            );
          };
        }

        if(members.classes && members.classes.length){
          for(var j in members.classes){
            var member = members.classes[j];
            items[member.longname] = self.buildNavItem(
              data,member,'class'
            );
          };
        }
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

      self._modules = [];
      self._files = [];
      if(members){
        if(members.modules){self._modules = members.modules;}
        if(members.files){self._files = members.files;}
      }
    },

    buildLinks: function(){
      self._links = [];
      if(env.conf.templates && env.conf.templates.socialLinks){
        for(var name in env.conf.templates.socialLinks){
          var link = env.conf.templates.socialLinks[name];
          if(typeof link === 'string'){
            self._links.push({name: name, url: link});
          }
        }
      }
    },

    generate: function(){
      return helper.callTemplate('navigation.tmpl',{
        modules: self._modules,
        files: self._files,
        links: self._links,
        members: self._nav
      });
    }
  };

  if(data && members){
    self.buildNav(data,members);
    self.buildLinks();
  }

  return self;
};