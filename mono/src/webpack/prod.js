/**
 * webpack config (production)
 */
const webpackMerge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = webpackMerge([
  require("./common"),
  {
    entry: require("./entry"),
    output: {
      path: path.join(__dirname, "..", "prod"),
      filename: "[name].min.js",
      sourceMapFilename: "[name].min.map"
    },
    plugins: [
      new webpack.DefinePlugin({
        $$webpack_dev: JSON.stringify(false),
        "process.env": {
          NODE_ENV: JSON.stringify("production")
        },
      }),
      new BabiliPlugin({}),
      /* disable uglifyJS in favor of babili, for ES6 support */
      null && new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {
          warnings: true,
          drop_console: false
        }
      }),
    ].filter(v => !!v)
  }
]);
