/**
 * webpack config (dev)
 */
const webpackMerge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");

module.exports = webpackMerge([
  require("./common"),
  {
    entry: require("./entry"),
    output: {
      path: path.join(__dirname, "..", "dev"),
      filename: "[name].js",
      sourceMapFilename: "[name].map"
    },
    devServer: {
      contentBase: path.join(__dirname, "..", "dev"),
      compress: true,
      port: 9000,
    },
    plugins: [
      new webpack.DefinePlugin({ $$webpack_dev: JSON.stringify(true) }),
      new webpack.NamedModulesPlugin(),
    ]
  }
]);
