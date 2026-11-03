# [ankopala](https://bgm.tv/user/ankopala)

## [bgm-tag-eye](bgm-tag-eye.user.js?raw=true)

在「我的收藏」列表页（`/book/list/<id>/collect`、`/anime/list/<id>/collect` 等）右侧的标签云上，给每个标签加一个眼睛按钮。点一下，含该标签的收藏就从列表里消失；再点一下恢复。

- 屏蔽状态存在 `localStorage`，按「条目类型 : 用户名」分表——动画里屏蔽的「韩漫」不会影响书籍；
- 刷新页面后仍然生效；
- 顶部会显示「已屏蔽 N 项」，避免误以为收藏丢了；
- 侧栏「清除全部」可以一键恢复。

适用于 bgm.tv / bangumi.tv / chii.in 的 `/.../list/...` 页面（旧站结构）。

## [bgm-widget-queue](bgm-widget-queue.user.js?raw=true)

超合金组件的加载排队器。

组件的加载方式是：页面加载完之后，把**所有已启用组件的代码一次性并发请求**回来再 `eval`。开得多的时候会撞上站点的限流，一部分请求返回 503，表现就是"组件莫名其妙集体失灵"，而且没有任何提示（失败只在控制台留一行 `[CHOBITS] plugin load error`）。

这个脚本在 `document-start` 拦截页面里的 `chiiLib.widget.loader`，接管其中走 `$.ajax` 的组件请求：改成串行（间隔 150ms），并对 503 / 429 / 502 / 504 做退避重试（最多 5 次）。这样组件一个都不用关，也能全部加载出来。

代价是页面加载会慢几秒（20 个组件大约多 3 秒）。控制台会打印：

```
[widget-queue] 已接管组件加载，串行间隔 150ms
[widget-queue] 组件加载完成: 成功 20 / 重试 0 / 失败 0
```

相关讨论和实测数据：站内「组件加载不出来的问题是不是有点严重」（<https://bgm.tv/group/topic/361137>，实测开 17 个组件只有约 12 个加载成功，减到 6 个后 503 消失）、「bangumi插件是怎么工作的?」（<https://bgm.tv/group/topic/364356>，开发者对加载机制与 503 的说明）。
