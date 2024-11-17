import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ES Modules, __filename and __dirname are not defined by default.
// Manually define them:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import 'dotenv/config';
import { merge } from 'webpack-merge';

import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import Dotenv from 'dotenv-webpack';

import FS from 'fs';
import MessageFormat from '@messageformat/core';

import chalk from 'chalk';

import * as parts from './webpack.parts.js';

// i18n START

const LANG = parts.EnvCheckerPlugin.findParam('lang');
const EscStr = '&-p-&';
let i18n = {};
if (LANG) {
  const poFile = `i18n/${LANG}.po`;
  const varsFile = `i18n/vars/${LANG}.po`;

  try {
    let po = FS.readFileSync(poFile, 'utf8');

    try {
      const vars = FS.readFileSync(varsFile, 'utf8');
      po += `\n${vars}\n`;
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error(
          `${chalk.bold.red('Missing vars file:')} ${chalk.bold.yellow(varsFile)}`
        );
      }
    }

    const gettextToMessageFormat = await import('gettext-to-messageformat');
    const { parsePo } = gettextToMessageFormat.default;

    const { headers, pluralFunction, translations } = parsePo(
      po.replace(/%(?![s|n|1])/g, EscStr)
    );
    const mf = new MessageFormat(LANG, {
      customFormatters: { [headers.language]: pluralFunction },
    });

    for (const [key, value] of Object.entries(translations)) {
      i18n[key] = mf.compile(translations[key]);
    }
  } catch (e) {
    console.error(e);
    if (e.code === 'ENOENT') {
      console.error(
        `${chalk.bold.red('Missing translation file:')} ${chalk.bold.yellow(poFile)}`
      );
    }
  }
}
// i18n END

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

// i18n START
const _ = (str, params) => {
  if (str in i18n) {
    const result = i18n[str](params)
      .replace(new RegExp(EscStr, 'g'), '%')
      .replace(/\n/g, '<br />');

    return result;
  } else {
    console.error(
      `${chalk.bold.red('Missing translation for')} ${chalk.bold.yellow(str)}`
    );
    return `[ ${str} ]`;
  }
};

const _l = (str, params, links) => {
  str = _(str, params);
  let n = 0;
  return str.replace(/\[\[(.+?)\]\]/g, function (match, contents) {
    return `<a ${links[n++]}>${contents}</a>`;
  });
};
// i18n END

const commonConfig = merge([
  parts.loadHTML(),
  parts.loadPug(),
  parts.loadImages(),
  parts.loadVideos(),
  parts.loadAudios(),
  parts.loadJavaScript(),
  parts.loadTypescript(),
  parts.loadFonts(),
  parts.clean(),
  {
    entry: {
      homePage: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/index.ts`,
      aboutPage: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/about.js`,
    },

    target: ['web', 'es6'],
    resolve: {
      extensions: ['.ts', '.js'],
    },

    plugins: [
      new CaseSensitivePathsPlugin(),

      // Pages START
      new HtmlWebPackPlugin({
        filename: `index-${LANG}.html`,
        chunks: ['homePage'],
        // template: './src/pages/index.pug',
        // template: './src/pages/index.html',
        template: './src/pages/index.ejs',
        inject: 'head',
        meta: defaultMeta,
        alwaysWriteToDisk: true,
        scriptLoading: 'defer',
        templateParameters: {
          lang: LANG,
          _: _,
          _l: _l,
        },
      }),
      new HtmlWebPackPlugin({
        filename: `about-${LANG}.html`,
        chunks: ['aboutPage'],
        template: './src/pages/about.html',
        inject: 'head',
        meta: defaultMeta,
        alwaysWriteToDisk: true,
        scriptLoading: 'defer',
        templateParameters: {
          lang: LANG,
          _: _,
          _l: _l,
        },
      }),
      // Pages END

      new FaviconsWebpackPlugin({
        logo: './src/static/favicon.jpg',
        prefix: 'favicons/',
      }),
      new HtmlWebpackHarddiskPlugin(),
      new Dotenv(),
    ],
  },
]);

const productionConfig = merge([
  parts.loadOptimization(),
  parts.generateSourceMaps({ type: 'nosources-source-map' }),
  parts.extractCSS(),
  parts.attachRevision(),
  parts.loadOutput(),
  {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
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
    open: [`index-${LANG}.html`],
  }),
  parts.generateSourceMaps({ type: 'eval-source-map' }),
  parts.loadCSS(),
]);

export default (env, argv) => {
  const mode = argv.mode || 'development';
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, { mode });
  } else {
    return merge(commonConfig, developmentConfig, { mode });
  }
};
