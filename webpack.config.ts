require('dotenv').config();
const { merge } = require('webpack-merge');

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
// const ErrorOverlayPlugin = require('error-overlay-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

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

const path2 = require('path');

const commonConfig = merge([
  parts.loadHTML(),
  parts.loadPug(),
  parts.loadImages(),
  parts.loadJavaScript(),
  parts.loadTypescript(),
  parts.loadFonts(),
  parts.clean(),
  {
    entry: {
      homePage: `${path2.resolve(__dirname)}/src/assets/js/pages/index.ts`,
      aboutPage: `${path2.resolve(__dirname)}/src/assets/js/pages/about.js`,
    },

    target: ['web', 'es5'],
    resolve: {
      extensions: ['.ts', '.js'],
    },

    plugins: [
      // new ErrorOverlayPlugin(),
      new CaseSensitivePathsPlugin(),

      // Pages START
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
      // Pages END

      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'defer',
      }),
      // new FaviconsWebpackPlugin({
      //   logo: './src/static/favicon.jpg',
      //   prefix: 'favicons/',
      // }),
      new HtmlWebpackHarddiskPlugin(),
    ],
  },
]);

const productionConfig = merge([
  parts.loadOptimization(),
  parts.extractCSS(),
  parts.minifyCSS(),
  parts.generateSourceMaps({ type: 'nosources-source-map' }),
  parts.attachRevision(),
  parts.loadOutput(),
  {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled'
      }),
    ],
  },
]);

const developmentConfig = merge([
  parts.loadOutput('[name].[fullhash].js'),
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT,
  }),
  parts.generateSourceMaps({ type: 'eval-source-map' }),
  parts.loadCSS(),
]);


module.exports = (mode: 'production' | 'development' | 'none') => {
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, { mode });
  }

  return merge(commonConfig, developmentConfig, { mode });
};
