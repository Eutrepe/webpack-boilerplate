import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ES Modules, __filename and __dirname are not defined by default.
// Manually define them:

import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import webpack from 'webpack';

import 'dotenv/config';
import { merge } from 'webpack-merge';

import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import Dotenv from 'dotenv-webpack';
import WebpackShellPluginNext from 'webpack-shell-plugin-next';
import { generateSitemap } from 'sitemap-ts';
import CopyWebpackPlugin from 'copy-webpack-plugin';

import FS from 'fs';
import MessageFormat from '@messageformat/core';
import * as cheerio from 'cheerio';
// import { renderTemplate } from './custom-ejs-engine.js';

import chalk from 'chalk';
import * as parts from './webpack.parts.js';
import { type } from 'os';

const generateDynamicRoutes = (lang) => {
  const routes = [];

  for (const page in pages) {
    if (pages[page].langs[lang]) {
      let route = '/' + pages[page].langs[lang].replace('.html', '');

      // Jeśli to index.html, ustaw jako root
      if (pages[page].langs[lang] === 'index.html') {
        route = '/';
      }

      routes.push(route);
    }
  }

  return routes;
};

// i18n START

const LANG = parts.EnvCheckerPlugin.findParam('lang');
const GIT_INFO = parts.EnvCheckerPlugin.findParam('gitInfo');
const EXTRACT_BODY = parts.EnvCheckerPlugin.findParam('extractBody');

const rawData = FS.readFileSync('pages.json', 'utf8');
let pages = JSON.parse(rawData);

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
const Lang = parts.EnvCheckerPlugin.findParam('lang');

const _t = (str, params) => {
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
  str = _t(str, params);
  let n = 0;
  return str.replace(/\[\[(.+?)\]\]/g, function (match, contents) {
    return `<a ${links[n++]}>${contents}</a>`;
  });
};

const _href = (page) => {
  if (pages[page]) {
    if ('index' === page) {
      return './';
    }
    return './' + pages[page].langs[Lang];
  } else {
    console.error(
      `${parts.chalk.bold.blue('Missing link for')} ${parts.chalk.bold.yellow(
        page,
      )}`,
    );
    return '#';
  }
};

// i18n END

// HTML pages START

const multipleHtmlPlugins = [];

for (const page in pages) {
  const htmlWebPackPlugin = new HtmlWebPackPlugin({
    filename: `${pages[page].langs[Lang]}`,
    chunks: pages[page].chunks ?? [],
    template: `./src/pages/${page}.pug`,
    templateParameters: {
      lang: Lang,
      _t: _t,
      _l: _l,
      _href: _href,
    },
    inject: 'head',
    meta: defaultMeta,
    alwaysWriteToDisk: true,
    scriptLoading: 'defer',
  });

  multipleHtmlPlugins.push(htmlWebPackPlugin);
}
// HTML pages END

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
      privacyPolicyPage: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/privacy-policy.ts`,

      // aboutPage: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/about.js`,
      // blogPage: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/blog.ts`,
    },

    target: ['web', 'es2021'],
    resolve: {
      extensions: ['.ts', '.js'],
    },

    plugins: [
      new CaseSensitivePathsPlugin(),

      // Pages START
      // new HtmlWebPackPlugin({
      //   filename: `index-${LANG}.html`,
      //   chunks: ['homePage'],
      //   template: './src/pages/index.pug',
      //   inject: 'head',
      //   meta: defaultMeta,
      //   alwaysWriteToDisk: true,
      //   scriptLoading: 'defer',
      //   templateParameters: {
      //     lang: LANG,
      //     _t: _t,
      //     _l: _l,
      //   },
      // }),

      // new HtmlWebPackPlugin({
      //   filename: `blog/index-${LANG}.html`,
      //   chunks: ['blogPage'],
      //   template: './src/pages/blog/index.ejs',
      //   inject: 'head',
      //   meta: defaultMeta,
      //   alwaysWriteToDisk: true,
      //   scriptLoading: 'defer',
      //   templateParameters: {
      //     lang: LANG,
      //     _t: _t,
      //     _l: _l,
      //   },
      // }),
      // Pages END

      new FaviconsWebpackPlugin({
        logo: './src/static/favicon.jpg',
        prefix: 'favicons/',
      }),
      new HtmlWebpackHarddiskPlugin(),
      new Dotenv(),
    ].concat(multipleHtmlPlugins),
  },
]);

const loadOutput = (
  filename = '[name].[contenthash].js',
  outputDir = './public',
) => ({
  output: {
    path:
      Lang === 'pl'
        ? path.resolve(__dirname, `${outputDir}`)
        : path.resolve(__dirname, `${outputDir}/${Lang}`),
    publicPath: '',
    filename: filename,
    assetModuleFilename: 'assets/images/[hash][ext][query]',
  },
});

const productionConfig = merge([
  parts.loadOptimization(),
  // parts.generateSourceMaps({ type: 'nosources-source-map' }),
  parts.generateSourceMaps({ type: false }),
  parts.extractCSS(),
  parts.attachRevision(),
  // parts.loadOutput(),
  loadOutput(),
  {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: 'llm.txt', to: '' }],
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

const sitemapConfig = merge([
  {
    plugins: [
      new WebpackShellPluginNext({
        onBuildEnd: {
          scripts: [
            async () => {
              // const outputDir = Lang === 'pl' ? './public' : `./public/${Lang}`;
              const outputDir = Lang === 'pl' ? './public' : `./public`;

              await generateSitemap({
                hostname: 'https://digitalsharks.pl', // Zmień na swoją domenę
                dynamicRoutes: generateDynamicRoutes(Lang),
                outDir: outputDir,
                changefreq: {
                  '/': 'monthly',
                  '/blog': 'weekly',
                  '*': 'monthly', // default dla reszty
                },
                priority: {
                  '/': 1.0,
                  '/blog': 0.9,
                  '*': 0.8, // default dla reszty
                },
                generateRobotsTxt: true,
                robots: [
                  {
                    userAgent: '*',
                    allow: '/',
                    disallow: ['/admin', '/private'],
                  },
                ],
              });

              console.log(
                `✅ Sitemap generated for ${Lang}: ${outputDir}/sitemap.xml`,
              );
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
  // loadOutput('[name].[fullhash].js', ''),
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT,
    // open: [`index-${LANG}.html`],
    open: [`/`],
  }),
  parts.generateSourceMaps({ type: 'eval-source-map' }),
  parts.loadCSS(),
]);

export default (env, argv) => {
  const mode = argv.mode || 'development';

  // const addGitInfo = env.addGitInfo === 'true'; // Konwertuj na boolean

  if (mode === 'production') {
    const config = merge(commonConfig, productionConfig, { mode });

    const configWithSitemap = merge(config, sitemapConfig, { mode });

    if (GIT_INFO !== null || EXTRACT_BODY !== null) {
      return merge(configWithSitemap, htmlFileContentConfig, { mode });
    }

    return configWithSitemap;
  } else {
    return merge(commonConfig, developmentConfig, { mode });
  }
};
