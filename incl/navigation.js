module.exports = function(){
  var self = null;
  var _ = require('underscore');
  var helper = require('jsdoc/util/templateHelper');

  self = {
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
      var nav = [];

      if(members.namespaces.length){
        _.each(members.namespaces,function(member){
          nav.push(self.buildNavMember(data,member,'namespace'));
        });
      }

      if(members.classes.length){
        _.each(members.classes,function(member){
          nav.push(self.buildNavMember(data,member,'class'));
        });
      }

      return nav;
    }
  };

  return self;
};