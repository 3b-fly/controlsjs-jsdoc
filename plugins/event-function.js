exports.defineTags = function(dictionary) {
  dictionary.defineTag("event-function", {
    onTagged: function(doclet,tag) {
      doclet.addTag('kind','event');
      doclet.is_function = true;

      if (tag.value && tag.value.name) {
        doclet.addTag('name',tag.value.name);
      }
    }
  });
};