var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

const TARGET_SCRIPT = 'bangumi_anime_score_compare'

module.exports = {
  entry: {
    [TARGET_SCRIPT]: `./js/${TARGET_SCRIPT}.js`
  },
  output:  {
    path: path.resolve(__dirname, '../'),
    filename: '[name].user.js'
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync(path.join(__dirname, `./header/${TARGET_SCRIPT}.js`), 'utf8'),
      raw: true,
      entryOnly: true,
    })
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
