# [yonjar](https://bgm.tv/user/yonjar)

## [bangumi评论统计](https://github.com/bangumi/scripts/blob/master/yonjar/comments_detail.user.js?raw=true)

在标题右边显示该主题下的评论情况 

- 有多少用户发表过评论 
- 自己是否评论过 
- 鼠标移到用户名上查看评论次数

## [bangumi收藏列表显示Rank](https://github.com/bangumi/scripts/blob/master/yonjar/show_rank.user.js?raw=true)

在用户的收藏列表下显示作品的排名并高亮显示		

- 通过点击 "Rank" 按钮显示Rank
- Rank1000以内背景为绿色 
- Rank1000~2000为蓝色 
- Rank2000外为红色 
- 没上榜的显示为 "undefined" 背景为黑色

![bangumi收藏列表显示Rank效果](images/show_rank_demo1.png)

## [好友动态&全站动态切换](https://github.com/bangumi/scripts/blob/master/yonjar/timeline_switch.user.js?raw=true)

好友动态&全站动态 切换
!全站动态只有一页

## [用户详情爬取](https://github.com/bangumi/scripts/blob/master/yonjar/user_detail.user.js?raw=true)

本脚本不提供实际的功能 但能方便其他用户自行编写脚本
爬取用户的资料 导出到localstorage

- 收藏的角色
- 收藏的人物
- 好友
- 小组

初次使用要先到设置页`bangumi.tv/settings`进行首次爬取 以后**手动按需更新**
![用户详情爬取设置](images/user_detail_demo1.png)

如何取出数据:

	let localData = localStorage.getItem('bgm_user_detail_by_yonjar');
	let user_detail = JSON.parse(localData);

数据结构:

	{
		uid: "yonjar",    // 用户id
		characters: ["23","456"],    // 收藏的角色 数组元素为id 下同
		persons: ["67","1"],    // 收藏的人物
		friends: ["sai","abc"],    // 好友
		groups: ["a","u_devs"],    // 小组
		updateTime: 1506999160287    // 当前数据最后更新时间
	}

## [bgm角色数目统计](https://github.com/bangumi/scripts/blob/master/yonjar/character_plus.user.js?raw=true)

只是上面"用户详情爬取"脚本的一个demo
某声优的出演角色页面功能增强

## [bgm话题收藏](https://github.com/bangumi/scripts/blob/master/yonjar/topic_collect.user.js?raw=true)

收藏bangumi小组的话题、用户的日志、条目的讨论

## [整合bangumi小组(谷歌自定义)搜索](https://github.com/bangumi/scripts/blob/master/yonjar/google_search.user.js?raw=true)

整合bangumi小组(谷歌自定义)搜索

## [bangumi条目图表增强](https://github.com/bangumi/scripts/blob/master/yonjar/subject_charts.user.js?raw=true)

动画条目下的ep、vote、tags和观看情况数据的简单可视化

## [bangumi评论显示是否为好友](https://github.com/bangumi/scripts/blob/master/yonjar/who_is_my_friend.user.js?raw=true)

在主题下的评论高亮自己的好友的用户名, 本脚本功能依赖[user_detail.user.js](https://github.com/bangumi/scripts/blob/master/yonjar/user_detail.user.js?raw=true), 请先安装设置

## [bangumi危险名单](https://github.com/bangumi/scripts/blob/master/yonjar/dangerous_list.user.js?raw=true)

标记用户 暂无屏蔽功能