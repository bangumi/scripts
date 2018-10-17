// ==UserScript==
// @name         Bangumi Endless MAGI
// @namespace    https://github.com/bangumi/scripts/liaune
// @version      1.0
// @description  MAGI无尽试炼
// @author       Liaune
// @include      /^https?://(bangumi\.tv|bgm\.tv|chii\.in)/(magi$|magi/q/\d+)
// ==/UserScript==

(function() {
     if($('#columnAppA .magiQuiz .quizInfo').length==0){
         var n = Math.round(Math.random()*6000);
         window.location.pathname = 'magi/q/'+ n;
     }
     
     else{
         let answer;
         let opts = document.querySelectorAll('#columnAppA .magiQuiz .clearit .opts li');
         opts.forEach( (elem, index) =>{
             if(elem.querySelector('.rr')) {
                 if(elem.querySelector('.rr').innerText=="正确答案" || elem.querySelector('.rr').innerText=="回答正确")
                  {answer = elem;}
                 $(elem.querySelector('.rr')).hide();
                 elem.className='';
             }
             elem.addEventListener('click', function(){
               if(elem.querySelector('.rr')){
                 if(elem.querySelector('.rr').innerText=="正确答案" || elem.querySelector('.rr').innerText=="回答正确") {
                     $(elem.querySelector('.rr')).show();
                     elem.className='answer';
                 }
                 else{
                   elem.className='wrong';
                   answer.className='answer';
                 }
                 }
                 else{
                     elem.className='wrong';
                     answer.className='answer';
                 }
             });
         });
     }
    
})();
