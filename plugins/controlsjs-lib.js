exports.defineTags = function(dictionary){

  dictionary.defineTag('controlsjs-package',{
    canHaveName: true,
    onTagged: function(doclet,tag){
      doclet.addTag('kind','package');

      if(tag.value && tag.value.description){
        doclet.addTag('name',tag.value.description);
      }
      else if(tag.text){
        doclet.addTag('name',tag.text);
      }
    },
    synonyms: ['cjs-pkg']
  });

  dictionary.defineTag('controlsjs-inpackage',{
    onTagged: function(doclet,tag){
      var packages = tag.value.split('|');

      if(packages && packages.length && packages.forEach){
        if(!doclet.packages){doclet.packages = [];}

        packages.forEach(function(name){
          doclet.packages.push({
            longname: 'package:'+name,
            name: name
          });
        });
      }
    },
    synonyms: ['cjs-inpkg']
  });
};