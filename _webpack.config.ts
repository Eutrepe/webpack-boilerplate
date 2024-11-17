require('dotenv').config();
const { merge } = require('webpack-merge');

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const FaviconsWebpackPlugin = require('favicons-webpack-plugin');


const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const { exec } = require('child_process');

const FS = require('fs');
const MessageFormat = require('@messageformat/core');
const compileModule = require('@messageformat/core/compile-module');

const parts = require('./webpack.parts');

const getBranch = () => new Promise((resolve, reject) => {
  return exec('git branch --show-current', (err: any, stdout: any, stderr: any) => {
      if (err) {
        reject(`getBranch Error: ${err}`);
      }
      else if (typeof stdout === 'string') {
        resolve(stdout.trim());
      }
  });
});

const getRepo = () => new Promise((resolve, reject) => {
  return exec('git config --get remote.origin.url', (err: any, stdout: any, stderr: any) => {
      if (err) {
        reject(`getRepo Error: ${err}`);
      }
      else if (typeof stdout === 'string') {
        resolve(stdout.trim());
      }
  });
});

const getAllFiles = function(dirPath: string, arrayOfFiles: string[]) {
  const files = FS.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file: string) => {
    if (FS.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(parts.path.join(dirPath, '/', file))
    }
  });

  return arrayOfFiles;
}


// i18n START

const LANG: string = parts.lang;
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
const
  _ = (str: string, params: any) => {
    if (str in i18n) {
      const regexp = /( |&nbsp;)+([\w]{1,2})?([\s])+/gi;
      const result = i18n[str](params)
        .replace(new RegExp(EscStr, 'g'), '%')
        .replace(/\n/g, '<br />')
        .replace(regexp, '$1$2&nbsp;')
        .replace(regexp, '$1$2&nbsp;') // musi byc 2x :)
      ;
      return -1 === result.indexOf('//') && -1 === result.indexOf('/')
        ? result.replace(/-/gi, '&#8209;')
        : result
      ;
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
  }
// i18n END

const commonConfig = (mode: any) => merge([
  parts.loadHTML(),
  parts.loadPug(),
  parts.loadImages(mode),
  // parts.loadMessages(),
  parts.loadJavaScript(),
  parts.loadTypescript(),
  parts.loadFonts(),
  parts.clean(),
  {
    entry: {
      index: `${parts.path.resolve(__dirname)}/src/assets/ts/pages/index.ts`,
      // localization: `${parts.path.resolve(__dirname)}/src/assets/js/localization.ts`,
    },

    target: ['web', 'es5'],

    resolve: {
      extensions: ['.ts', '.js'],
    },

    plugins: [

      // i18n START
      new parts.EnvCheckerPlugin({
        lang: /^(pl|cz|sk|hu|en)$/
      }),
      new parts.webpack.EnvironmentPlugin({
        CURRENT_LANG: LANG
      }),
      // i18n END

      new CaseSensitivePathsPlugin(),

      // Pages START
      new HtmlWebPackPlugin({
        filename: 'index.html',
        chunks: [
          'index',
          // 'localization',
        ],
        template: ('./src/pages/index.ejs'),
        templateParameters: {
          lang: LANG,
          _: _,
          _l: _l
        },
        inject: 'head',
        meta: defaultMeta,
        scriptLoading: 'defer',
        alwaysWriteToDisk: true,
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

const loadOutput = (filename: string = '[name].[contenthash].js') => ({
  output: {
    path: parts.path.resolve(__dirname, `./web/${LANG}`),
    publicPath: '',
    filename: filename,
    assetModuleFilename: '[name][ext]'
  },
});

const productionConfig = merge([
  // parts.loadOptimization(), 
  parts.extractCSS(),
  parts.generateSourceMaps({ type: 'nosources-source-map' }),
  loadOutput(),
  // {
  //   plugins: [
  //     new BundleAnalyzerPlugin({
  //       openAnalyzer: true,
  //       analyzerHost: process.env.HOST,
  //       analyzerPort: 8888,
  //     }),
  //   ],
  // },
  {
    plugins: [
      new WebpackShellPluginNext({
        onBuildEnd:{
          scripts: [
            async () => {
              const gitData = {
                branch: '',
                repo: '',
              };

              const branch = await getBranch();
              const repo = await getRepo();
              const srcFiles = getAllFiles('web', []);
              const htmlRegExp = /(.)*\.html/;

              const htmlFiles = srcFiles.filter((file: string) => file.match(htmlRegExp));

              if (branch && typeof branch === 'string') {
                gitData.branch = branch;
              }

              if (repo && typeof repo === 'string') {
                gitData.repo = repo.split(':')[1];
              }

              htmlFiles.forEach((file: string) => {

                FS.readFile(file, 'utf8', function (err: any, data: string) {
                  if (err) {
                    return console.log(err);
                  }
                 const comment = `\n<!-- git: ${gitData.branch}, ${gitData.repo} -->\n`;

                 data = data.replace(comment, '');
                 const result = data.replace(/<\/body>/, `${comment}</body>`);
              
                  FS.writeFile(file, result, 'utf8', (err: any) => {
                     if (err) return console.log(err);
                  });
                });
              });
            },
          ],
          blocking: true,
          parallel: false
        }
      }),
    ]
  }
]);

const developmentConfig = merge([
  loadOutput('[name].[fullhash].js'),
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT,
  }),
  parts.generateSourceMaps({ type: 'eval-source-map' }),
  parts.loadCSS(),
  {
    stats: 'errors-only',
  },
]);

module.exports = (mode: any) => {
  if (mode) {
    if (mode.prod) {
      return merge(commonConfig(mode), productionConfig, { mode });
    } else {
      return merge(commonConfig(mode), developmentConfig, { mode });
    }
  }
};
