exports.defineTags = function(dictionary){
  //clear build-in dictionaries result
  dictionary._tags = {};
  dictionary._tagSynonyms = {};
  dictionary._namespaces = [];

  var tagDefs = {};

  //use these tags from jsdoc dictionary
  var definitions = require('jsdoc/tag/dictionary/definitions');
  if(definitions.jsdocTags){
    var tagsMap = {
      //internal
      also: 'also',
      description: 'description',
      kind: 'kind',
      name: 'name',
      undocumented: 'undocumented',
      //base
      abstract: 'abstract',
      access: 'access',
      alias: 'alias',
      async: 'async',
      augments: 'augments',
      author: 'author',
      borrows: 'borrows',
      class: 'class',
      classdesc: 'classdesc',
      constant: 'constant',
      constructs: 'constructs',
      copyright: 'copyright',
      default: 'default',
      deprecated: 'deprecated',
      enum: 'enum',
      example: 'example',
      external: 'external',
      file: 'file',
      fires: 'fires',
      function: 'function',
      generator: 'generator',
      global: 'global',
      hideconstructor: 'hideconstructor',
      ignore: 'ignore',
      implements: 'implements',
      inheritdoc: 'inheritdoc',
      inner: 'inner',
      instance: 'instance',
      interface: 'interface',
      lends: 'lends',
      license: 'license',
      listens: 'listens',
      member: 'member',
      memberof: 'memberof',
      mixes: 'mixes',
      mixin: 'mixin',
      modifies: 'modifies',
      namespace: 'namespace',
      param: 'param',
      private: 'private',
      property: 'property',
      protected: 'protected',
      public: 'public',
      readonly: 'readonly',
      requires: 'requires',
      returns: 'returns',
      see: 'see',
      since: 'since',
      static: 'static',
      summary: 'summary',
      this: 'this',
      todo: 'todo',
      throws: 'throws',
      tutorial: 'tutorial',
      type: 'type',
      typedef: 'typedef',
      variation: 'variation',
      version: 'version',
      yields: 'yields'
    };

    for(var tagName in tagsMap){
      var tagDef = definitions.jsdocTags [tagName];
      if(tagDef){tagDefs[tagsMap[tagName]] = tagDef;}
    }
  }

  //add new tags
  tagDefs.package = {
    canHaveName: true,
    isNamespace: true,
    onTagged: function(doclet,tag){
      doclet.addTag('kind','package');

      if(tag.value && tag.value.description){
        doclet.addTag('name',tag.value.description);
      }
      else if(tag.text){
        doclet.addTag('name',tag.text);
      }
    }
  };

  tagDefs.inpackage = {
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
    }
  };

  tagDefs.definition = {
    canHaveName: true,
    isNamespace: true,
    onTagged: function(doclet,tag){
      doclet.addTag('kind','definition');

      if(tag.value && tag.value.name){
        doclet.addTag('name',tag.value.name);
      }
    }
  };

  tagDefs.event = {
    isNamespace: true,
    onTagged: function(doclet,tag){
      doclet.addTag('kind','event');

      if(tag.value && tag.value.description){
        doclet.addTag('name',tag.value.description);
      }
      else if(tag.text){
        doclet.addTag('name',tag.text);
      }
    }
  };

  definitions.defineTags(dictionary,tagDefs);
};