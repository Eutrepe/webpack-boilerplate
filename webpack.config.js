require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

const HtmlWebPackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const ErrorOverlayPlugin = require('error-overlay-webpack-plugin');

const defaultMeta = {
  viewport:
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no"',
  'msapplication-tap-highlight': 'no',
  charset: {
    charset: 'utf-8',
  },
  compatible: {
    'http-equiv': 'x-ua-compatible',
    content: 'ie=edge',
  },
};

const parts = require('./webpack.parts');

const commonConfig = merge([
  {
    entry: {
      homePage: './src/assets/js/pages/index.js',
      aboutPage: './src/assets/js/pages/about.js',
    },
    output: {
      path: path.resolve(__dirname, './web'),
      publicPath: '',
      // publicPath: 'http://localhost:9090/',
    },
    devtool: 'cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.html$/i,
          loader: 'html-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new ErrorOverlayPlugin(),
      new CaseSensitivePathsPlugin(),
      new HtmlWebPackPlugin({
        filename: 'index.html',
        chunks: ['homePage'],
        template: './src/pages/index.html',
        inject: 'head',
        meta: defaultMeta,
        alwaysWriteToDisk: true,
      }),
      new HtmlWebPackPlugin({
        filename: 'about.html',
        chunks: ['aboutPage'],
        template: './src/pages/about.html',
        inject: 'head',
        meta: defaultMeta,
        alwaysWriteToDisk: true,
      }),
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'defer',
      }),
      new FaviconsWebpackPlugin({
        logo: './src/static/favicon.jpg',
        prefix: 'favicons/',
      }),
      new HtmlWebpackHarddiskPlugin(),
    ],
  },
]);

const productionConfig = merge([parts.extractCSS()]);

const developmentConfig = merge([
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT,
  }),

  parts.loadCSS(),
]);

module.exports = mode => {
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, { mode });
  }

  return merge(commonConfig, developmentConfig, { mode });
};
