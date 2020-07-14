require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
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

module.exports = {
  entry: {
    homePage: './src/assets/js/pages/index.js',
    aboutPage: './src/assets/js/pages/about.js',
  },
  output: {
    path: path.resolve(__dirname, './web'),
    publicPath: '',
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    // Display only errors to reduce the amount of output.
    stats: 'errors-only',

    // Parse host and port from env to allow customization.
    //
    // If you use Docker, Vagrant or Cloud9, set
    // host: "0.0.0.0";
    //
    // 0.0.0.0 is available to all network devices
    // unlike default `localhost`.
    host: process.env.HOST, // Defaults to `localhost`
    port: process.env.PORT, // Defaults to 8080
    open: true, // Open the page in browser
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
    ],
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
};
