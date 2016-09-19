# [prevails](https://bgm.tv/user/prevails)
nickname: Donuts.

## [首页放送整合 bgmlist.com 数据, 作为"在看"时间表](bgmlist_integrator.user.js?raw=true)
### 数据取自 http://bgmlist.com
其放送数据**只包含国内正版连载番剧**.<br>
因此, 放送列表中, (原有的)*国内没有版权的番剧*将无法显示

### 只展现你当前"在看"的番剧的放送情况
Bangumi 放送列表中原有的其它番剧会被清理掉

### 换季时若发现内容没有正确呈现
请更新脚本, 或尝试删除并重新安装脚本

若仍不准确...

你可以去看看 http://bgmlist.com 上的数据是否准确

### bgmlist 支持日本放送日
若需使用, 请把 TIME_ZONE 的值写为 'JP', 并保存

## [标注 ep 讨论人气：EpPopuVisualizer](ep_popu_visualizer.user.js?raw=true)

相关讨论位于 https://bgm.tv/group/topic/340530

- 用 __颜色深浅__ 或 __条形图__ 标注 ep(章节) 的讨论人气
- 直观展现番剧的讨论走势和热点!
- 可在 条目页(/subject/*) 或 首页(/) 起作用
- 可在 __主页右边栏下方的设置面板 "EpPopuVisualizer 设置"__ 选择显示方式, 选用自己喜欢的颜色进行标注


## [章节讨论剧透关键词折叠：EpSpoilerFolder](ep_spoiler_folder.user.js?raw=true)

若某层楼的讨论中包含“剧透”二字，则含有剧透内容的可能性会比较大. 本插件用于在章节讨论中折叠这类讨论，以免不小心看到剧透.

- 当楼层中提及“剧透”二字时，自动折叠该楼层全部内容，你可以通过点击重新展开楼层的内容
- 当然，没有提及剧透内容但含有“剧透”二字的楼层会被错杀，没有“剧透”二字却有剧透内容的也会被放过……
- 在折叠状态下只能看到楼层发帖人的信息，子回复数
- 折叠状态下该楼层回复按钮失效
- 在章节讨论页（/ep/*），以及移动触屏（/m），超展开（/rakuen）中打开的章节讨论起作用

## [点抛弃时自动勾选“仅自己可见”](set_privacy_on_drop.user.js?raw=true)

- 在所有你主动点"抛弃"的时刻, 自动选中"仅自己可见"
- 若你点"抛弃"之后又改变主意(如点了"搁置"), 自动恢复点"抛弃"之前的状态

## [给人物的日文名中汉字标注读音](jp_name_kanji_pronunciation.user.js?raw=true)
记汉字的读音常常令日语初学者头疼, 人名又是少见汉字和一字多音的重灾区

这个用户脚本使用网站里原有的人物条目数据帮大家把读音标到人物页首人名的汉字上, 比在 infobox 里慢慢找要更加直观, 
让人一打开页面就能正确地读出人物的名字

效果如下
![example_0](images/example_jp_name_kanji_pronunciation_0.jpg)
![example_1](images/example_jp_name_kanji_pronunciation_1.jpg)