const path = require("path");

function resolve(basename) {
  return path.join(
    __dirname,
    "..",
    "lib-ts",
    basename
  );
}

module.exports = {
  "bgm-eps-editor": resolve("bgm-eps-editor.tsx"),
};
