{{app.head}}

const target = (function(){
    // jshint -W067
    return this || (0, eval)('this');
})();
const namespace = `{{namespace}}`;
(function(namespace) {
"use struct";

namespace.author = `{{author}}`;

(function(){
{{common}}
})();

(function(app){

(function(){
{{appbase}}
})();

(function(){
{{app.app}}
})();

})(namespace.app||(namespace.app={}));

})(target[namespace]||(target[namespace]={}));