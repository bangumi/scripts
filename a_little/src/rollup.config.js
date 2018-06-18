import path from 'path';
import commonjs from 'rollup-plugin-commonjs';
import license from 'rollup-plugin-license';
import fs from 'fs';

const n = 'bt_search_for_bgm';
export default {
  input: `js/${n}.js`,
  output: {
    file: path.resolve(__dirname, `../${n}.user.js`),
    format: 'iife',
    sourcemap: false
  },
  plugins: [
    commonjs(),
    license({
      banner: '/** h */\n' + fs.readFileSync(path.join(__dirname, `./header/${n}.js`), 'utf8'),
    })
  ]
};
