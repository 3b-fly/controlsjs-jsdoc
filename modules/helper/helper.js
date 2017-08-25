module.exports = function(rootPath){
  var self = null;
  var fs = require('fs');
  var path = require('path');
  var _ = require('underscore');
  var less = require('less');
  var linkto = require('../jsdoc/templateHelper.js').linkto;

  self = {
    _file: [],
    _fileCache: [],
    _templateSettings: {
      evaluate: /<\?js([\s\S]+?)\?>/g,
      interpolate: /<\?js=([\s\S]+?)\?>/g,
      escape: /<\?js~([\s\S]+?)\?>/g
    },

    readFile: function(file){
      if(!self._fileCache[file]){
        var filePath = path.join(rootPath,file);
        self._fileCache[file] = fs.readFileSync(filePath,'utf8');
      }
      return self._fileCache[file];
    },

    renderLess: function(file){
      var css = '';
      less.render(self.readFile(file),{},function(error,output){
        if(error){console.log(error);}
        else{css = output.css;}
      });
      return css;
    },

    callTemplate: function(file,data){
      file = self.readFile(file);
      file = _.template(file,self._templateSettings);

      return file.call({
        data: data,
        linkto: linkto,
        partial: function(file,data){
          return self.callTemplate(file,data);
        },
        readFile: function(file){
          return self.readFile(file);
        },
        renderLess: function(file){
          return self.renderLess(file);
        }
      });
    }
  };

  return self;
};