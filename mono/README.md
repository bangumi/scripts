# bgm-scripts-dev

用于`bangumi.tv` 的用户脚本

## [章节列表的表格编辑器](bgm-eps-editor.min.user.js?raw=true)

(已经上传开发者平台: https://bgm.tv/dev/app/166 )

![Screenshot](screenshots/bgm-eps-editor.png)

- 表格编辑器中的数据和原本的文本编辑器联动 (编辑一边时另一边会同时更新)
- 在表格编辑器中粘贴多行文本时, 会覆盖当前和下方的单元格 (类似Excel)
- 表格编辑器和文本编辑器一样可多次撤销

[压缩build](bgm-eps-editor.min.user.js) / [未压缩build](bgm-eps-editor.user.js)

## 如何编译

本repo代码使用了yarn, TypeScript和Webpack. 相关的编译命令如下:

```text
# (在源代码目录: mono/src 下)

# 安装npm包
$ yarn

# 在 dist/ 下重新生成各脚本
$ ./dist.sh

```
