// ==UserScript==
// @name        bt_search_for_bgm
// @namespace   http://bangumi.tv/user/a_little
// @description add search icons in bangumi.tv for search anime 
// @include     /^https?://(bangumi|bgm|chii)\.(tv|in)/(subject|index|anime|game|book|subject_search)/.*$/
// @include     /^https?://(bangumi|bgm|chii).(tv|in)/$/
// @version     0.13
// @grant       GM_addStyle
// ==/UserScript==

if (!localStorage.getItem('searchEngines') || typeof JSON.parse(localStorage.getItem('searchEngines')) !== 'object') {
  localStorage.setItem('searchEngines', JSON.stringify(['dmhy', 'google', 'btdigg']));
}
var searchEngines = JSON.parse(localStorage.getItem('searchEngines'));
// Here, you can choose search engines that you want.
var searchEngineLists = [
  "dmhy",
  "camoe",
  "popgo",
  "google",
  "btdigg",
  "nyaa",
  "tokyotosho",
  "breadsearch",
];

// the engines in first list will search Chinese name by default.
// The engines in second list may need a ladder to acess them. Search Japanese name by default.
var allSearchEngineLists = [
  ["dmhy", "camoe", "popgo"],
  ["google", "btdigg", "nyaa", "tokyotosho", "breadsearch"]
];

