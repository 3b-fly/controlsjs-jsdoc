module.exports = function(data,members){
  var self = null;
  var fs = require('fs');
  var path = require('path');
  var _ = require('underscore');
  var helper = require('jsdoc/util/templateHelper');

  self = {
    _nav: [],
    _templateFile: null,
    _fileSettings: {
      evaluate: /<\?js([\s\S]+?)\?>/g,
      interpolate: /<\?js=([\s\S]+?)\?>/g,
      escape: /<\?js~([\s\S]+?)\?>/g
    },

    buildNavMember: function(data,member,type){
      return {
        type: type,
        name: member.name,
        longname: member.longname,
        static: member.static,
        properties: member.properties,

        members: helper.find(data,{
          kind: 'member',
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
        typedefs: helper.find(data,{
          kind: 'typedef',
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

    buildNav: function(data,members){
      self._nav = [];

      if(members.modules.length){
        _.each(members.modules,function(module){
          self._nav.push(self.buildNavMember(data,module,'module'));
        });
      }

      if(members.namespaces.length){
        _.each(members.namespaces,function(member){
          self._nav.push(self.buildNavMember(data,member,'namespace'));
        });
      }

      if(members.classes.length){
        _.each(members.classes,function(member){
          self._nav.push(self.buildNavMember(data,member,'class'));
        });
      }
    },

    loadTemplateFile: function(){
      if(!self._templateFile){
        var filePath = path.join(__dirname,'navigation.tmpl');
        self._templateFile = _.template(
          fs.readFileSync(filePath,'utf8'),null,self._fileSettings
        );
      }
      return self._templateFile;
    },

    generate: function(template){
      self._nav.linkto = template.linkto;
      return self.loadTemplateFile().call(self._nav);
    }
  };

  if(data && members){self.buildNav(data,members);}

  return self;
};