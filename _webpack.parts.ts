const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const postcssPresetEnv = require('postcss-preset-env');

const path = require('path');
exports.path = path;

const chalk = require('chalk');
exports.chalk = chalk;

class EnvCheckerPlugin {
  private params: object;

  static findParam = (param: string): string | null => {
    let result = null;
    process.argv.forEach((argv) => {
      if (argv.indexOf(param) === -1) return;
      result = argv.split('=')[1];
    });
    return result;
  };

  constructor(params: object = {}) {
    this.params = params;
  }

  apply(compiler: any) {
    compiler.hooks.afterEnvironment.tap('EnvCheckerPlugin', () => {
      console.log(chalk.green('\nChecking for necessary run parameters...'));
      let missingEnvVars: string[] = [];
      for (const [env, value] of Object.entries(this.params)) {
        const paramVal = EnvCheckerPlugin.findParam(env);
        if (!paramVal) missingEnvVars.push(env);
        else if (value instanceof RegExp) {
          if (!value.test(paramVal)) {
            throw chalk.bold(
              `${chalk.red(`\n\nThe given`)} ${chalk.yellow(env)} ${chalk.red('value (')}` +
                `${chalk.yellow(paramVal)}${chalk.red(`) is not supported.\n\n`)}` +
                chalk.bold.red(`Please set a value that matches the expression `) +
                chalk.cyan(value.source) +
                chalk.bold.red(` and try re-running the build.\n`),
            );
          }
        }
      }
      if (missingEnvVars.length) {
        throw (
          chalk.bold.red('\n\nPlease set the following parameters:\n\n') +
          chalk.yellow(`  • ${missingEnvVars.join('\n\n  • ')}\n\n`) +
          chalk.bold.red(`Then, try re-running the build.\n`)
        );
      }
    });
  }
}

const Lang: string | null = EnvCheckerPlugin.findParam('lang');

let IMAGE_PATH: string | undefined = '';

if ('pl' === Lang) {
  IMAGE_PATH = process.env.PL_IMAGE_PATH;
}

if ('sk' === Lang) {
  IMAGE_PATH = process.env.SK_IMAGE_PATH;
}

if ('cz' === Lang) {
  IMAGE_PATH = process.env.CZ_IMAGE_PATH;
}

if ('hu' === Lang) {
  IMAGE_PATH = process.env.HU_IMAGE_PATH;
}

const APP_SOURCE = path.join(__dirname, 'src');

exports.loadOptimization = () => ({
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
  },
});

exports.loadHTML = () => ({
  module: {
    rules: [
      {
        test: /\.(html|ejs)$/i,
        use: [
          {
            loader: 'ejs-loader',
            options: {
              esModule: false,
              interpolate: '\\{\\{\\s+?(.+?)\\s+?\\}\\}',
              evaluate: '\\[\\[\\s+?(.+?)\\s+?\\]\\]',
            },
          },
          {
            loader: 'extract-loader',
          },
          {
            loader: 'html-loader',
            options: {
              esModule: false,
              sources: {
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
                    filter: (tag: any, attribute: any, attributes: any, resourcePath: any) => {
                      let result = false;
                      // The `tag` argument contains a name of the HTML tag.
                      // The `attribute` argument contains a name of the HTML attribute.
                      // The `attributes` argument contains all attributes of the tag.
                      // The `resourcePath` argument contains a path to the loaded HTML file.

                      // add hash to <a> tag only if has class 'hash-this'

                      for (const attribute of attributes) {
                        if (attribute.name === 'class' && attribute.value.indexOf('hash-this') > -1) {
                          result = true;
                        }
                      }

                      return result;
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  },
});

exports.loadPug = () => ({
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: ['simple-pug-loader'],
      },
    ],
  },
});

exports.loadCSS = () => ({
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              insert: 'head', // insert style tag inside of <head>
              injectType: 'singletonStyleTag', // this is for wrap all your style in just one style tag
            },
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [postcssPresetEnv()],
              },
            },
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              // Prefer `dart-sass`
              // implementation: require('sass'),
            },
          },
        ],
      },
    ],
  },
});

exports.extractCSS = () => {
  const plugin = new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
  });

  return {
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          exclude: /node_modules/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: IMAGE_PATH,
              },
            },
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postcssPresetEnv()],
                },
              },
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                // Prefer `dart-sass`
                implementation: require('sass'),
              },
            },
          ],
          sideEffects: true,
        },
      ],
    },
    plugins: [plugin],
  };
};

exports.loadJavaScript = () => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include: APP_SOURCE,
        use: 'babel-loader',
      },
    ],
  },
});

exports.loadTypescript = () => ({
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        include: APP_SOURCE,
        exclude: /node_modules/,
      },
    ],
  },
});

exports.loadImages = (mode: any) => ({
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/i,
        dependency: { not: ['url'] },
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: mode.prod ? IMAGE_PATH : '',
              outputPath: mode.prod ? IMAGE_PATH : '',
              name: '[name].[ext]',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
              },
              // optipng.enabled: false will disable optipng
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              // // the webp option will enable WEBP
              // webp: {
              //   quality: 75,
              //   enabled: true,
              // },
            },
          },
        ],
      },

      {
        test: /\.svg$/,
        dependency: { not: ['url'] },
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: mode.prod ? IMAGE_PATH : '',
              outputPath: mode.prod ? IMAGE_PATH : '',
              name: '[name].[ext]',
            },
          },
          {
            loader: 'svgo-loader',
            options: {
              options: {
                plugins: {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeTitle: {
                        active: true,
                      },
                      convertPathData: {
                        active: false,
                      },
                      convertColors: {
                        active: false,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    ],
  },
});

exports.loadFonts = () => ({
  module: {
    rules: [
      {
        test: /\.(woff(2)?|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
        include: [path.resolve(__dirname, 'src/assets/fonts/')],
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/fonts',
            name: 'assets/fonts/[name].[ext]',
          },
        },
      },
    ],
  },
});

// exports.loadMessages = () => ({
//   module: {
//     rules: [
//       {
//         test: [/\.pot?$/, /\.mo$/],
//         include: [path.resolve(__dirname, 'i18n/')],
//         loader: require.resolve('messageformat-po-loader'),
//         options: {
//           biDiSupport: false,
//           defaultCharset: null,
//           defaultLocale: 'en',
//           forceContext: false,
//           pluralFunction: null,
//           verbose: false,
//           outputPath: (url: string, resourcePath: string, context: any) => {
//             console.log('loadMessages', url, resourcePath, context);
//           },
//         },
//       },
//     ],
//   },
// });

exports.devServer = ({ host = `localhost`, port = `8080` } = {}) => ({
  devServer: {
    //
    // If you use Docker, Vagrant or Cloud9, set
    // host: "0.0.0.0";
    //
    // 0.0.0.0 is available to all network devices
    // unlike default `localhost`.
    host: host, // Defaults to `localhost`
    port: port, // Defaults to 8080
    open: true, // Open the page in browser
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    watchFiles: ['src/**/*'],
  },
});

exports.clean = () => ({
  plugins: [new CleanWebpackPlugin()],
});

exports.generateSourceMaps = ({ type = 'source-map' }) => ({
  devtool: type,
});

exports.EnvCheckerPlugin = EnvCheckerPlugin;
exports.MiniCssExtractPlugin = MiniCssExtractPlugin;
exports.webpack = webpack;
exports.lang = Lang;
