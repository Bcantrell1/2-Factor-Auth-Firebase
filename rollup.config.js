import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve'
import commonjs from '@rollup/plugin-commonjs';

module.exports = {
    input: 'src/index.js',
    output: {
        file: 'public/bundle.js',
        format: 'cjs'
    },
    plugins: [
        commonjs(),
        resolve(), 
        serve({
            port: 5200,
            open: true,
            contentBase: 'public'
    })]
};