// You can add new search engines in here.
// Data format and order like this: name : ["title", "icon", "searchapi"].
// In "searchapi", query string should indead by {searchTerms}.
// And you should add new engines in allSearchEngineLists, otherwise, it doesn't work.
var searchAPIs = {
  dmhy : [
    "花园搜索",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC60lEQVQ4jaXQa0+bZQDG8X5BiRlGkxlBjWy+0IY4zAZ1iMWtbMMNtboeeHocLRSQbJpMK4c10IKFlkLXgaUwdFHBUqD0+Bzu++8LyifwenO9++XKZTL930ReqsQEhP4A7w48/hMcGXBugWcbbKswkoYDzlOR5/0vED4Ek8lkMj16BdZfagw9K7NQUvH8rmGZr3J3SefrZJNAVrBZ1EEanFYbVFXBi0OVobUWMLgCX8zWeZCsE8objOUlE3uSqT3B9D6M7wge7+sUqjqHqqRU03myK7AstgBrwiC0D+P7BspzA2+mgWdb4NqE4aSOMyVwZ3T8BR1lo0EoVyewLeibF+fAjQUD8/QBQ4tNnGmJkhaYf6rzllKm3XPC8LJOaEtyP6HztnJMp7fMpz82+eQCsK7D+xNl3gtXsa/Bw1WVN/3/0Dld5vrPBl+tGdgWG1wdq9ARrPLxTIUPIif0XnzwZRquRVU6xouMpMCxpvHhZJmhpEZoz8CW0Gh3H9DmKGJdaBB5ZdAbPWEw3gIG1uHd8BHmmRKjOZ3AlsGVH8p0TZ0S2DWwZw06Hx3R/bSGNyeYeFnFviHpf9YCrkUFn8+eoWxLwjs6360KLnlLdE1XGM1KHOsa3yYFvrzAVxD48xLrXJO+iwWOHEQKoGxq+J4b3Jo3aHOd0ferhrIucKcF3iy4sk2sSxVuxVTMkWP6l1uA6wVM5g2cGYkzZWBLQJuvyOBCHX9Wcife5EqkxuVQmUvfF/lsrsrthIYl1gK6o5Lepw2siyqujOTeksFrgSNux1X8mzAwW+MN5ZDXfVWuTjRwZ1WCBbgZk+fA9Thc9pQwPzlmNCewrwrag6dYZjWCW+DOwjdpjftJDSUnmSyohPdg4OKDezn4aKZGT7TC+F+Chxs674xV6PCfcWeljn8XIrswVTAIFwTBvGAkZdC/BKa7K5LRv+FmHLqjAlcehpclPVFBTwy6Zmr0RCXDKXiQBttvYIlB75zEvgP/AdbG74wR2wccAAAAAElFTkSuQmCC",
    "http://share.dmhy.org/topics/list?keyword={searchTerms}"
  ],
  camoe : [
    "华盟搜索",
    "data:image/png;base64,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",
    "https://camoe.org/search.php?keyword={searchTerms}"
  ],
  popgo : [
    "漫游搜索",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVQ4jbWSUQoAIAhDd/9L22/INpdQECTo2zSB36eAuu9zIQONyawgAnTFSSRuY1WsILIFp9rnQBVYrEBS3VmO7TuYHFJ/T19KAckySYBKivcgVV7BnKMC6gD0yblHuqQ0dgAAAABJRU5ErkJggg==",
    "http://share.popgo.org/search.php?title={searchTerms}"
  ],
  google : [
    "Download Search",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABWUlEQVQ4jaXTPUvDQBgH8HyzkiCVdlBcFD+CDgUn0bU5rUMRS6mD4BuCVgfFKmitCl0s+FKhvoEgVvsyWKuRS9JLcvm7tcplSHW44e6e5/c8x91JAaKFZJXWFELRzZBVWgsQLST9JfknInlt9ExRJLMMqSOG67ID7gLb5xbG100h1hNIFyzM51gbu61wnN7Znl14Al+GC7LTas9nMi20bPgHPnUXmatOxbE1E89v3D8wd8DAbGBiw0R/XMfupY3RJcM/oBCKkUUDiUMGF/h1HN+AQiiC0xSa4aL04mBgVvcPTKZNbBYspHIMy3mGJnXx+s4xmBARAVg4Ybh4ctAb66wNJXSUGxx7RfEqBaDa5EgdMSEwmWXIlnwA+Qcb5QbHcLLTbjBGcfboILLq4yX2xXVsFSzUP1zcVzmOb2zsF21EVsRkhVD89zPVJTmqhWWV1rsGVFqRo1r4G6iM33AbQTj+AAAAAElFTkSuQmCC",
    "https://www.google.com/cse?q=&newwindow=1&cx=006100883259189159113%3Atwgohm0sz8q#gsc.tab=0&gsc.sort=&gsc.ref=more%3Ap2p&gsc.q={searchTerms}"
  ],
  btdigg : [
    "btdigg",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADCklEQVRYhb2X34uUZRTHP2sZkoVSN0GERPgHRERCLrQG4UKhpYEFddGFN0I3idBF9MrOvOdgeePF0mUJEiyIot4I5YZGkAzO+z2FbRa2VJb9snXLVSNdL+ad2Xec3XF3mJkHnosZ5n2+n/M9Z55zXuhgmdhigUYqPFb8Lg32dXLeHZeLj9OM1wpi73sMzHpgADvFShfnXEwUn0uqrO4WwAUXM1blmRxgv8fArAUyscHEnhxoenuF5QAevGrBRQ92LFlwpMraJGFZ/bMFn+WC35g4YsGlmmDrToPdlvGGixmPgVkXLyxJPBnjHhM/uzhVzhhKqqx2cWIhwbZbTCXj3Fc8e1EQHhzLLb1m4oeOxGsAF1IxaGKDB4c8+LWU8fAdAdIqT3twrWPhps20BdfrNVNMbdMysdGCJ7ZXWF4S6yy43B2AhhszZfHs/HkfZ4WLn3LKyxb80lXxGJg1MZl8wQPt8r7JxJVuC98GcdLFhIs/THzUAlEW23oJ0AAJ/imLbc0OVFhlGW/1HEBMeMb6ovV7PfjLxf8e3Ox59OLo7dX/ionJflifO/Cvi4Mu3vNgEwC7Pud+E6W+Qcy58ftcAWYM9dGFr9NgV+k0jzAiHjVRMvFtHwHmGpQF3/Xbeg8s/ZIHa9YHwyb2WDDWaKH9ceG3llbdcdtdwrbghov/8tvw7YZ4KgZdnO85gHg3qXBvU+Rplc3tppwuW/96ayMSoxb8aMFxC473uACny8Hw/C2RfMINvu+B9ZMW/JnXwcWXx7hrXoDahdStaahh+5RVeTIZZ4VlPJdmvDSveJKwzALllFc9mO5K9MH1csbQgrY3AE7zkIu/XRywjMdLYl19Uuow32frd0tLF1wQojBGe4VVnc6GJj7dKVamYtCCiovzyTh3LwqivizjxXoOU7HVgx1tbL5k4rCLc/kznzQF1m4eXBBAbDRxJs14Hmo1Uq+LVLzpGetdRB7xh5CP9GLKAi1ZcJFQkx6crf+NLOMdj9orWeE3W1yM9gTAgw+Kb8qlM6wx8VUqnurkvFt9loNRGQG+AQAAAABJRU5ErkJggg==",
    "http://btdigg.org/search?info_hash=&q={searchTerms}"
  ],
  nyaa : [
    "nyaaSearch",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAIVUlEQVRYhcWXaVBV5xnHj7GZ2sZMRiMImijigiCKBASUAJI0mXSaTr502s606YdM05ogO7IJQSRuxCSaZqnGUalLEWsSNbXVVqPGaDTFJC5EAwqcu3PZ7r3c7Zzzvr9+uKlAREs+5Z15Zs6cZf6/91nfo4xLzef7NGVcaj4zK6zMLFWZuFxlwne0KcUmYusszKqxMG+NjUWfG+TY4NWbgRHfjywx3bq+BbCwzkFYvsrE3O8mHrvKQsqmLrK39ZHd6CLljGDBoQHy2nTKLg0QXhASjCxXmVNnIuVAN090+3nqci9pDfZBgNgqy3cSDs9XSdncQ8JOP6kNPpIbdZIPChadgKSjfqpuGuSoBslfBFnaoZPhMFg6IMkUkI0kG43H8Q0CJNdZiC41j0p8wcsWYt/xErkTZuyG2XthXhMsPABJRyDuFKxtFyxv10lphzQrPNoDmW7ICkC2gJ9g8CSBQYAJy1Xmv2RmbpWFqFIzkwtC4ZhcoBJVqhJTbSV+jYOYzW4mvA1hW2HaDojeBXP2QlwjLNgPj3wA849C3deCX7YYpHwNS1RIt0NGL2QNwFINHpOSJ9AHAaYVthNX3kZUmZm5NQ6i6/oZX+XhvlV+7l0juGcdjN0IP9oEE96CyX+GKdvgoR0QtQti9sK8fZDwN0g8BI+ekiy6AClXYfENWGKGR52Q6YIsH2Tr8DhiEODe4n6UAg9KsY+x5QMoZUGUSg2lSkeplYxdB+PqYfzrcP8bMP5NiNgiiXvXT9KWbmIbgszfoxO3D1LelyT9A5I/hpSLkPoVLO6AdBtk9ECmB5YG4DHBIMCYAg9K4QBKkRel1IdS5kcpD6JUBVFe0hlTB/euhx/UwwOvGSS85mZmuZnwfJXoShNxuzSid8MjTYKnPzRIfB+S/wWLzkHql5DWOhiK9F7I9IZCcQtAyXWjFLlDEMVelPJvICqDKFUaSo1AWQ0Pb9JIXWsblpQRhSYW7NKZs1tQfEbn2eOSuCZIOgzJH0HyBUi5EgpFsgmecEJmP2T5hwK86ELJd6MUeVAKvSgrfChlPpTSIMrKIEqVzg9X66S96mTSt3rFjFITabv9LDtusOyUYNZeiG+CxAMQ/yFkfSJJvSiJvQpFNsm7bsEiJ2S5hwH0oyx3oRS6UQo9KPk+xpUP8ONKL0qJTsTaACn1PYTl316WEQUqGQ1enjoomdoAs/dAbCPE7oOcMwbPfarzTLOgol0QFJK3+iQLrJDRNwygD2WZCyXHzT1FHqZXOZlT4+SBChcL6yzErTTdtTcsesdF+n6Y0SCZuRui90D+x4Lysxq5Zw2O2w0ANAnPmQQZZkmqcwjAfbl2Ilc4ia92cH+JiwllfUyq8DCrfHQd8tk9PRSfNMhoMojYAcn7JTmnBasv6HS4dJqdBj0ByeuqwbKbBj9VJUuschAgsqCTWWUmppZ0o7zgQsl1k1pn/7/CU0vMJKx1sPa0j98cCpC8V/Lgu/DbYwarzgXY8J8gB1sDXOvV2dJqcKzL4HfXDOKvQ1rnEIDZZQ6mFNtJrLUTXtRN5nrriIITc1XC8zqZnN/BtBUmppeamV9j5sBVjaV/1Zn4tuRXRwRWt07l6QAJ+yFxv2TTFxqXunSOdkmmn4Gnr0k+8w4BiCnrYGqhSuoaO/ErR+f2sDyVyEITsdUmVv47wH2bYe52wcFWgZCSnx/SGbdF8vxJyXmrxvarOunHJCUtkl5NYteGADyYqxJTYWZ2xejE51RamPeShWklIZBfNPoYvwmeec/ANiABsHoE26/o/P1GEItHUH1esOO6AClxBgRmvzEIMKusk4iCu2f6oLiV9Fe6Ccv7Jg+KTEyp17hnPRQeF3x7CSlpdghaekLPDCEJCsnlPm34NLybRRaaCP+mB8ws62RuZWh0T8pTSf3TAEotjFkLJ1V5G4A3KPBqt9/f2ilGB/BQkYm4KuutHUcUqETmtzNhuUr2a04eXuslbF2AsPogzbbbPTDS0g3Ji83G6AAiC1SmlwxJvvzQiWhGqYmFG1ws2dhL4qsuoja42XTh9p3eaVm8o/TApDyV2Mrb8yN9o4PFa2wkvdLL4nV2kuud1JwIjigmJLiDks+7BP9DvGALjj4HkmqtxFQOHtmiSkwsqXfwyCoLmRu7iSgwsbTeTtNljXPmkERLl8DuEXT0CwwBhgTXED5P8C4hCB8ydCbldhJVYiLtZRtTCkP34qusJNRaia+2MKvMxJwKC7/f48Liljx/WPClTeN0h8aR1iD7rwb5xGTg9MphHml2yJEB/rC9iyNf+qg92E3WOisx5SoxZSbiVlqZusJBYo2F5DV2YmtsTK+wk7C+l1X/DNJ0SQdg9UcGp24GaXEYtDgNTnXoHGnThwBIvEGd2vMjeCBttZk2+6CfgrrkL2f9zKvuZWJhN2Nz+lD+6GJMgYsn3x7ghX1+DrfoNF4M0uMVdPYJ+n0Ch8fgit3A4jL4yqnT0mXg1yWagLMmncJDLh7f6RkOMKVQZfOxvhGTqMcreOOEjxPXNd466SenaQCQgKTVafCVw6DHK/i6KzR27W5B0JC02DXaegwumA1ePKqT3ShYssFB2kYHaTuH/BfElqhMzTFh6tHvWDbHWoJ83KbRcM5Pv09giFDN3+zWaHPqtHYN/1YT0O8XXLYbNF7RePY9P4mrQ8f+pG0DRO4ckgPKz27w6ze77igOsPdTL6sOeej3Da/1qzaDDy4FML7Vg76wGuy6GMDSb7C1WePwFT9heZ1EFpmI2xogc4dvKEA7H3zmvaO4lLD+iIfr9uG7lMDnqka/b7j6jW7BtvMBLpp12nsMPrymc63LYPoKE/OqzURv1UhbZxsE+D7tvxFwLsBAeKm1AAAAAElFTkSuQmCC",
    "http://sukebei.nyaa.eu/?page=search&cats=7_25&filter=0&term={searchTerms}"
  ],
  tokyotosho : [
    "tokyotosho",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKklEQVQ4jWNgYGD4TyEeaAP+4wDIivCBIWQANv+T5QIM/qgBQykd0MwAAK9F2kKBLEdAAAAAAElFTkSuQmCC",
    "http://www.tokyotosho.info/search.php?terms={searchTerms}&type=0&size_min=&size_max=&username="
  ],
  breadsearch : [
    "breadsearch",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFOElEQVRYhbVX308TWRSex4YHHngEpoztbYH2DgoaftSICpGphVJJsNUiBFrA8KPGXTdqZxg6QVbcuh2SAovQNiQb/4I1mjImPshmo5CNm5DdBzUxihaSPpM+9OHsQ2md8qMdWPcm5+3e8333O985uZcgFK5gFyoUrEanrw2Hxi14bbwVx1mGTrIMnfS14vi4Ba8JbTg0YTM6H3tQodK8eZdgqdBzDI6wZnqbNVeBkhi7SG/72nAk4KjQHxl48GRxAWc2BlimKqkUeHdwZjoptBsDC4PFBYcC/+6cEXkZen13Qp+tFqa6mkF0WyE41Amzow6YHXVAcKgTRLcVprqawWer3UNkvJVeFy8bkSLw4XO6E3cYHJcnEDrqQexvhznPFUUh9reD0FGfRYK34Lj/svFETvBrDVp0q9mQAecuHgd/DwOzow6Y81yB6QEbTF1tAqGjHsZaq7/WvLUahI56mLraBNMDNpjzXIHZUQf4exjgLh7/us+C4wcqYT1ZXDB6tiIjO2epziQT3VYQLtUprr1wqQ5EtzVDmrNUZ5VjX0+4TChwuwVnbj49YIOZETtM2huPZEDWXAWT9kaYGbGnSMiUmGg3BrLAe2o1+uHG8ozb/T0MzAx37msoedy+gOFmkwFunK+Em00GuH0B79njs9XCzHAn+HuYrO6YlbdoXwOKfN9szBhuZsSeE/xOCw1DjeXgMun2xFBjOdxpofeSGLFnGVNowxGCIAiiq66o0NWAtr1M6pDY355T9rstODF4RjfdXas51UtRql6KUnXXak71NqDpPhNKuEw6GDit30Ni0t4IYn971rB67EGFRG+Dxnn9jD7DVHRbDwT3mumNH1oq8UFd1G3SYlcD2kgrsfu86LZmKfujzegk+kwoMny2AlhzVWqQHOR2hk6wOcDlJNJK7PaEcKkOprqaZWbEEcJt0q55zlUCa66Cn65d2N/NNhpmnYZAPnB5R7lMOrjZZNiTS47ha8VrRP9pFE8T2F170YHhpa8CvizqIPZIc0opgb56VOMy6eDG+cp9WzNDoA3HCZcJJdME0sMm6MTwu1ABmyEdbIVT8UGgVEoJ9FKU6iAF5AONY+gkMXgGJb2Wcoi4jRD1YvhH1GdA5XEYAku9hGreRUHAYQDWnN0N8hHOMlVJQuLJ+Mq9sn1B5XGYEkTZ4ppX96kU8Tkd/DFRDr/dqoRfrxvgl24MDy9jmLTRqRJIY+Tac14NsUWUk8BmGCk24cpEWWBjIXe+nZxrxDJHRiReDW+DmnybE1vz2rxt+Gleiz8vahP5wHdyRogoX+qUeDW8nqLyHwihjVwktua1eDOENpSAb4V1EAvrnMQzT1HhMk9uS7waPj1SJFtiK4SmYwuo5oNAqT4IlCq2gGo2wyiwGUaKbr5zme13wZ3Ha5QjlyReDasKVPhWsRnWLWWke+ot0Us8mZR4Nbyb0f7/BEK65OdFTfaLOcqTAYlXwwufslL8t9vv01FPBosLlsfIdYlXw8uJMvisoI2OBB7SrscWDnimR++WIokn42kS31qJLwso/n5Om/t5LrElJ9IkXvi+nSfez2njq34q97NcrkS6HOnu+Dh/NDU+ziP400/9Hb1bquxjIvdEypip7kgPq7dBTd6xHVtE8DaogVf3y5ISTwaeHPZrJl9PvSX6nTmRSBN5zqth5V4ZrD6g4M3DY/DXz8fgzcNjsPqAgpV7ZfCcVyeiHLn01Fty9M/p7vXMU1QY5UudEqcOLY+Rr1M+IZM7EV8eI19LnDoU5UudzzxFir/n/wIa2n6KTlVRawAAAABJRU5ErkJggg==",
    "http://www.breadsearch.com/search/{searchTerms}"
  ],

};

