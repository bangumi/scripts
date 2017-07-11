# [chaucerling](https://github.com/chaucerling)

## [突破首页格子50上限](bgm_tracking_improvement.user.js?raw=true)

[讨论帖](https://bgm.tv/group/topic/317991)

### feature
- extra 格子模式（目前只能使用平铺模式）：原本显示的格子在 `50`，脚本添加的格子在 `extra`。 如果不在首页点的格子或新增了在看条目，需要点击 `refresh` 按钮更新进度。
- 平铺模式下能切换动画和三次元栏目 (fixed this [bug](https://github.com/bangumi/issues/issues/12))

### changelog
- V0.4.0: bangumi首页显示的条目逻辑更改了，更新和优化相关代码。目前在extra更新进度后，点击refresh，“50”显示的条目不会更新，但重新刷新页面后是进度管理是没问题，只是脚本显示逻辑的问题。
- V0.3.3: 修复bug
- V0.3.0: 解决遍历正在观看的列表卡顿的问题，测试大概5秒左右能完成一次刷新（动画三次元共60部，书籍55本）
- V0.2.4: extra 格子都能通过ajax来发请求了，算是所有基本功能完成了
- V0.2.3: 修复了一些错误，加上了书籍 extra 格子
- V0.2.2: 修复兼容性问题，优化部分代码
- V0.2.0: 支持三次元格子了
- V0.1.1: 修改了提示信息

![Screenshot](http://r6.loli.io/NB3eEr.png)

![Screenshot](http://r5.loli.io/2AB7j2.png)
