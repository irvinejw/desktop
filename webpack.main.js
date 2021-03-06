const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const common = {
    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: 'pre',
                loader: 'tslint-loader'
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules\/(?!(@bitwarden)\/).*/
            },
        ]
    },
    plugins: [],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            jslib: path.join(__dirname, 'node_modules/@bitwarden/jslib/src')
        }
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build')
    }
};

const main = {
    target: 'electron-main',
    node: {
        __dirname: false,
        __filename: false
    },
    entry: {
        'main': './src/main.ts'
    },
    module: {
        rules: [
            {
                test: /\.node$/,
                loader: 'node-loader'
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin([
            path.resolve(__dirname, 'build/*')
        ]),
        new CopyWebpackPlugin([
            './src/package.json',
            { from: './src/images', to: 'images' },
            { from: './src/locales', to: 'locales' },
        ]),
    ],
    externals: [nodeExternals()]
};

module.exports = merge(common, main);
