exports.defineTags = function(dictionary){

  dictionary.defineTag('controlsjs-definition',{
    canHaveName: true,
    onTagged: function(doclet,tag){
      doclet.addTag('kind','definition');

      if(tag.value && tag.value.name){
        doclet.addTag('name',tag.value.name);
      }
    },
    synonyms: ['cjs-def']
  });
};