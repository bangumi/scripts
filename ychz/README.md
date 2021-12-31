# [ychz](https://bgm.tv/user/ychz)

## [目录页多标签筛选](naiveFilter.user.js?raw=true)

[![install with tampermonkey](https://img.shields.io/badge/Install%20with-TamperMonkey-00adad.svg)](https://greasyfork.org/en/scripts/408448-%E7%95%AA%E7%BB%84%E8%AE%A1%E5%88%92-bangumi-%E7%9B%AE%E5%BD%95%E9%A1%B5%E5%A4%9A%E6%A0%87%E7%AD%BE%E7%AD%9B%E9%80%89)
[![enable in dev](https://img.shields.io/badge/Enable-超合金组件-F09199.svg)](https://bangumi.tv/dev/app/2036)

bangumi目录界面，在评价框中给条目添加用 空格 分隔的标签
- 搜索或点击评价框中任意标签，可对目录下的条目进行筛选
- 边栏有标签和元数据的汇总，点击也可进行筛选
- 在修改评价框内的标签后，会重新载入该目录此前筛选的标签

<img src="https://user-images.githubusercontent.com/17885952/147813323-72573e32-3000-4d21-9f69-d13acfa31dd9.gif" width="500"/>

### 用例与初衷
- 以前给标签数量少的条目加过很多个人色彩较强的标签，担心把条目的标签系统搞乱了，于是个人标签都放在目录的评价框里
- 目录中的条目大多有共同点，目录作者也倾向于将相同与不同点体现在评价框中并用某种符号（`,` `|` `空格` ）分割，这里用空格实现
- 即使评价框全为空，也可对条目数量很多的条目按元数据（年份）筛选

### 限制
- *组件版本没有搜索框，暂不支持记忆上次使用的标签*
- *评价框不可有的为空，有的不为空，将无法正常筛选（但当所有评价框都为空时，可按元数据筛选）* 