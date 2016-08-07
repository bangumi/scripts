# Bangumi 用户脚本

由于 Userscripts.org 不稳定，因此决定使用 GitHub 来发布和管理用于 Bangumi 上的用户脚本。

## 整理方式

首先在根目录下以自己的 Bangumi ID 为名建立文件夹，并在该文件夹内建立一个 `README.md` 文件用于展示和介绍自己的脚本。如果需要添加图片，可在自己的文件夹内再建立一个 `images` 文件夹，并将图片放在其中。

由于用户脚本都是单文件的，因此直接将用户脚本放到自己的文件夹内，并在 `README.md` 文件内添加相应介绍即可。`README.md` 的写法请参照下一节的模板。

网页截图推荐使用 PNG 格式，并且请在提交之前使用 [optipng](http://optipng.sourceforge.net/) 优化图片文件。

提交时的 commit message 可使用中文填写，但文件名请勿使用 ASCII 以外的字符。每个文件夹由作者自行维护，请勿擅自修改他人文件夹内的内容。如果希望给其他人的脚本贡献代码，可使用 pull request。

想要权限添加自己的脚本的，可以[点击这个链接](https://github.com/bangumi/scripts/issues/new?labels=%E6%B7%BB%E5%8A%A0%E6%9D%83%E9%99%90&title=%E6%B7%BB%E5%8A%A0%E5%86%99%E5%85%A5%E6%9D%83%E9%99%90%E7%BB%99%20[[Bangumi%E7%94%A8%E6%88%B7%E5%90%8D]])根据格式填写开一个新的 issue。通过后即可自己提交脚本，不需要使用 pull request 请求。

## 模板

```
# [Bangumi ID](https://bgm.tv/user/Bangumi ID)

## [脚本1](脚本1.user.js?raw=true)

脚本介绍，介绍一下脚本的功能和用法。如果有配图的话：

![屏幕截图](images/图片.png)

## [脚本2](脚本2.user.js?raw=true)

还是脚本介绍。
```