// Create anchor for search with a icon.
// Codes come from Bangumi Music+(http://bgm.tv/group/topic/10395) and make some modifications.
function createLink(link) {
  //    console.log("start create link in createLink function");
  var searchIcon = document.createElement("a");
  searchIcon.href = link;
  searchIcon.target = "_blank";
  searchIcon.className = "searchicon";
  var searchIconImg = document.createElement("img");
  searchIconImg.style.cssText = "display:inline-block;border:none;height:12px;width:14px;margin-left:2px";
  searchIcon.appendChild(searchIconImg);
  // add title and icon
  domain = /[\/|\.|www]*(\w+)\.[org|com|se|info]/.exec(link)[1];
  searchIcon.title = searchAPIs[domain][0];
  searchIconImg.src = searchAPIs[domain][1];
  //    console.log(domain, ":createLink success");
  return searchIcon;
}

function getChineseName(title) {
  if (window.location.href.match(/subject_search|index/))
    return title.getElementsByClassName("l")[0].textContent;
  if (title.getElementsByTagName("a")[0].title)
    return title.children[0].title;
  return title.children[0].textContent;
}

function getJanpaneseName(title) {
  if (window.location.href.match(/subject_search/)) {
    if (title.getElementsByClassName("grey").length)
      return title.getElementsByClassName("grey")[0].textContent;
    else
      return title.getElementsByClassName("l")[0].textContent;
  }
  if (title.tagName === "H3" && title.children[1] !== undefined) {
    return title.children[1].textContent;
  }
  else if (title.tagName === "H1")
    return title.children[0].textContent;
  return "";
}

