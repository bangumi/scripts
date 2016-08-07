// @name         Bangumi Personal Calendar
// @namespace    fitailsh
// @version      0.8
// @description  番组计划(bgm.tv)个性化每日放送，根据指定目录的动画列表来显示放送内容
// @author       fitailsh@Twitter
// @match        https://bgm.tv/
// @match        http://bgm.tv/
// @match        http://bangumi.tv/
// @match        http://chii.in/
// @grant        none
// ==/UserScript==

function getContent(url)
{
    var xmlHttp=new XMLHttpRequest();
    xmlHttp.open("GET",url,false);
    xmlHttp.send();
    return xmlHttp.responseText;
}

function getIndexURL ()
{
    var indexURL = prompt("请输入目录地址，https网页请加s，跨域会报错");
    return indexURL;
}

function getData(context)
{
    var dateDis = 37,hrefDis = 107,imgDis = 79;
    var Mon=[],Tue=[],Wed=[],Thu=[],Fri=[],Sat=[],Sun=[];
    var MonName=[],TueName=[],WedName=[],ThuName=[],FriName=[],SatName=[],SunName=[];
    var MonImg=[],TueImg=[],WedImg=[],ThuImg=[],FriImg=[],SatImg=[],SunImg=[];
    var MonStartDate=[],TueStartDate=[],WedStartDate=[],ThuStartDate=[],FriStartDate=[],SatStartDate=[],SunStartDate=[];
    var temp = context;
    //Get total number
    var reg= new RegExp("ico_subject_type","g");
    var total = temp.match(reg).length;
    //loop
    var x=0;
    while (x<total) {
        var dtFlag,href,bangumiName,imageURL,startDate;
        var temp1;
        // Get Date
        var t = temp.indexOf("info tip");
        if (t) {
            var ddd = temp.substr(t+dateDis,11);
            var year = ddd.split("年");
            var month = year[1].split("月");
            var day = month[1].split("日");
            startDate = new Date(year[0], month[0], day[0]);
            //month-1
            startDate.setMonth(startDate.getMonth() - 1);
            dtFlag = startDate.getDay();
            temp1 = temp.replace("info tip","");
            temp = temp1;
        }
        // Get Href and Bangumi Name;
        t = temp.indexOf("ico_subject_type");
        if (t) {
            href = temp.substr(t+hrefDis,15);
            var t1 = temp.indexOf("</a>",t+hrefDis);
            bangumiName = temp.substring(t+134,t1);
            temp1 = temp.replace("ico_subject_type","");
            temp = temp1;
        }
        // Get Image URL
        t = temp.indexOf("subjectCover");
        if (t) {
            imageURL = temp.substr(t+imgDis,48);
            var t2= imageURL.replace("s","g");
            imageURL = t2;
            temp1 = temp.replace("subjectCover","");
            temp =temp1;
        }
        // Save to Array
        switch (dtFlag)
        {
            case 0:
                Sun.push(href);
                SunName.push(bangumiName);
                SunImg.push(imageURL);
                SunStartDate.push(startDate);
                break;
            case 1:
                Mon.push(href);
                MonName.push(bangumiName);
                MonImg.push(imageURL);
                MonStartDate.push(startDate);
                break;
            case 2:
                Tue.push(href);
                TueName.push(bangumiName);
                TueImg.push(imageURL);
                TueStartDate.push(startDate);
                break;
            case 3:
                Wed.push(href);
                WedName.push(bangumiName);
                WedImg.push(imageURL);
                WedStartDate.push(startDate);
                break;
            case 4:
                Thu.push(href);
                ThuName.push(bangumiName);
                ThuImg.push(imageURL);
                ThuStartDate.push(startDate);
                break;
            case 5:
                Fri.push(href);
                FriName.push(bangumiName);
                FriImg.push(imageURL);
                FriStartDate.push(startDate);
                break;
            case 6:
                Sat.push(href);
                SatName.push(bangumiName);
                SatImg.push(imageURL);
                SatStartDate.push(startDate);
                break;
        }
        //Variable Add
        x++;
    }
    // Save to local
    if (Sun.length > 0) {
        localStorage.Sun = JSON.stringify(Sun);
        localStorage.SunName = JSON.stringify(SunName);
        localStorage.SunImg = JSON.stringify(SunImg);
        localStorage.SunStartDate = JSON.stringify(SunStartDate);
    }
    if (Mon.length > 0) {
        localStorage.Mon = JSON.stringify(Mon);
        localStorage.MonName = JSON.stringify(MonName);
        localStorage.MonImg = JSON.stringify(MonImg);
        localStorage.MonStartDate = JSON.stringify(MonStartDate);
    }
    if (Tue.length > 0) {
        localStorage.Tue = JSON.stringify(Tue);
        localStorage.TueName = JSON.stringify(TueName);
        localStorage.TueImg = JSON.stringify(TueImg);
        localStorage.TueStartDate = JSON.stringify(TueStartDate);
    }
    if (Wed.length > 0) {
        localStorage.Wed = JSON.stringify(Wed);
        localStorage.WedName = JSON.stringify(WedName);
        localStorage.WedImg = JSON.stringify(WedImg);
        localStorage.WedStartDate = JSON.stringify(WedStartDate);
    }
    if (Thu.length > 0) {
        localStorage.Thu = JSON.stringify(Thu);
        localStorage.ThuName = JSON.stringify(ThuName);
        localStorage.ThuImg = JSON.stringify(ThuImg);
        localStorage.ThuStartDate = JSON.stringify(ThuStartDate);
    }
    if (Fri.length > 0) {
        localStorage.Fri = JSON.stringify(Fri);
        localStorage.FriName = JSON.stringify(FriName);
        localStorage.FriImg = JSON.stringify(FriImg);
        localStorage.FriStartDate = JSON.stringify(FriStartDate);
    }
    if (Sat.length > 0) {
        localStorage.Sat = JSON.stringify(Sat);
        localStorage.SatName = JSON.stringify(SatName);
        localStorage.SatImg = JSON.stringify(SatImg);
        localStorage.SatStartDate = JSON.stringify(SatStartDate);
    }
    //return
    return "success";
}

