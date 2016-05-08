# [https://bgm.tv/user/sinker](sinker)

# 为首页格子添加下番链接
为 bangumi 首页格子（仅限平铺模式）添加对应番组的下载链接(指向 [Horrible Subs](http://horriblesubs.info/))。

## 效果图1
![](images/screenshot_bgm_to_horriblesubs.png)

## 效果图2
![](images/screenshot_horriblesubs_magnet_to_aria2.png)

目前仅支持指向 Horrible Subs 这个英文字幕组的链接，跳转时会在链接后附上‘latest=x(看到第几集)’
，作为接下来的脚本过滤已看过番组的参数。

[horriblesubs_magnet_to_aria2.user.js](./horriblesubs_magnet_to_aria2.user.js)
这个脚本用于将动画的磁链提出，然后点按钮就能将对应磁链发到指定的aria2端口。



