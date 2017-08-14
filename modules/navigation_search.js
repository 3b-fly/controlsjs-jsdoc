(function(){
  var searchBox = document.getElementById('nav-search');
  var searchList = document.getElementById('nav-list');

  if(!searchBox || !searchList){return;}

  var onKeyUp = function(){
    searchBox.search();
  };

  searchBox.search = function(){
    var value = (searchBox.value)
      ? searchBox.value.trim().toLowerCase()
      : null;

    var testElm = function(elm){
      if(
        (typeof elm.hasAttribute !== 'function')
        || !elm.hasAttribute('data-name')
      ){return undefined;}

      var name = elm.getAttribute('data-name').trim().toLowerCase();
      return (!value || (name.indexOf(value) > -1));
    };

    var searchInChildren = function(parent){
      var containsVisible = undefined;
      if(parent.children && (parent.children.length > 0)){

        for(var i in parent.children){
          var child = parent.children[i];

          var matches = searchInChildren(child) || testElm(child);
          if(typeof matches !== 'undefined'){
            if(matches){containsVisible = true;}
            else if(typeof containsVisible === 'undefined'){
              containsVisible = false;
            }
            child.style.display = (matches) ? 'block' : 'none';
          }
        }
      }
      return containsVisible;
    };

    searchInChildren(searchList);
  };

  if(searchBox.addEventListener){
    searchBox.addEventListener('keyup',onKeyUp);
    searchBox.style.display = 'block';
    searchBox.search();
  }
  else if(searchBox.attachEvent){
    searchBox.attachEvent('onkeyup',onKeyUp);
    searchBox.style.display = 'block';
    searchBox.search();
  }
})();