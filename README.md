# Bangumi 用户脚本

由于 Userscripts.org 不稳定，因此决定使用 GitHub 来发布和管理用于 Bangumi 上的用户脚本。

## 整理方式

首先在根目录下以自己的 Bangumi ID 为名建立文件夹，并在该文件夹内建立一个 `README.md` 文件用于展示和介绍自己的脚本。如果需要添加图片，可在自己的文件夹内再建立一个 `images` 文件夹，并将图片放在其中。

由于用户脚本都是单文件的，因此直接将用户脚本放到自己的文件夹内，并在 `README.md` 文件内添加相应介绍即可。`README.md` 的写法请参照下一节的模板。

网页截图推荐使用 PNG 格式，并且请在提交之前使用 [optipng](http://optipng.sourceforge.net/) 优化图片文件。

提交时的 commit message 可使用中文填写，但文件名请勿使用 ASCII 以外的字符。每个文件夹由作者自行维护，请勿擅自修改他人文件夹内的内容。如果希望给其他人的脚本贡献代码，可使用 pull request。

想要权限添加自己的脚本的，可以[点击这个链接](https://github.com/bangumi/scripts/issues/new?labels=%E6%B7%BB%E5%8A%A0%E6%9D%83%E9%99%90&title=%E6%B7%BB%E5%8A%A0%E5%86%99%E5%85%A5%E6%9D%83%E9%99%90%E7%BB%99%20[[Bangumi%E7%94%A8%E6%88%B7%E5%90%8D]])根据格式填写开一个新的 issue。通过后即可自己提交脚本，不需要使用 pull request 请求。

## 模板

```
# [Bangumi ID](https://bgm.tv/user/Bangumi ID)

## [脚本1](脚本1.user.js?raw=true)

脚本介绍，介绍一下脚本的功能和用法。如果有配图的话：

![屏幕截图](images/图片.png)

## [脚本2](脚本2.user.js?raw=true)

还是脚本介绍。
```

## 脚本列表

<!--GENERATED#SCRIPT-LIST#START-->
- [资源辅助搜索 by a_little](https://github.com/bangumi/scripts/tree/master/a_little#资源辅助搜索)
- [辅助创建黄油条目 by a_little](https://github.com/bangumi/scripts/tree/master/a_little#辅助创建黄油条目)
- [域名重定向 by a_little](https://github.com/bangumi/scripts/tree/master/a_little#域名重定向)
- [修正放送的绿色格子时间 BGBI  by binota](https://github.com/bangumi/scripts/tree/master/binota#修正放送的绿色格子时间-bgbi-)
- [关联条目批量编辑 BRRS by binota](https://github.com/bangumi/scripts/tree/master/binota#关联条目批量编辑-brrs)
- [关联人物同步 Infobox BRPS by binota](https://github.com/bangumi/scripts/tree/master/binota#关联人物同步-infobox-brps)
- [用户页统计图 BHC by binota](https://github.com/bangumi/scripts/tree/master/binota#用户页统计图-bhc)
- [历史条目对比 BHD by binota](https://github.com/bangumi/scripts/tree/master/binota#历史条目对比-bhd)
- [章节页显示中文名称 by binota](https://github.com/bangumi/scripts/tree/master/binota#章节页显示中文名称)
- [条目ISBN日本亚马逊链接 BIAL by binota](https://github.com/bangumi/scripts/tree/master/binota#条目isbn日本亚马逊链接-bial)
- [人物条目 Twitter 链接 by binota](https://github.com/bangumi/scripts/tree/master/binota#人物条目-twitter-链接)
- [拖动排序条目关联 BDSR by binota](https://github.com/bangumi/scripts/tree/master/binota#拖动排序条目关联-bdsr)
- [目录批量编辑 BIBE by binota](https://github.com/bangumi/scripts/tree/master/binota#目录批量编辑-bibe)
- [自动替换域名 BLDF by binota](https://github.com/bangumi/scripts/tree/master/binota#自动替换域名-bldf)
- [防剧透 BAN by binota](https://github.com/bangumi/scripts/tree/master/binota#防剧透-ban)
- [突破首页格子50上限 by chaucerling](https://github.com/bangumi/scripts/tree/master/chaucerling#突破首页格子50上限)
- [个性化每日放送：PersonalCalendar by fitailsh](https://github.com/bangumi/scripts/tree/master/fitailsh#个性化每日放送：personalcalendar)
- [国内放送站点链接 by imorz](https://github.com/bangumi/scripts/tree/master/imorz#国内放送站点链接)
- [首页放送整合 bgmlist.com 数据, 作为"在看"时间表 by prevails](https://github.com/bangumi/scripts/tree/master/prevails#首页放送整合-bgmlist.com-数据,-作为"在看"时间表)
- [标注 ep 讨论人气：EpPopuVisualizer by prevails](https://github.com/bangumi/scripts/tree/master/prevails#标注-ep-讨论人气：eppopuvisualizer)
- [章节讨论剧透关键词折叠：EpSpoilerFolder by prevails](https://github.com/bangumi/scripts/tree/master/prevails#章节讨论剧透关键词折叠：epspoilerfolder)
- [点抛弃时自动勾选“仅自己可见” by prevails](https://github.com/bangumi/scripts/tree/master/prevails#点抛弃时自动勾选“仅自己可见”)
- [给人物的日文名中汉字标注读音 by prevails](https://github.com/bangumi/scripts/tree/master/prevails#给人物的日文名中汉字标注读音)
- [为首页格子添加下番链接 by sinker](https://github.com/bangumi/scripts/tree/master/sinker#为首页格子添加下番链接)
- [过滤 Horrible Subs 中已看番组 + 发送磁链到 aria2 的按钮 by sinker](https://github.com/bangumi/scripts/tree/master/sinker#过滤-horrible-subs-中已看番组--发送磁链到-aria2-的按钮)
- [首页条目名中文化 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#首页条目名中文化)
- [目录管理增强 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#目录管理增强)
- [标签批量管理 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#标签批量管理)
- [讨论增强 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#讨论增强)
- [任意状态启用进度管理 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#任意状态启用进度管理)
- [小组坟贴标记 by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#小组坟贴标记)
- [侧栏 Dollars by upsuper](https://github.com/bangumi/scripts/tree/master/upsuper#侧栏-dollars)
<!--GENERATED#SCRIPT-LIST#END-->

