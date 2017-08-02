exports.defineTags = function(dictionary) {
  dictionary.defineTag("event-callback", {

    onTagged: function(doclet,tag) {

      doclet.addTag('kind','function');
      doclet.callback = true;

      if (tag.value && tag.value.name) {
        doclet.addTag('name',tag.value.name);
      }
    }
  });
};