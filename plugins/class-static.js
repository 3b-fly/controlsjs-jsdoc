exports.defineTags = function(dictionary){

  dictionary.defineTag('class-static',{
    onTagged: function(doclet,tag){
      doclet.addTag('kind','class');
      doclet.static = true;

      if(tag.value && tag.value.description){
        doclet.addTag('name',tag.value.description);
      }
      else if(tag.text){
        doclet.addTag('name',tag.text);
      }
    }
  });
};