function localClear()
{
    localStorage.removeItem("Mon");
    localStorage.removeItem("MonName");
    localStorage.removeItem("MonImg");
    localStorage.removeItem("Tue");
    localStorage.removeItem("TueName");
    localStorage.removeItem("TueImg");
    localStorage.removeItem("Wed");
    localStorage.removeItem("WedName");
    localStorage.removeItem("WedImg");
    localStorage.removeItem("Thu");
    localStorage.removeItem("ThuName");
    localStorage.removeItem("ThuImg");
    localStorage.removeItem("Fri");
    localStorage.removeItem("FriName");
    localStorage.removeItem("FriImg");
    localStorage.removeItem("Sat");
    localStorage.removeItem("SatName");
    localStorage.removeItem("SatImg");
    localStorage.removeItem("Sun");
    localStorage.removeItem("SunName");
    localStorage.removeItem("SunImg");
    //
    localStorage.removeItem("MonStartDate");
    localStorage.removeItem("TueStartDate");
    localStorage.removeItem("WedStartDate");
    localStorage.removeItem("ThuStartDate");
    localStorage.removeItem("FriStartDate");
    localStorage.removeItem("SatStartDate");
    localStorage.removeItem("SunStartDate");
    console.log("clear success");
}


function updateData()
{
    var indexURL = getIndexURL();
    if (indexURL) {
        var str=getContent(indexURL+"?cat=2");
        localClear();
        var s = getData(str);
        console.log("update success");
        var flag = "1";
        localStorage.isApply = JSON.stringify(flag);
        return;
    }
    console.log("update error");
}

function changeApply()
{
    var applyFlag = getArr(localStorage.isApply);
    var flag;
    if (applyFlag == "1") {
        flag = "0";
        localStorage.isApply = JSON.stringify(flag);
        alert("已停用个性化");
        location.reload();
    }
    else {
        flag = "1";
        localStorage.isApply = JSON.stringify(flag);
        alert("已启动个性化");
        location.reload();
    }
}

function showUpdateButton()
{
    var t = document.getElementById('home_calendar') ;
    var button = document.createElement('input');
    button.type="button";
    button.setAttribute("id","updateButton");
    button.value="更新数据";
    button.className="inputBtn";
    button.style.marginBottom = "10px";
    t.appendChild(button);
    $('#updateButton').click(function() {
        updateData();
        location.reload();
    });
    //恢复
    var button1 = document.createElement('input');
    button1.type="button";
    button1.setAttribute("id","backButton");
    button1.value="是否应用个性化";
    button1.className="inputBtn";
    button1.style.marginBottom = "10px";
    button1.style.marginLeft = "5px";
    t.appendChild(button1);
    $('#backButton').click(function() {
        changeApply();
    });
}

function getArr(jText)
{
   var arr = JSON.parse(jText);
   return arr;
}

