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
import WebpackShellPluginNext from 'webpack-shell-plugin-next';

import FS from 'fs';
import MessageFormat from '@messageformat/core';
import * as cheerio from 'cheerio';

import chalk from 'chalk';
import * as parts from './webpack.parts.js';

// i18n START

const LANG = parts.EnvCheckerPlugin.findParam('lang');
const GIT_INFO = parts.EnvCheckerPlugin.findParam('gitInfo');
const EXTRACT_BODY = parts.EnvCheckerPlugin.findParam('extractBody');

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
          `${chalk.bold.red('Missing vars file:')} ${chalk.bold.yellow(varsFile)}`,
        );
      }
    }

    const gettextToMessageFormat = await import('gettext-to-messageformat');
    const { parsePo } = gettextToMessageFormat.default;

    const { headers, pluralFunction, translations } = parsePo(
      po.replace(/%(?![s|n|1])/g, EscStr),
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
        `${chalk.bold.red('Missing translation file:')} ${chalk.bold.yellow(poFile)}`,
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
      `${chalk.bold.red('Missing translation for')} ${chalk.bold.yellow(str)}`,
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
        template: './src/pages/about.ejs',
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

const htmlFileContentConfig = merge([
  {
    plugins: [
      new WebpackShellPluginNext({
        onBuildEnd: {
          scripts: [
            async () => {
              const gitData = {
                branch: '',
                repo: '',
              };

              const branch = await parts.getBranch();
              const repo = await parts.getRepo();
              const srcFiles = parts.getAllFiles('public', []);
              const htmlRegExp = /(.)*\.html/;

              const htmlFiles = srcFiles.filter((file) =>
                file.match(htmlRegExp),
              );

              if (branch && typeof branch === 'string') {
                gitData.branch = branch;
              }

              if (repo && typeof repo === 'string') {
                gitData.repo = repo.split(':')[1];
              }

              for (const file of htmlFiles) {
                try {
                  const data = FS.readFileSync(file, 'utf8');
                  const $ = cheerio.load(data);
                  const comment = `\n<!-- git: ${gitData.branch}, ${gitData.repo} -->\n`;

                  if (EXTRACT_BODY !== null && GIT_INFO === null) {
                    const bodyContent = $('body').html();
                    FS.writeFileSync(file, bodyContent, 'utf8');
                  }

                  if (EXTRACT_BODY === null && GIT_INFO !== null) {
                    $('body').append(`\n${comment}\n`);
                    FS.writeFileSync(file, $.html(), 'utf8');
                  }

                  if (EXTRACT_BODY !== null && GIT_INFO !== null) {
                    const bodyContent = $('body').html();
                    const finalContent = bodyContent + comment;
                    FS.writeFileSync(file, finalContent, 'utf8');
                  }
                } catch (err) {
                  console.error(`Error processing file ${file}:`, err);
                }
              }
            },
          ],
          blocking: true,
          parallel: false,
        },
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

  // const addGitInfo = env.addGitInfo === 'true'; // Konwertuj na boolean

  if (mode === 'production') {
    const config = merge(commonConfig, productionConfig, { mode });

    if (GIT_INFO !== null || EXTRACT_BODY !== null) {
      return merge(config, htmlFileContentConfig, { mode });
    }

    return config;
  } else {
    return merge(commonConfig, developmentConfig, { mode });
  }
};