function contains(val, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === val)
      return true;
  }
  return false;
}

function getLink(engineName, animeName) {
  return searchAPIs[engineName][2].replace(/\{searchTerms\}/, encodeURIComponent(animeName));
}

// add search icon in subject page
function addSearchIcon1() {
  var h1 = document.getElementsByTagName("h1")[0];
  // add bt search text
  /*
     var frag = document.createDocumentFragment('frag');
     var span = document.createElement('span');
     span.id = 'bt-search';
     span.textContent = "BT搜索:";
     span.style.cssText = "width:14px !important; height:12px !important; color:rgb(0,180,30);margin-left:100px;cursor:pointer;";
     frag.appendChild(span);
     h1.appendChild(frag);
     */
  if (h1) {
    for (var i = 0, len = searchEngines.length; i < len; i++) {
      var animeName = getChineseName(h1);
      var engineName = searchEngines[i];
      if (contains(engineName, allSearchEngineLists[1]) || !animeName.length)
        animeName = getJanpaneseName(h1);

      h1.appendChild(createLink(getLink(engineName, animeName)));
    }
  }
}

// add search icon in anime or index page
function addSearchIcon2() {
  //    if (window.location.href.match(/subject_search/))
  for (var i = 0, len = document.getElementsByTagName("h3").length; i < len; i++) {
    var h3 = document.getElementsByTagName("h3")[i];
    for (var j = 0; j < searchEngines.length; j++) {
      var animeName = getJanpaneseName(h3);
      var engineName = searchEngines[j];
      if (contains(engineName, allSearchEngineLists[0]) || !animeName.length)
        animeName = getChineseName(h3);
      h3.appendChild(createLink(getLink(engineName, animeName)));
    }
  }
}


