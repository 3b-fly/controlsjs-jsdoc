exports.defineTags = function(dictionary){

  dictionary.defineTag("controlsjs-library",{
    onTagged: function(doclet,tag){
      doclet.cjs_lib = tag.value;
    }
  });

  dictionary.defineTag("controlsjs-package",{
    onTagged: function(doclet,tag){
      if(!doclet.cjs_pkgs){doclet.cjs_pkgs = [];}
      doclet.cjs_pkgs.push(tag.value);
    }
  });
};