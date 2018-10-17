# [liaune](https://bgm.tv/user/liaune)

## [条目列表显示增强](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%E5%88%97%E8%A1%A8%E6%98%BE%E7%A4%BA%E5%A2%9E%E5%BC%BA.user.js)

讨论页面：https://bgm.tv/group/topic/344034

在用户的收藏列表和目录页面下显示条目的排名，站内评分和评分人数，好友评分和评分人数，并提供排名功能

源于：[yonjar的脚本](https://github.com/bangumi/scripts/tree/master/yonjar)
- 显示Rank，站内评分和评分人数，好友评分和评分人数
- 支持按排名排序、时间排序、评分人数排序、好友评分排序
- 采用了localStorage，可查看历史记录，大大缩短等待时间，减少了不必要的请求

## [关联条目显示增强](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%E5%85%B3%E8%81%94%E6%9D%A1%E7%9B%AE%E6%98%BE%E7%A4%BA%E5%A2%9E%E5%BC%BA.user.js)

讨论页面：https://bgm.tv/group/topic/344547

显示条目页面关联条目的完成情况

- 用不同的边框颜色显示关联条目的完成情况（wish（红）、collect（蓝）、do（绿）、on_hold（橙）、dropped（灰））
- 在关联条目下方显示Rank（若有）
- 使用了localstorage，需要更新数据时请点击上方的“更新”按钮

## [自动加载下页](https://github.com/bangumi/scripts/raw/master/liaune/bangumi_unlimited_pages.user.js)

讨论页面：https://bgm.tv/group/topic/344601

- 在有分页的页面，滚动到最下方，点击‘Auto Load Pages’，即可通过鼠标滚轮自动加载下一页；点击‘Load All Pages’，可自动加载所有分页，再次点击可停止
- 新加载的页面不会自动加载其他脚本
- Edge会乱码

## [只看未完成条目](https://github.com/bangumi/scripts/raw/master/liaune/%E5%8F%AA%E7%9C%8B%E6%9C%AA%E5%AE%8C%E6%88%90%E6%9D%A1%E7%9B%AE.user.js)

讨论页面：http://bgm.tv/group/topic/346158

- 显示列表条目的完成状态，以不同的颜色区分。
- 只看未完成条目，隐藏已完成和抛弃的列表条目，再次点击可完全显示。

## [条目列表排序](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%E6%9D%A1%E7%9B%AE%E5%88%97%E8%A1%A8%E6%8E%92%E5%BA%8F.user.js)

讨论页面：https://bgm.tv/group/topic/347962

- 对条目列表进行按排名、人数、时间排序
- 点击按人数和时间排序后，会出现筛选输入框，输入选择范围即可对当前列表进行筛选。注意输入正确的时间格式，如：xxxx 或 xxxx-xx-xx

## [角色收藏](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%E8%A7%92%E8%89%B2%E6%94%B6%E8%97%8F.user.js)

讨论页面：https://bgm.tv/group/topic/347970

- 在角色和人物后面显示❤收藏图标，方便快捷地收藏角色
- 前往自己的角色收藏页面，点击“收藏”可以将已收藏的角色添加到 localstorage
- 使用之前可以先安装 [User Detail](https://github.com/bangumi/scripts/tree/master/yonjar#user-content-%E7%94%A8%E6%88%B7%E8%AF%A6%E6%83%85%E7%88%AC%E5%8F%96)，因为采用了相同的 localstorage

## [好友统计](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%E5%A5%BD%E5%8F%8B%E7%BB%9F%E8%AE%A1.user.js)

- 显示好友的最近一条Timeline时间，显示总好友数、活跃好友数，3天内有更新Timeline的：Active，100天内有更新Timeline的：Alive，100天以上没更新Timeline的：M.I.T(Missing In Time)；
- 显示好友的注册时间，08-10：Senior，11-13：Junior，14-16：Sophomore，17-：Freshman；
- 显示好友与自己的共同爱好数量和同步率，根据一定的公式计算出高同步率的好友。

## [Bangumi Show Watching Days](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%20show%20watching%20days.user.js)

- 首页显示在看条目的已看天数,收藏页面显示条目的已看天数和完成天数，开始看的时间可以修改和保存
- 先去“在看”页面或Timeline获取时间方可正常使用

## [Bangumi Table List](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20table%20list.user.js)

- 在条目列表点击表格图标可以表格形式显示列表

## [条目评分排名历史记录](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%E6%9D%A1%E7%9B%AE%E8%AF%84%E5%88%86%E6%8E%92%E5%90%8D%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95.user.js)

- 在浏览条目列表时记录条目的评分排名信息，在Rank上显示

## [目录条目名中文化](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20%E7%9B%AE%E5%BD%95%E6%9D%A1%E7%9B%AE%E5%90%8D%E4%B8%AD%E6%96%87%E5%8C%96.user.js)

- 目录条目名中文化，暂时不支持人物和章节

## [Endless MAGI](https://github.com/bangumi/scripts/raw/master/liaune/bangumi%20Endless%20MAGI.user.js)

- 为已完成终极试炼的人开启无尽试炼