function showCalendar()
{
var Today=[],TodayName = [], TodayImg=[], TodayStartDate=[];
var TMR =[], TMRName = [], TMRImg = [], TMRStartDate=[];
    //Show or Not
    var flag = getArr(localStorage.isApply);
    if (flag =="0") {
        return;
    }
    //Get Today and Get Local Data
    var dt = new Date();
    var dtFlag = dt.getDay();
    switch (dtFlag)
        {
           case 0:
                if (localStorage.Sun) {
                    Today = getArr(localStorage.Sun);
                    TodayName = getArr(localStorage.SunName);
                    TodayImg = getArr(localStorage.SunImg);
                    TodayStartDate = getArr(localStorage.SunStartDate);
                }
                if (localStorage.Mon) {
                    TMR = getArr(localStorage.Mon);
                    TMRName = getArr(localStorage.MonName);
                    TMRImg = getArr(localStorage.MonImg);
                    TMRStartDate = getArr(localStorage.MonStartDate);
                }
                break;
            case 1:
                if (localStorage.Mon) {
                    Today = getArr(localStorage.Mon);
                    TodayName = getArr(localStorage.MonName);
                    TodayImg = getArr(localStorage.MonImg);
                    TodayStartDate = getArr(localStorage.MonStartDate);
                }
                if (localStorage.Tue) {
                    TMR = getArr(localStorage.Tue);
                    TMRName = getArr(localStorage.TueName);
                    TMRImg = getArr(localStorage.TueImg);
                    TMRStartDate = getArr(localStorage.TueStartDate);
                }
                break;
            case 2:
                if (localStorage.Tue) {
                    Today = getArr(localStorage.Tue);
                    TodayName = getArr(localStorage.TueName);
                    TodayImg = getArr(localStorage.TueImg);
                    TodayStartDate = getArr(localStorage.TueStartDate);
                }
                if (localStorage.Wed) {
                    TMR = getArr(localStorage.Wed);
                    TMRName = getArr(localStorage.WedName);
                    TMRImg = getArr(localStorage.WedImg);
                    TMRStartDate = getArr(localStorage.WedStartDate);
                }
                break;
            case 3:
                if (localStorage.Wed) {
                    Today = getArr(localStorage.Wed);
                    TodayName = getArr(localStorage.WedName);
                    TodayImg = getArr(localStorage.WedImg);
                    TodayStartDate = getArr(localStorage.WedStartDate);
                }
                if (localStorage.Thu) {
                    TMR = getArr(localStorage.Thu);
                    TMRName = getArr(localStorage.ThuName);
                    TMRImg = getArr(localStorage.ThuImg);
                    TMRStartDate = getArr(localStorage.ThuStartDate);
                }
                break;
            case 4:
                if (localStorage.Thu) {
                    Today = getArr(localStorage.Thu);
                    TodayName = getArr(localStorage.ThuName);
                    TodayImg = getArr(localStorage.ThuImg);
                    TodayStartDate = getArr(localStorage.ThuStartDate);
                }
                if (localStorage.Fri) {
                    TMR = getArr(localStorage.Fri);
                    TMRName = getArr(localStorage.FriName);
                    TMRImg = getArr(localStorage.FriImg);
                    TMRStartDate = getArr(localStorage.FriStartDate);
                }
                break;
            case 5:
                if (localStorage.Fri) {
                    Today = getArr(localStorage.Fri);
                    TodayName = getArr(localStorage.FriName);
                    TodayImg = getArr(localStorage.FriImg);
                    TodayStartDate = getArr(localStorage.FriStartDate);
                }
                if (localStorage.Sat) {
                    TMR = getArr(localStorage.Sat);
                    TMRName = getArr(localStorage.SatName);
                    TMRImg = getArr(localStorage.SatImg);
                    TMRStartDate = getArr(localStorage.SatStartDate);
                }
                break;
            case 6:
                if (localStorage.Sat) {
                    Today = getArr(localStorage.Sat);
                    TodayName = getArr(localStorage.SatName);
                    TodayImg = getArr(localStorage.SatImg);
                    TodayStartDate = getArr(localStorage.SatStartDate);
                }
                if (localStorage.Sun) {
                    TMR = getArr(localStorage.Sun);
                    TMRName = getArr(localStorage.SunName);
                    TMRImg = getArr(localStorage.SunImg);
                    TMRStartDate = getArr(localStorage.SunStartDate);
                }
                break;
        }
    //Change Content
    var el = document.getElementsByClassName('calendarMini')[0];
    var content = el.innerHTML;
    var i = 0;
    var todayContent ="";
    var todayDate = new Date();
    var tmrDate = new Date();
    tmrDate.setDate(tmrDate.getDate()+1);
    while (i < Today.length) {
        var temp ="";
        if (Date.parse(todayDate) >= Date.parse(TodayStartDate[i])) {
            temp = "<a href=\""+Today[i]+"\""+" class=\"thumbTip\"" +
                " title=\""+ TodayName[i]+"\">"+
                "<img src=\""+TodayImg[i]+"\"></a>";
            todayContent += temp;
        }
        i++;
    }
    i = 0;
    var TMRContent = "";
    while (i < TMR.length) {
        var temp1 ="";
        if (Date.parse(tmrDate) >= Date.parse(TMRStartDate[i])) {
        temp1 = "<a href=\""+TMR[i]+"\""+" class=\"thumbTip\"" +
            " title=\""+ TMRName[i]+"\">"+
            "<img src=\""+TMRImg[i]+"\"></a>";
        TMRContent += temp1;
        }
        i++;
    }
    //Search Index and Replace it;
    var t1 = content.indexOf("今天");
    var t2 = content.indexOf("</a></div>");
    var oldContent = content.substring(t1+79,t2);
    var change_temp = content.replace(oldContent,todayContent);
    content = change_temp;
    t1 = content.indexOf("明天");
    t2 = content.indexOf("</a></div>");
    var t3 = content.indexOf("</a></div>",t2+10);
    oldContent = content.substring(t1+79,t3);
    change_temp = content.replace(oldContent, TMRContent);
    content = change_temp;
    el.innerHTML = content;
}

function init()
{
    var flag;
    if (!localStorage.isApply) {
        flag = "0";
        localStorage.isApply = JSON.stringify(flag);
    }
}

function main()
{
    init();
    showUpdateButton();
    showCalendar();
}

main();