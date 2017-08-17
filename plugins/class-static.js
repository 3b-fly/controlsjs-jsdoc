exports.defineTags = function(dictionary){
  
  dictionary.defineTag('class-static',{
    onTagged: function(doclet,tag){
      doclet.addTag('kind','class');
      doclet.static = true;

      if(tag.value && tag.value.name){
        doclet.addTag('name',tag.value.name);
      }
    }
  });
};