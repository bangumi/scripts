# [inchei](https://bgm.tv/user/inchei)

## [使 bangumi 的 thickbox 可移动](https://greasyfork.org/zh-CN/scripts/38584-bangumi-moveable-thickbox)

讨论页：https://bgm.tv/group/topic/345086

使 bangumi 的 thickbox（用于写吐槽的框）可移动，以便在写评分的时候参考他人意见（吐槽箱）。

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

- 目录内直接搜索，点击搜索结果标题将对应链接粘贴到输入框内
  - 搜索章节时，点击搜索结果标题加载章节，点击章节将对应链接粘贴到输入框内
- 添加时直接修改评论和排序
- 兼容[目录批量编辑](https://bgm.tv/dev/app/1037)

## [加入或修改收藏时标签功能加强](https://greasyfork.org/zh-CN/scripts/513954-%E5%8A%A0%E5%85%A5%E6%88%96%E4%BF%AE%E6%94%B9%E6%94%B6%E8%97%8F%E6%97%B6%E6%A0%87%E7%AD%BE%E5%8A%9F%E8%83%BD%E5%8A%A0%E5%BC%BA)

讨论页：https://bgm.tv/group/topic/408232

加入或修改收藏时：
- 高亮自己与他人的共同标签
- 高亮其中的元标签
- 点击展开所有标签
- 可选自动填充标签
- 同步存储该类作品所有自己的标签
使用 localStorage 在出现自己标签的页面存储自己的标签。

## [章节讨论吐槽加强](https://greasyfork.org/zh-CN/scripts/516402-%E7%AB%A0%E8%8A%82%E8%AE%A8%E8%AE%BA%E5%90%90%E6%A7%BD%E5%8A%A0%E5%BC%BA)

讨论页：https://bgm.tv/group/topic/408098

章节讨论中置顶显示自己的吐槽，高亮参与讨论过的格子。

## [班固米右上角快速搜索](https://greasyfork.org/zh-CN/scripts/517607-%E7%8F%AD%E5%9B%BA%E7%B1%B3%E5%8F%B3%E4%B8%8A%E8%A7%92%E5%BF%AB%E9%80%9F%E6%90%9C%E7%B4%A2)

讨论页：https://bgm.tv/group/topic/409735

- ↑/↓ + ⏎ 快速进入搜索结果条目页
- 根据选择类别不同搜索

## [条目相关页面显示用户评价](https://greasyfork.org/zh-CN/scripts/520506-%E6%9D%A1%E7%9B%AE%E8%AE%A8%E8%AE%BA%E9%A1%B5%E6%98%BE%E7%A4%BA%E7%94%A8%E6%88%B7%E8%AF%84%E4%BB%B7)

讨论页：https://bgm.tv/group/topic/411796

- 在条目讨论版、章节讨论、角色或人物讨论、关联日志显示参与用户的评分、收藏状态、进度、短评
  - 在有多个相关条目的角色或人物讨论、关联日志中，于显示相关条目处选择要显示评分的条目
- 使用 ccf(subject_id) 查询相应条目
- 点击“加载失败”重新加载
- 点击“未标记xxx？”，填写个人令牌查询游客隐藏条目

## [时光机查询特定条目评价](https://greasyfork.org/zh-CN/scripts/520607)

讨论页：https://bgm.tv/group/topic/411925

- 在他人时光机同步率下方增加查询特定条目评价的功能
- 🔍或⏎搜索条目，点击结果标题，或输入作品ID，点击🆔

## [首页RSS订阅班友收藏](https://greasyfork.org/zh-CN/scripts/524603)

讨论页：https://bgm.tv/group/topic/414787

- 首页副栏增加“RSS订阅”
  - 输入用户ID并⏎，添加订阅
  - 点击用户ID，删除或访问主页
  - 🔄手动更新（默认720分钟更新）、📥导入/📤导出订阅ID列表（.json）
- 首页时间线“全部”“收藏”类按时间穿插RSS订阅项
- 首页时间线添加“RSS”类，只查看RSS订阅项

兼容：
- [将班固米首页的下一页改为加载更多](https://bgm.tv/dev/app/432)
- [为首页动态添加分类筛选“简评”](https://bgm.tv/dev/app/2482)
- [时间胶囊显示交换绝对时间与相对时间](https://bgm.tv/dev/app/3226)

不完全兼容：
- [Bangumi Unlimited Pages](https://bgm.tv/dev/app/17)，因为不知道为什么我这里不管开不开其他组件，都会点了“Auto Load Pages”就无限加载，不好测试。但是只是不能对新加载的内容穿插RSS项。

## [“好友”改为“关注”](https://greasyfork.org/zh-CN/scripts/518358-%E5%A5%BD%E5%8F%8B-%E6%94%B9%E4%B8%BA-%E5%85%B3%E6%B3%A8)

讨论页：https://bgm.tv/group/topic/410150

将用户界面中“好友”相关的描述改为“关注”相关的描述。没有“粉丝”。

兼容以下相关组件/脚本：
- [在讨论帖子标记出楼主和好友](https://bgm.tv/dev/app/1075)
- [确认是否添加为好友](https://bgm.tv/dev/app/783)
- [班固米马赛克瓷砖](https://bgm.tv/group/topic/344198)
- [显示/一键删除单向好友](https://bgm.tv/dev/app/1942)
- [好友看？](https://bgm.tv/dev/app/20)

## [展开所有回复](https://greasyfork.org/zh-CN/scripts/516186-%E5%B1%95%E5%BC%80%E6%89%80%E6%9C%89%E5%9B%9E%E5%A4%8D)

讨论页：https://bgm.tv/group/topic/409116

开启“[折叠长楼层](https://bgm.tv/dev/app/2214)”后，在标题旁增加点击可展开所有长楼层的按钮，便于搜索。

## <s>[bangumi thickbox 计数](https://greasyfork.org/zh-TW/scripts/371758-bangumi-thickbox-counter)</s>

<s>讨论页：https://bgm.tv/group/topic/351358</s>

<s>显示吐槽箱剩余的字数（暂时无法在输入文字之前提取出剩余字数）。</s>更加推荐组件里有的[简评字数统计](https://bgm.tv/dev/app/592)，此脚本不再更新。

## <s>[bangumi 繁体搜索支持](https://greasyfork.org/zh-CN/scripts/371540-bangumi-tc-searcher)</s>

<s>讨论页：https://bgm.tv/group/topic/345086</s>

<s>使繁体搜索页面跳转到简体搜索页面，避免搜索不到准确的内容。</s>网站功能仍未修复，但写太烂，此脚本作废。
