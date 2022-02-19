require('dotenv').config();
const { merge } = require('webpack-merge');

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const FS = require('fs');
const MessageFormat = require('@messageformat/core');
const compileModule = require('@messageformat/core/compile-module');

const parts = require('./webpack.parts');

// i18n START

const LANG: string = parts.EnvCheckerPlugin.findParam('lang');
const EscStr = '&-p-&';
let i18n: any = {};
if (LANG) {
  const poFile = `i18n/${LANG}.po`;
  const varsFile = `i18n/vars/${LANG}.po`;

  try {
    let po = FS.readFileSync(poFile, 'utf8');
    
    try {
      const vars = FS.readFileSync(varsFile, 'utf8');
      po += `\n${vars}\n`;

    } catch (e: any) {
      if ('ENOENT' === e.code) {
        console.error(`${parts.chalk.bold.red('Missing vars file:')} ${parts.chalk.bold.yellow(varsFile)}`);
      }
    }
    const { parsePo } = require('gettext-to-messageformat');
    const { headers, pluralFunction, translations } = parsePo(po.replace(/%(?![s|n|1])/g, EscStr));
    const mf = new MessageFormat(LANG, {
      customFormatters: { [headers.language]: pluralFunction }
    });

    for(const [key, value] of Object.entries(translations)) {
      i18n[key] = mf.compile(translations[key]);
    }

  } catch (e: any) {
    console.error(e)
    if ('ENOENT' === e.code) {
      console.error(`${parts.chalk.bold.red('Missing translation file:')} ${parts.chalk.bold.yellow(poFile)}`);
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
const _ = (str: string, params: any) => {
    if (str in i18n) {
      const regexp = /( |&nbsp;)+([\w]{1,2})?([\s])+/gi;
      const result = i18n[str](params).replace(new RegExp(EscStr, 'g'), '%').replace(/\n/g, '<br />');

      return result;
      // return -1 === result.indexOf('//') ? result.replace(/-/gi, '&#8209;') : result;
    } else {
      console.error(`${parts.chalk.bold.red('Missing translation for')} ${parts.chalk.bold.yellow(str)}`);
      return `[ ${str} ]`;
    }
  },
  _l = (str: string, params: any, links: string[]) => {
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
      homePage: `${parts.path.resolve(__dirname)}/src/assets/js/pages/index.ts`,
      aboutPage: `${parts.path.resolve(__dirname)}/src/assets/js/pages/about.js`,
    },

    target: ['web', 'es5'],
    resolve: {
      extensions: ['.ts', '.js'],
    },

    plugins: [
      new CaseSensitivePathsPlugin(),

      // Pages START
      new HtmlWebPackPlugin({
        filename: `${LANG}/index.html`,
        chunks: ['homePage'],
        template: './src/pages/index.pug',
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
        filename: `${LANG}/about.html`,
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
    ],
  },
]);

const productionConfig = merge([
  parts.loadOptimization(),
  parts.extractCSS(),
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


module.exports = (mode: any) => {
  if (mode) {
    if (mode.prod) {
      return merge(commonConfig, productionConfig, { mode });
    } else {
      return merge(commonConfig, developmentConfig, { mode });
    }
  }
};
