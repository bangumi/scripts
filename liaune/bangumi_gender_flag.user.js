// ==UserScript==
// @name         Bangumi用户性别标识
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.1
// @description  在用户主页标记性别，在用户名的旁边显示性别标识
// @author       Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/.*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    GM_addStyle(`
.un_flag {
font-weight: normal;
background-color: lightgrey;
color: white;
display: inline-block;
padding: 0px 3px;
border-radius: 3px;
transform: scale(0.8) translate(1px, -4px);
}
.male_flag {
font-weight: normal;
background-color: #369cf8;
color: white;
display: inline-block;
padding: 0px 3px;
border-radius: 3px;
transform: scale(0.8) translate(1px, -4px);
}
.female_flag {
font-weight: normal;
background-color: #f09199;
color: white;
display: inline-block;
padding: 0px 3px;
border-radius: 3px;
transform: scale(0.8) translate(1px, -4px);
}
`);
    let gender_data;
    if(localStorage.getItem('bangumi_gender_data'))
        gender_data = JSON.parse(localStorage.getItem('bangumi_gender_data'));
    else
        gender_data = {"male":[],"female":[]};
    if(location.href.match(/user\/[^\/]+$/)){
        let id = location.href.split('/').pop();
        let male_flag = document.createElement('span'); male_flag.href='javascript:;'; male_flag.textContent = '♂';
        let female_flag = document.createElement('span'); female_flag.href='javascript:;'; female_flag.textContent = '♀';
        if(gender_data.male.includes(id)){
            male_flag.className = "male_flag";
            $("h1.nameSingle .inner a").after($(male_flag));
        }
        else if(gender_data.female.includes(id)){
            female_flag.className = "female_flag";
            $("h1.nameSingle .inner a").after($(female_flag));
        }
        else{
            male_flag.className = "un_flag";
            female_flag.className = "un_flag";
            $("h1.nameSingle .inner a").after($(male_flag));
            $("h1.nameSingle .inner a").after($(female_flag));
        }
        male_flag.addEventListener('click', function(){
            if(gender_data.male.includes(id)){
                male_flag.className = "un_flag";
                gender_data.male.splice(gender_data.male.indexOf(id),1);
                localStorage.setItem('bangumi_gender_data',JSON.stringify(gender_data));
            }
            else{
                male_flag.className = "male_flag";
                gender_data.male.push(id);
                localStorage.setItem('bangumi_gender_data',JSON.stringify(gender_data));
            }
        });
        female_flag.addEventListener('click', function(){
            if(gender_data.female.includes(id)){
                female_flag.className = "un_flag";
                gender_data.female.splice(gender_data.female.indexOf(id),1);
                localStorage.setItem('bangumi_gender_data',JSON.stringify(gender_data));
            }
            else{
                female_flag.className = "female_flag";
                gender_data.female.push(id);
                localStorage.setItem('bangumi_gender_data',JSON.stringify(gender_data));
            }
        });
    }
    let all = $('a.l')
    for (let i = 0; i < all.length; i++) {
        let id = all[i].href.split('/').pop()
        if (gender_data.male.includes(id)) {
            $(all[i]).after($(`<span class="male_flag">♂</span>`))
        }
        else if (gender_data.female.includes(id)) {
            $(all[i]).after($(`<span class="female_flag">♀</span>`))
        }
    }
})();
