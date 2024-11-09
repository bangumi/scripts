# [inchei](https://bgm.tv/user/inchei)

## [使 bangumi 的 thickbox 可移动](https://greasyfork.org/zh-CN/scripts/38584-bangumi-moveable-thickbox)

讨论页：https://bgm.tv/group/topic/345086

使 bangumi 的 thickbox（用于写吐槽的框）可移动，以便在写评分的时候参考他人意见（吐槽箱）。

参考：[JavaScript 实现最简单的拖拽效果](http://www.zhangxinxu.com/wordpress/2010/03/javascript%E5%AE%9E%E7%8E%B0%E6%9C%80%E7%AE%80%E5%8D%95%E7%9A%84%E6%8B%96%E6%8B%BD%E6%95%88%E6%9E%9C/)（张鑫旭）

## [班固米代码高亮](https://greasyfork.org/zh-CN/scripts/516547-%E7%8F%AD%E5%9B%BA%E7%B1%B3%E4%BB%A3%E7%A0%81%E9%AB%98%E4%BA%AE)

讨论页：https://bgm.tv/group/topic/409276

- 使用 highlight.js 自动检测代码块语言并高亮
- 添加一键复制按钮
- 支持夜间模式
- 兼容性
  - 兼容[bangumi 僞質感設計样式](https://github.com/inchei/userstyles)
  - 大概率不兼容[代码块超进化！](https://bgm.tv/dev/app/1049)

## [目录内添加条目增强](https://greasyfork.org/zh-CN/scripts/516479-%E7%9B%AE%E5%BD%95%E5%86%85%E6%B7%BB%E5%8A%A0%E6%9D%A1%E7%9B%AE%E5%A2%9E%E5%BC%BA)

讨论页：https://bgm.tv/group/topic/409246

- 目录内直接搜索条目，点击搜索结果将对应链接粘贴到输入框内
- 添加后跳转到对应位置
- 兼容[目录批量编辑](https://bgm.tv/dev/app/1037)
不能搜索人物/章节，因为 API 不能搜。

## [展开所有回复](https://greasyfork.org/zh-CN/scripts/516186-%E5%B1%95%E5%BC%80%E6%89%80%E6%9C%89%E5%9B%9E%E5%A4%8D)

讨论页：https://bgm.tv/group/topic/409116

开启“[折叠长楼层](https://bgm.tv/dev/app/2214)”后，在标题旁增加点击可展开所有长楼层的按钮，便于搜索。

## [加入或修改收藏时标签功能加强](https://greasyfork.org/zh-CN/scripts/513954-%E5%8A%A0%E5%85%A5%E6%88%96%E4%BF%AE%E6%94%B9%E6%94%B6%E8%97%8F%E6%97%B6%E6%A0%87%E7%AD%BE%E5%8A%9F%E8%83%BD%E5%8A%A0%E5%BC%BA)

讨论页：https://bgm.tv/group/topic/408232

加入或修改收藏时：
- 高亮自己与他人的共同标签
-  高亮其中的元标签
- 点击展开所有标签
- 可选自动填充标签
使用 localStorage 在出现自己标签的页面存储自己的标签。

## [章节讨论吐槽加强](https://greasyfork.org/zh-CN/scripts/516402-%E7%AB%A0%E8%8A%82%E8%AE%A8%E8%AE%BA%E5%90%90%E6%A7%BD%E5%8A%A0%E5%BC%BA)

讨论页：https://bgm.tv/group/topic/408098

章节讨论中置顶显示自己的吐槽，高亮参与讨论过的格子

## 进度条文字显示不清修复

```css
div.SidePanel .progress .inner {
    word-break: keep-all;
    background: #FFF url(/img/bangumi/bangumi_ui_1.png) repeat-x 0 -55px;
}
```

## <s>[bangumi thickbox 计数](https://greasyfork.org/zh-TW/scripts/371758-bangumi-thickbox-counter)</s>

<s>讨论页：https://bgm.tv/group/topic/351358</s>

<s>显示吐槽箱剩余的字数（暂时无法在输入文字之前提取出剩余字数）。</s>更加推荐组件里有的[简评字数统计](https://bgm.tv/dev/app/592)，此脚本不再更新。

## <s>[bangumi 繁体搜索支持](https://greasyfork.org/zh-CN/scripts/371540-bangumi-tc-searcher)</s>

<s>讨论页：https://bgm.tv/group/topic/345086</s>

<s>使繁体搜索页面跳转到简体搜索页面，避免搜索不到准确的内容。</s>网站功能已经修复，此脚本作废。
