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
  parts.loadImages(),

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
          test: /\.(ttf|eot|woff|woff2)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: 'assets/fonts/[name].[ext]',
            },
          },
        },
        {
          test: /\.html$/i,
          loader: 'html-loader',
          options: {
            attributes: {
              list: [
                // All default supported tags and attributes
                '...',
                {
                  tag: 'div',
                  attribute: 'data-src',
                  type: 'src',
                },
                {
                  tag: 'a',
                  attribute: 'href',
                  type: 'src',
                  filter: (tag, attribute, attributes, resourcePath) => {
                    // The `tag` argument contains a name of the HTML tag.
                    // The `attribute` argument contains a name of the HTML attribute.
                    // The `attributes` argument contains all attributes of the tag.
                    // The `resourcePath` argument contains a path to the loaded HTML file.

                    if (attributes.class === 'aa') {
                      return true;
                    }

                    return false;
                  },
                },
              ],
            },
          },
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
