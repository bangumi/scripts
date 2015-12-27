# [binota](https://bgm.tv/user/binota)
如果没特别标注的话，我的脚本一律用 MIT License。

## [关联条目批量编辑 BRRS](bangumi-rename-related-subjects.user.js?raw=true)
讨论帖[戳我](https://bgm.tv/group/topic/311647)

批量编辑关联条目们
![Screenshot](http://r.loli.io/vay6ny.jpg)
![Screenshot](http://r.loli.io/jMR3Mn.jpg)

## [历史条目对比 BHD](bangumi-history-diff.user.js?raw=true)
讨论帖[戳我](https://bgm.tv/group/topic/311622)

用于对比条目的任意两个历史，支持行内对比。

![Screenshot](http://r.loli.io/YzUrMn.jpg)
![Screenshot](https://i.imgur.com/jlEMOxC.jpg)


## [条目ISBN日本亚马逊链接 BIAL](bangumi-isbn-amazon-link.user.js?raw=true)

在 Infobox 内的 ISBN 后添加日本亚马逊链接（/dp/{ISBN}）

## [人物条目 Twitter 链接](bangumi-twitter-link.user.js?raw=true)

人物条目内若 Infobox 有 Twitter 栏位，会替换为 Twitter 链接。


## [回帖增强 BRE](bangumi-reply-extend.user.js?raw=true)
讨论帖[戳我](https://bgm.tv/group/topic/311623)

回帖后终于可以立即修改、删除了，  
妈妈再也不用担心我提交后才发现有错字了！

## [拖动排序条目关联 BDSR](bangumi-drag2sort-relationship.user.js?raw=true)

鉴于有多个条目关联时要修改顺序时不够直观，  
所以直接上个拖动排序了。

## [目录批量编辑 BIBE](bangumi-index-batch-edit.user.js?raw=true)

本来 upsuper 有做一个[目录管理增强](https://github.com/bangumi/scripts/blob/master/upsuper/index_manager.user.js)，  
但很可惜不支持拖动排序，  
本来是想发 PR 的可是发现其实可以用更简单的方式实现（直接拿 jQuery + jQuery UI 就好了），  
所以就从头开始做了。
目前已经支持批量排序、编辑注解的功能了。

## [自动替换域名 BLDF](bangumi-links-domain-fixer.user.js?raw=true)
自动替换页面上所有的链接为你目前使用的 Protocal 与 Domain。

## [防剧透 BAN](bangumi-anti-netabare.user.js?raw=true)
讨论帖[戳我](https://bgm.tv/group/topic/311322)

会屏蔽章节讨论里的部分留言，  
屏蔽规则就跟[这里](https://bgm.tv/group/topic/311320)描述的一样 吧  
过滤的标准是只显示 浏览该章节讨论页的用户的 首个未标记为「看过」的章节的 播出时间之前发布的评论。
然后会在日志页面对于关联的条目提示你目前对该条目设置的状态。

![Screenshot](http://r.loli.io/A3qqea.jpg)
![Screenshot](http://r.loli.io/bIJnQz.jpg)
![Screenshot](http://r.loli.io/yauAny.jpg)
