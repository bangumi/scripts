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

## [bgm-topic-preview](bgm-topic-preview.user.js?raw=true)

发帖、回复、编辑、条目讨论、日志与评论时的 BBCode 预览。

提交按钮（发帖是「创建」、回复是「回复」、编辑是「保存」）左边多一个「预览」，点它，**正文框原地变成预览**（textarea 隐藏，同位置同宽显示渲染结果），点「返回编辑」切回来。不是另开一块面板，所以页面高度不会跳。预览时正文框上方的 B/I/U 工具栏会一起收起——否则点了加粗按钮，标记插进隐藏的框里，屏幕上什么反应都没有。

支持这几处：

| 场景 | 位置 |
|---|---|
| 小组发新话题 | `/group/<id>/new_topic`，以及小组页上点按钮才插入的表单 |
| 小组话题回复 | `/group/topic/<id>` 底部的回复框 |
| 编辑已有话题 | `/group/topic/<id>/edit` |
| 条目讨论发新话题 | `/subject/<id>/topic/new` |
| 条目讨论帖内回复 | `/subject/topic/<id>` |
| 写日志 / 条目评论 | `/blog/create`（带 `?review=<id>` 时就是给该条目写评论） |
| 日志页评论 | `/blog/<id>` |
| 编辑日志 | `/blog/<id>/edit` |

短评、吐槽那种一行小框不会挂，省得多一个用不上的按钮。

渲染规则取自官方帮助页 <https://bgm.tv/help/bbcode> 的「显示效果」列——那一列就是站点渲染器真正吐出来的 HTML，所以按它实现：

| 写法 | 渲染成 |
|---|---|
| `[b]` `[i]` | `<strong>` `<em>` |
| `[u]` `[s]` | 带 `text-decoration` 的 `<span>` |
| `[mask]` | 灰底遮挡的 `<span>`（前景色与底色同为 #555） |
| `[color=red]` `[size=18]` | 带 `color` / `font-size:Npt` 的 `<span>` |
| `[url]X[/url]` `[url=X]文字[/url]` | `<a class="l">` |
| `[img]X[/img]` | `<img class="code">` |
| 换行 / 裸 URL | `<br />` / 自动成链 |

预览容器直接用站点的 `class="topic_content"`，字号、行距、链接色都继承站点 CSS，不是自己仿的。

配色不自己调：不猜系统深浅色，也不预设什么"面板色"，而是读正文框（及其祖先）的实际计算样式，把底色、文字色、边框、圆角、左右内边距原样复制给预览块。切换时两边看起来是同一个东西，不会出现比正文框灰一档的方块。无论站点原生深色模式，还是 Dark Reader / Night Eye 这类改写的深色方案，都能对上。

小组页上点按钮才插入的表单用 `MutationObserver` 等它出现，后插入的也能挂上。

