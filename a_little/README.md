# [a_little](http://bangumi.tv/user/a_little)

## [动画评分对比](bangumi_anime_score_compare.user.js?raw=true)
在动画页面显示豆瓣和MAL的评分

讨论贴：https://bgm.tv/group/topic/343534

## [图片模糊打码处理](bangumi_blur_image.user.js?raw=true)
讨论贴： https://bgm.tv/group/topic/343349

在上传图片的页面提供模糊打码处理的功能

## [资源辅助搜索](bt_search_for_bgm.user.js?raw=true)
讨论贴：https://bgm.tv/group/topic/311291

为bangumi条目添加bt搜索图标,方便在查阅条目的时候，搜索资源  
默认开启三个搜索引擎: [dmhy](https://share.dmhy.org/ "dmhy") [Download Search](http://search.jayxon.com/ "google") [btdigg](http://btdigg.org/ "cilizhushou")

可在bangumi首页右下角设置需要的搜索引擎。

![Screenshot](images/screenshot_bt_search_for_bgm.png "Screenshot")

## [辅助创建黄油条目](bangumi_new_subject_helper.user.js?raw=true)
讨论贴：https://bgm.tv/group/topic/311774

1. 浏览getchu和批评空间时，辅助创建游戏条目和人物条目，减少复制粘贴的操作。
2. 关联游戏条目或者人物条目时创建一个表格，点击表格可以辅助搜索。
3. 为bangumi右上角增加google和baidu站内搜的功能。

## [辅助创建图书条目](bangumi_new_wiki_helper.user.js?raw=true)

## [域名重定向](bangumi_domain_redirector.user.js?raw=true)
重定向番组计划(Bangumi)域名为个人常用域名，方便在外部访问跳转  
初次使用需要设定域名  
若希望更改域名可以在greasemonkey菜单里，脚本命令项里更改

**注意**  
由于Chrome 不支持 beforescriptexecute，Tampermonkey会在页面载入后才开始重定向。

推荐使用扩展  
firefox: [redirector](https://addons.mozilla.org/en-US/firefox/addon/redirector/?src=search)  
chrome: [redirector](https://chrome.google.com/webstore/detail/redirector/pajiegeliagebegjdhebejdlknciafen?hl=zh-CN)

> redirector扩展定向规则

Include Patern（from）:

		^https?://(doujin\.)?(?:bgm|chii)\.(?:tv|in)/(.*$)  
		
Redirect To（to）:

		http://$1bangumi.tv/$2
