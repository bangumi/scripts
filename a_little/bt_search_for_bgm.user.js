// ==UserScript==
// @name        bt_search_for_bgm
// @namespace   http://bangumi.tv/user/a_little
// @description add search icons in bangumi.tv for search anime 
// @include     /^https?://(bangumi|bgm|chii)\.(tv|in)/(subject|index|anime|game|book|subject_search)/.*$/
// @include     /^https?://(bangumi|bgm|chii).(tv|in)/$/
// @updateURL   https://raw.githubusercontent.com/bangumi/scripts/master/a_little/bt_search_for_bgm.user.js
// @version     0.13.2
// @grant       GM_addStyle
// ==/UserScript==

(function() {
  if (!localStorage.getItem('searchEngines') || typeof JSON.parse(localStorage.getItem('searchEngines')) !== 'object') {
    localStorage.setItem('searchEngines', JSON.stringify(['dmhy', 'google', 'torrentproject']));
  }
  var deprecatedEngines = ["btdigg", "camoe", "btcherry"];

  var allSearchEngineLists = [
    ["dmhy"],  // CN
    ["google", "sukebei", "tokyotosho", "torrentproject"],  // JP
  ];


  // Data format and order like this: name : ["title", "icon", "searchapi"].
  // In "searchapi", query string should indead by {searchTerms}.
  var searchAPIs = {
    dmhy : [
      "花园搜索",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC60lEQVQ4jaXQa0+bZQDG8X5BiRlGkxlBjWy+0IY4zAZ1iMWtbMMNtboeeHocLRSQbJpMK4c10IKFlkLXgaUwdFHBUqD0+Bzu++8LyifwenO9++XKZTL930ReqsQEhP4A7w48/hMcGXBugWcbbKswkoYDzlOR5/0vED4Ek8lkMj16BdZfagw9K7NQUvH8rmGZr3J3SefrZJNAVrBZ1EEanFYbVFXBi0OVobUWMLgCX8zWeZCsE8objOUlE3uSqT3B9D6M7wge7+sUqjqHqqRU03myK7AstgBrwiC0D+P7BspzA2+mgWdb4NqE4aSOMyVwZ3T8BR1lo0EoVyewLeibF+fAjQUD8/QBQ4tNnGmJkhaYf6rzllKm3XPC8LJOaEtyP6HztnJMp7fMpz82+eQCsK7D+xNl3gtXsa/Bw1WVN/3/0Dld5vrPBl+tGdgWG1wdq9ARrPLxTIUPIif0XnzwZRquRVU6xouMpMCxpvHhZJmhpEZoz8CW0Gh3H9DmKGJdaBB5ZdAbPWEw3gIG1uHd8BHmmRKjOZ3AlsGVH8p0TZ0S2DWwZw06Hx3R/bSGNyeYeFnFviHpf9YCrkUFn8+eoWxLwjs6360KLnlLdE1XGM1KHOsa3yYFvrzAVxD48xLrXJO+iwWOHEQKoGxq+J4b3Jo3aHOd0ferhrIucKcF3iy4sk2sSxVuxVTMkWP6l1uA6wVM5g2cGYkzZWBLQJuvyOBCHX9Wcife5EqkxuVQmUvfF/lsrsrthIYl1gK6o5Lepw2siyqujOTeksFrgSNux1X8mzAwW+MN5ZDXfVWuTjRwZ1WCBbgZk+fA9Thc9pQwPzlmNCewrwrag6dYZjWCW+DOwjdpjftJDSUnmSyohPdg4OKDezn4aKZGT7TC+F+Chxs674xV6PCfcWeljn8XIrswVTAIFwTBvGAkZdC/BKa7K5LRv+FmHLqjAlcehpclPVFBTwy6Zmr0RCXDKXiQBttvYIlB75zEvgP/AdbG74wR2wccAAAAAElFTkSuQmCC",
      "http://share.dmhy.org/topics/list?keyword={searchTerms}"
    ],
    camoe : [
      "华盟搜索",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAKwElEQVRYhZ2Wa1AUZ76He/fsFhOgZzKAqwKJmKC4ohA0F90Eb0dkxegoRgjCIsELkASJwCwSDWJQBx0F2SiKiAIOaNBllFIuQQddRCEk4ZjkiAbBiBgiKgMo92Ge/eCMZVbd21v1fOn6vf/f011vV7cgPGPR16elvx99UxMVajVJY8cSa20d9qz8P+wNo78f+vtpOneOnIAAlKKo/dcb9XoP7t9PNXGN7m56WltpLC/n7KZNXNVqT/e0tKQ+lnkWp+nuhu5uOhobuazV8n1h4bVfZLq6Fj4sbWvzf8Tdu2l0dPA4Q/fu0dfSwoP6enqamhi4fZt/zPw39P7446mLu3f7C9y+zX/CUGsrhlu3nspQaytGU854+zaGn356am6guZkbX3zBueRkBJqb+bdpaqL30iXaKiuf5Px5Hly6xGBjIzQ3Y2hqouOrr7hTVUVbZSV3KivRm7KNWi3F0dFsf+UVhKoUtaJ6Z8qVi9vVXEhOpjIpicIVK6jduZM7FRXQ0MDQ1atc2rsX7cqVZPn4sNfLi71eXuyZPTvxlk6nuKXTKe7odEvbKytv9n/3HTQ00FFVRVFEBDmLFpE5d27OLZ1OcddEc2mpokqtVmxydlYIgiAI2g9WRRSGr1AdCw5WFQQGqjJmz1Zl+fio9OXlFVy6hKG2lqKVK9ni4oJSFL+NEUVVjCiqokVxrPkAt5eXy3qrquoHv/6avpoaGrKzUU+YQNKYMagmToz7d96eJ9+KmpoAqqsrBisqKk5HRVVscXauiBXFpw6jrMyK2tocampau8rK+DYlhYxp08hVKKjbti2D8+dd/3VhYuKvKS62eERi4m+emhOEX/0i9zg6XW5feTn648fRHz9OV3Ex/Tod6HQnGoqLLRqKiy0SExN//aw79qampo7Tp+soLa2jpGT1U3MlJU6UlPyN0tK6p3Bv6PRpDDodhuJiDCUlDJWVQVlZx9DJk3XtGk3dT/v2eT859MiRJRw/Xo5OB6WlUFQEx459Yzh8eM/9gwf/ci8z0/FRtqDABa1Wj1bLE5w8yVBxMX0nTtB56BAPCo4wUPhX0GoxFhbSk5dHy7Zt5ZUhIUseDtNolqHRLCMvr4yjRzGeOIGhqAijVgtHjzKUn09fdvZAb2bGJy1btowVBEHg0CEX8vP1HDkCR47A4cMYNRq6NRpaMzO5rFJxISqKM6GhVESEldzcvu1bfXo65vz1xETOh4aWxYjiMoHcXMjNhZwcBrOy6Nyzh1u7dtF+6BC9hw9j0BzCmJNDR1oqnWr1Bt2SJS5n/P3nDmRldZKbiyE7m779++lKT+eHtDRKIiL4bOrU9nhb2/pYqbQ+xtLytcrg4OiG+Pib5q6727dTtGABSqkUgfR0SE+H1FR+jovj1Pz5bHd1JX+pP3XJm+k8eADj7t0M7drFtTVrus/4+up1fn6dA2lpRtLT6VKr+SExkfJ168gPDkbt4cHHw4dnxcnlsji5XLZEEP6nIiRE0p+WttTcpd+8mVNvv20SSE6G5GQaw8PRTp/OllEvsuHFERz5aDaVWcs+78vPV3LoEOzcSZsyllr/JZT7+NCflARqNYO7d/Ng/37a9uyhJSGBxg8/pDUq6gZJSbtYteq3j87Nxo0Kc5d+/XpO/fGPJoGEBEhIoMbXlzRnZ2JlUn2cnVx9Jsen/suKxSpyc6eTnw/79tG7MZErfwqizMuL/oQE+OwzOHAAsrIgJQWSkmDDBkhIgE8+aSU+Pune++9v+N7P703i4hTmrq6YGEpmzzYJKJWgVPJ/ixaR6+ZG5oTf/3w53P/d+qqQqm+ql6jufxI/3ZCxB2N2NqSlcePDDzmjUDCwdevD4owMhrZsoW/NGvqjoxmKjQWlEqNSiSEmhu+WLOHE1KlZZ2bNSjR36cPDOeXpaRKIjMT40Wq6IlZxK+RPXA8Loq04jvoLIdSen5dSsHnMvPb41fT8ZQcDB7O4tV1NzerVDGo0sHcvxg0b6F61ihsBAdwKCkK/fHk3q1fr769c2XUvJMRY9MYb5Li6UjFjBkRGQmQkN959l88nTTILrMC4IwpD7lr6j66nR7uOu1+v53LNUooLJ99N3/i7G/tXuJG7YgaVW6JpyD/AzeOFGPZlQHw83aGh1M2Zg8reHpWDA8mOjmuJiHDZam+/cKuDQ98GOzv2vPQS1TNnQlgYhIXRqFCQ5+pqEgheivHPoQxlr2Gwcj093yXw85WPqLvgRd5BJ9atkRKusCN1sQcXPo2m+XAuN48dw7BvH0RF0e3nx5dvvYVSKu1WiuJapYXFy4IgCBGCII+VSoNiRHHZRlvbZW1vv51GYCAEBnLN2xvNuHEmAV9fCHyHFuU7/JAbxN0r73OjfjHnvphI2g47IpaJrPQaQcF787n26Tqub1VR/fHHDOzcCUol/YGB/DhrFkXjx3d3zpmzgfnzw36Bt/dIQRAE5s9X4OsLvr5cmzEDjbOzScDHB3x8ODtjEkffd+NG7Vwuf+VOgWYk8X+WEvrOMLbMf43L62LoWBtHnZ8fOVOm0Bcb+/C0f/ABLF4M8+ZhnvU4vdOmLf/e1dW9ZerUj8zXrkyZQo6Tk0nA0xM8PTn71ngKPhjN1arxVJwaQUqyjJWhMt7zcyErejlXIsO4s2gh5yZORD1yJD3z5j0sj4uD8HCYOROmTcM8z0yTh0d/vbt7b8vkyf3mazWuruweMcIkMGUKTJnCNwtdOJngQE2RY+vZv/5uUWH+89NTNwVlqOIC+DTYh6o5nlx91YOTo0exbdgweqZOBW9vCAxkMCyMrqAg9G++SfukSTx49VUGXn+d2+7unHJyQvfSaJrdJmDuqnFxYdfw4SYBd3dwd+cHxcsUR44gd7XN9c3/azVcEAShMToi7mxkMJqZHnzpMY7qsaPJGzmCbba29EyYAB4eMH06+sWLqV6+nCqFgiofn4K7EyfGDU6eHNfh7h633camsdjRgTvjXDB3nXVyYoednUnA2RmcnWnzHMXFufYU/MH+9v//4bUQ/XvvKfoXLci5N9eLq+NH0+jiROkLI0mxs2GbXE7Pyy+DszOMH0/zG2+wb8ECcoOCOBAQsOzxz7xSKk2qtbe/2mvOOztTNHIkic8/bxJwdARHRwZfeoF2FycaXnGjPTiYgUWL4PXXMTo5MfCiI+0vOJJnZ0usKPbsksnaeu3th8x7rzk6stnJib0+Pmx1c/uFgCAIAsOGqcxZHB3R2NqilEpNAnI5yOUYR47A8PtxDHh6YvD0xOjqCg4OGG1sGLSRU25jg1omI1YUj3bIZLOG5PJO896fbGzIs7Ul2cmJBAeHJwVkMpU5i1yORiZ7TEAm80cm8+8bP/7UoJsbuLnBqFFga0uvTEaLVMpZa2t2SqWsk0qJEcWDWFi4YGmpx9ISLC1ptbLic5mMRLmcGFF8UkAiUWFpyZCVFZ1SKQdN5UqplEeh7smTF/ZMmpTKmDGpODik/s3a+tppa2uOiiI7LC0H11pba2KtrVNjrKwCsLBwwcJCj0QCEgktzz3HQVFkvSg+W0AiwSCR8LOVFZmiSKxU+k2stXXqU345H65YUUxWiuJFE2dXS6VjHg0UhFFYWHyBRHIRieRitaXlZbUosvZZAhYWEUgkF1slkq/qJZK+3dbW/NPy/3TFWFl5mx/p0wTMK1MQhuc+99z1TY8J/B123tecQIQDIwAAAABJRU5ErkJggg==",
      "https://camoe.org/search.php?keyword={searchTerms}"
    ],
    btcherry : [
      "btcherry",
      "data:image/png;base64,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",
      "http://www.btcherry.org/search?keyword={searchTerms}"
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
    sukebei : [
      "sukebei",
      "data:image/png;base64,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",
      "http://sukebei.nyaa.se/?page=search&cats=7_0&filter=0&term={searchTerms}"
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
    cilibaba: [
      "cilibaba",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAxElEQVQ4ja2RwQ7CIAxAmyCcjH/gxd9EHcn+ULOTZw8elngyVnD1QLqxjUAPNiGQ0L6+AkAllPVUy1nF9f7aAwB0XWeUDRRBQQ5Kk9ngDwBPuftsGIdkHM4KeTcOg3Y4iC30GblwZVK1UDbEdfSjkag7AIBukJT1EyRZIgDrKxvIOKQILBTrBr/LhG2LTwbE7oX5OUk7HFLdzekznvkdqrGee3qLW9/vRJDZLyQgUfFkEr/v8ngfTCPUX1rw3OL5c5AS4Ae9i8czRVbLiwAAAABJRU5ErkJggg==",
      "http://www.cilibaba.com/search/{searchTerms}/"
    ],
    alicili: [
      "alicili",
      "data:image/png;base64,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",
      "http://alicili.org/list/{searchTerms}/1-0-0/"
    ],
    btku: [
      "btku",
      "data:image/png;base64,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",
      "https://cn.btku.me/q/{searchTerms}/"
    ],
    torrentproject: [
      "torrentproject",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACL0lEQVQ4jW2Tz0vUQRjGP/ujdVODDkmZhB4yqIV03ZlTFy8JHrwEHjoEHlqDzoLX71GQ8NIlPCgdhMYCdWdYPH3/hDDcELdYwUgpaSFt1w2H6bCO7X5x4DnMO+/7vM/7zAwHx8c9QRDEaV0BcSBGQHJgiXRG0Y0iAcQAlFKJHycnt36dnU0QhmHSH4yGJMUG41KzLA0VaXDC8FcaKkKzkDX0+9wwDJOHh4dd+ACKhDC8EhorDU4a3Nh6E34vDKfC8AKIBUEQ9wTNYs2CT/SYOX3tZk5fu2hcal6ObdEVBEGcyRKp7BoPhKbRmiSKuA276zbsrhNFoiT1kXXuPv197wbjZTqk5l20y9g6rmqtq1rbNkaLiuXHP7lNJqRbGHbyn7ovOnp4gmg8/7HLCcOX4ZDrPHxLlzTURRE3dfCsrTCKVbvtpr49caLYNHRgiTRATBrqXtrQey4lWbXbbli1+5BRpABiwrAVdT9KMFObb/NAGLZyBTqbCjRzUfcvU9B2G5q5RztcA2CoQJ/U1PwIVWvdpt1zgyu4wRXcpt1zVWv/j6CpDRXom/g+0Xnx/HMFnkuDy3/udbONxbZuooibbSy6/PZNJw1upEAeRaJUKqX8U455ksyHppJLoamNFMj7mqNG4z77+/tXW0nOx5lrMbYuNF9zmvmsoX+0Qvr89zZrjmq1Pv85lFKJ6T/TvZkSqdwbrmQVPXKNOwQkCYhPlkhVKpV0GIZJpVSiXC53/APx/d8s2t1b5gAAAABJRU5ErkJggg==",
      "https://torrentproject.se/?t={searchTerms}"
    ],
  };

  for (var i = 0, len = deprecatedEngines.length; i < len; i++) {
    delete searchAPIs[deprecatedEngines[i]];
  }
  var searchEngineLists = Object.keys(searchAPIs);
  var searchEngines = JSON.parse(localStorage.getItem('searchEngines'));
  searchEngines = searchEngines.filter(function(e) {
    if (searchEngineLists.indexOf(e) !== -1)
      return true;
  });

  var addSearchIcon = {
    init: function() {
      if (window.location.href.match("/subject/") && document.getElementById("navMenuNeue").children[2].children[0].className !== "focus chl")
        this.addIcon1();
      else if (window.location.href.match("/anime|index|game|book|subject_search/"))
        this.addIcon2();

    },
    createLink: function(link) {
      var searchIcon = document.createElement("a");
      searchIcon.href = link;
      searchIcon.target = "_blank";
      searchIcon.className = "searchicon";
      var searchIconImg = document.createElement("img");
      searchIconImg.style.cssText = "display:inline-block;border:none;height:12px;width:14px;margin-left:2px";
      searchIcon.appendChild(searchIconImg);
      // add title and icon
      var re = new RegExp(searchEngineLists.join("|"));
      if (link.match(re)) {
        var domain = link.match(re)[0];
        searchIcon.title = searchAPIs[domain][0];
        searchIconImg.src = searchAPIs[domain][1];
      }
      return searchIcon;
    },

    getChineseName: function(title) {
      if (window.location.href.match(/subject_search|index/))
        return title.getElementsByClassName("l")[0].textContent;
      if (title.getElementsByTagName("a")[0].title)
        return title.children[0].title;
      return title.children[0].textContent;
    },

    getJanpaneseName: function(title) {
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
    },
    getLink: function(engineName, animeName) {
      return searchAPIs[engineName][2].replace(/\{searchTerms\}/, encodeURIComponent(animeName));
    },
    addIcon1: function() {
      // add search icon in subject page
      var h1 = document.getElementsByTagName("h1")[0];
      if (h1) {
        for (var i = 0, len = searchEngines.length; i < len; i++) {
          var animeName = this.getJanpaneseName(h1);
          var engineName = searchEngines[i];
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length)
            animeName = this.getChineseName(h1);

          h1.appendChild(this.createLink(this.getLink(engineName, animeName)));
        }
      }
    },

    addIcon2: function addSearchIcon2() {
      // add search icon in anime or index page
      //    if (window.location.href.match(/subject_search/))
      for (var i = 0, len = document.getElementsByTagName("h3").length; i < len; i++) {
        var h3 = document.getElementsByTagName("h3")[i];
        for (var j = 0; j < searchEngines.length; j++) {
          var animeName = this.getJanpaneseName(h3);
          var engineName = searchEngines[j];
          if (allSearchEngineLists[0].indexOf(engineName) > -1 || !animeName.length)
            animeName = this.getChineseName(h3);
          h3.appendChild(this.createLink(this.getLink(engineName, animeName)));
        }
      }
    },
  };

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
          '.search-status {padding: 5px 15px 0;}',
          '.search-switches a {display:inline-block;float:left;margin:5px 5px;padding:5px 5px;border-radius:4px;box-shadow:1px 1px 2px #333;}',
          '.search-switches a.engine-off {background:#ccffcc none repeat scroll 0 0;color:#333;}',
          '.search-switches a.engine-on {background:#f09199 none repeat scroll 0 0;color:#fff;}'
        ].join(''));
      }
    },
    insertStatus: function() {
      // move to sidepanel because of confliction of default function
      //var b = document.querySelector('#columnHomeB');
      var b = document.querySelector('.SidePanelMini');
      if (b) {
        // try to create a wrapper
        //var statusContainer = document.createElement('div');
        //b.appendChild(statusContainer);

        var status = document.createElement('div');
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
        var engines = searchEngines;
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
    },
    registerEvent: function () {

    }
  };

  try {
    searchSwitch.init();
    addSearchIcon.init();
  } catch (e) {
    console.log(e);
  }
}());
