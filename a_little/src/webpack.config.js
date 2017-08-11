var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

const TARGET_SCRIPT_LIST = ['bangumi_anime_score_compare']

function genEntry(list) {
  var entryObj = {}
  var p = []
  for (let script of list) {
    if (!script) {
      break
    }
    entryObj[script] = `./js/${script}.js`
    p.push(
      new webpack.BannerPlugin({
        banner: fs.readFileSync(path.join(__dirname, `./header/${script}.js`), 'utf8'),
        raw: true,
        entryOnly: true,
      })
    )
  }
  return [entryObj, p]
}

var entry = genEntry(TARGET_SCRIPT_LIST)


module.exports = {
  entry: entry[0],
  output:  {
    path: path.resolve(__dirname, '../'),
    filename: '[name].user.js'
  },
  plugins: [
    ...entry[1]
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader?presets[]=es2015'
      },
    ]
  }
};