if (window.location.href.match("/subject/") && document.getElementById("navMenuNeue").children[2].children[0].className !== "focus chl")
  addSearchIcon1();
else if (window.location.href.match("/anime|index|game|book|subject_search/"))
  addSearchIcon2();

var searchSwitch = {
  init: function() {
    if (this.isHomepge()) {
      this.addStyle();
      this.insertStatus();
      this.insertSearchEngineSwitch();
    }
  },
  isHomepge: function() {
    return window.location.pathname === '/' ? true : false;
  },
  addStyle: function(css) {

    if (css) {
      GM_addStyle(css);
    } else {
      GM_addStyle([
        '.search-switches {display:none;}',
        '*:hover > .search-switches {display:block;}',
        '.search-switches a {display:inline-block;float:left;margin:5px 5px;padding:5px 5px;border-radius:4px;box-shadow:1px 1px 2px #333;}',
        '.search-switches a.engine-off {background:#ccffcc none repeat scroll 0 0;color:#333;}',
        '.search-switches a.engine-on {background:#f09199 none repeat scroll 0 0;color:#fff;}'
      ].join(''));
    }
  },
  insertStatus: function() {
    var b = document.querySelector('#columnHomeB');
    if (b) {
      var status = document.createElement('span');
      status.className = 'search-status';
      status.textContent = '已开启'+ searchEngines.length + '个搜索引擎';
      b.appendChild(status);
      var div = document.createElement('div');
      div.className = 'search-switches';
      b.appendChild(div);
    }
    b.innerHTML += '<br />';
  },
  insertSearchEngineSwitch: function() {
    var div = document.querySelector('.search-switches');
    for (var i = 0; i < searchEngineLists.length; i += 1) {
      if (searchEngines.indexOf(searchEngineLists[i]) > -1) {
        div.appendChild(this.createSwitch(searchEngineLists[i], 'engine-on'));
      } else {
        div.appendChild(this.createSwitch(searchEngineLists[i], 'engine-off'));
      }
    }
  },
  createSwitch: function(name, aclass) {
    var a = document.createElement('a');
    a.className = aclass;
    a.textContent = name;
    a.href = '#';
    a.addEventListener('click', function(e) {
      var engines = JSON.parse(localStorage.getItem('searchEngines'));
      if (e.target.className === 'engine-on') {
        e.target.className = 'engine-off';
        var index = engines.indexOf(e.target.textContent);
        if (index > -1) engines.splice(index, 1);
      } else {
        e.target.className = 'engine-on';
        engines.push(e.target.textContent);
      }
      var status = document.querySelector('.search-status');
      status.textContent = '已开启'+ document.querySelectorAll('.engine-on').length + '个搜索引擎';
      localStorage.setItem('searchEngines', JSON.stringify(engines));
      e.preventDefault();
    });
    return a;
  }
};

searchSwitch.init();
