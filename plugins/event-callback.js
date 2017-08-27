exports.defineTags = function(dictionary){

  dictionary.defineTag('event-callback',{
    onTagged: function(doclet,tag){
      doclet.addTag('kind','event-callback');

      if(tag.value && tag.value.description){
        doclet.addTag('name',tag.value.description);
      }
      else if(tag.text){
        doclet.addTag('name',tag.text);
      }
    }
  });
};