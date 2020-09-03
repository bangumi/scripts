{{app.head}}

const target = top.document;
const namespace = `{{namespace}}`;
(function(namespace) {
"use struct"

namespace.author = `{{author}}`;

!function(){
{{common}}
}();

!function(app){

!function(){
{{appbase}}
}();

!function(){
{{app.app}}
}();

}(namespace.app||(namespace.app={}));

})(target[namespace]||(target[namespace]={}));