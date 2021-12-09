# bgm-scripts/mono

用于 `bangumi.tv` 的用户脚本

## 章节列表的表格编辑器

- [bgm开发者平台](https://bgm.tv/dev/app/166)
- [代码](dist/bgm-eps-editor.user.js)
- [从GitHub raw安装](dist/bgm-eps-editor.user.js?raw=true)

![Screenshot](screenshots/bgm-eps-editor.png)

- 表格编辑器中的数据和原本的文本编辑器联动 (编辑一边时另一边会同时更新)
- 在表格编辑器中粘贴多行文本时, 会覆盖当前和下方的单元格 (类似Excel)
- 表格编辑器和常见文本编辑器一样可多次撤销 (Ctrl-Z)

[未压缩build](dist/bgm-eps-editor.user.js) / 如需要压缩build可以clone后自行webpack

## 修正bgm页面内的其他bgm域名的链接

- 将bgm站内的其他bgm域名转换为当前页面的域名

- [bgm开发者平台](https://bgm.tv/dev/app/264)
- [代码](dist/bgm-unified-origin.user.js)
- [从GitHub raw安装](dist/bgm-unified-origin.user.js?raw=true)

## 如何编译

本repo代码使用了yarn, TypeScript和Webpack. 相关的编译命令如下:

```text
# (在源代码目录: mono/src 下)

# 安装npm包
$ yarn

# 在 dist/ 下重新生成各脚本
$ ./dist.sh

```
