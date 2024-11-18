import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ES Modules, __filename and __dirname are not defined by default.
// Manually define them:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import postcssPresetEnv from 'postcss-preset-env';
import webpack from 'webpack';
import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

import path from 'path';
import chalk from 'chalk';
import FS from 'fs';

import * as sass from 'sass';

export { path };

const APP_SOURCE = path.join(__dirname, 'src');

import { exec } from 'child_process';

// Funkcja do pobierania aktualnej gałęzi
export const getBranch = () => new Promise((resolve, reject) => {
  exec('git branch --show-current', (err, stdout) => {
    if (err) {
      reject(`getBranch Error: ${err}`);
    } else {
      resolve(stdout.trim());
    }
  });
});

// Funkcja do pobierania repozytorium
export const getRepo = () => new Promise((resolve, reject) => {
  exec('git config --get remote.origin.url', (err, stdout) => {
    if (err) {
      reject(`getRepo Error: ${err}`);
    } else {
      resolve(stdout.trim());
    }
  });
});

// Funkcja do pobierania wszystkich plików w katalogu
export const getAllFiles = function(dirPath, arrayOfFiles) {
  const files = FS.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach((file) => {
    if (FS.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });
  return arrayOfFiles;
};

export const loadOptimization = () => ({
  optimization: {
    minimize: true,
    minimizer: [`...`, new CssMinimizerPlugin()],
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

export const loadOutput = (
  filename = '[name].[contenthash].js',
  outputDir = './public'
) => ({
  output: {
    path: path.resolve(__dirname, outputDir),
    publicPath: '',
    filename: filename,
    assetModuleFilename: 'assets/images/[hash][ext][query]',
  },
});

export const loadHTML = () => ({
  module: {
    rules: [
      {
        test: /\.ejs$/i, // Reguła dla plików EJS
        use: [
          {
            loader: 'ejs-loader',
            options: {
              esModule: false,
              interpolate: '\\{\\{\\s+?(.+?)\\s+?\\}\\}', // Opcjonalne ustawienia
              evaluate: '\\[\\[\\s+?(.+?)\\s+?\\]\\]',
            },
          },
        ],
      },
      {
        test: /\.html$/i, // Reguła dla plików HTML
        use: [
          {
            loader: 'html-loader',
            options: {
              esModule: false,
              sources: {
                list: [
                  '...',
                  {
                    tag: 'img',
                    attribute: 'src',
                    type: 'src',
                  },
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
                      let result = false;
                      // Dodaj hash do tagu <a> tylko jeśli ma klasę 'hash-this'
                      for (const attr of attributes) {
                        if (
                          attr.name === 'class' &&
                          attr.value.indexOf('hash-this') > -1
                        ) {
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

export const loadPug = () => ({
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: ['simple-pug-loader'],
      },
    ],
  },
});

export const loadCSS = () => ({
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'style-loader',
            options: {},
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
              postcssOptions: {
                plugins: [postcssPresetEnv(/* pluginOptions */)],
              },
              sourceMap: true,
            },
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: sass
            },
          },
        ],
      },
    ],
  },
});

export const extractCSS = () => {
  const plugin = new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
    chunkFilename: '[id].[contenthash].css',
  });

  return {
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postcssPresetEnv(/* pluginOptions */)],
                },
                sourceMap: true,
              },
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                implementation: sass
              },
            },
          ],
        },
      ],
    },
    plugins: [plugin],
  };
};

export const loadJavaScript = () => ({
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

export const loadTypescript = () => ({
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

export const loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[contenthash][ext]', // Dodanie hasha
        },
        // dependency: { not: ['url'] },
        use: [
          // {
          //   loader: 'file-loader',
          //   options: {
          //     // publicPath: mode.prod ? IMAGE_PATH : '',
          //     // outputPath: mode.prod ? IMAGE_PATH : '',
          //     name: '[name].[ext]',
          //   },
          // },
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
              // The webp option will enable WEBP
              webp: {
                quality: 75,
                enabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[contenthash][ext]', // Dodanie hasha
        },
        // dependency: { not: ['url'] },
        use: [
          // {
          //   loader: 'file-loader',
          //   options: {
          //     // publicPath: mode.prod ? IMAGE_PATH : '',
          //     // outputPath: mode.prod ? IMAGE_PATH : '',
          //     name: '[name].[ext]',
          //   },
          // },
          {
            loader: 'svgo-loader',
            options: {
              options: {
                plugins: [
                  {
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
                ],
              },
            },
          },
        ],
      },
    ],
  },
});

export const loadVideos = () => ({
  module: {
    rules: [
      {
        test: /\.(mp4)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'videos/[hashcontent][ext][query]',
        },
        use: [],
      },
    ],
  },
});

export const loadAudios = () => ({
  module: {
    rules: [
      {
        test: /\.(mp3)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'audios/[hashcontent][ext][query]',
        },
        use: [],
      },
    ],
  },
});

export const loadFonts = () => ({
  module: {
    rules: [
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        include: [path.resolve(__dirname, 'src/assets/fonts/')],
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[ext]',
        },
      },
    ],
  },
});

export const devServer = ({ host = 'localhost', port = '8080', open = true } = {}) => ({
  devServer: {
    host: host, // Defaults to `localhost`
    port: port, // Defaults to 8080
    open: open, // Open the page in browser
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    watchFiles: ['src/**/*'],
  },
});

export const attachRevision = () => ({
  plugins: [
    new webpack.BannerPlugin({
      banner: new GitRevisionPlugin().version(),
    }),
  ],
});

export const clean = () => ({
  plugins: [new CleanWebpackPlugin()],
});

export const generateSourceMaps = ({ type = 'source-map' } = {}) => ({
  devtool: type,
});

export class EnvCheckerPlugin {
  static findParam(param) {
    let result = null;
    process.argv.forEach(argv => {
      if (argv.indexOf(param) === -1) return;
      result = argv.split('=')[1];
    });
    return result;
  }

  constructor(params = {}) {
    this.params = params;
  }

  apply(compiler) {
    compiler.hooks.afterEnvironment.tap('EnvCheckerPlugin', () => {
      console.log(chalk.green('\nChecking for necessary run parameters...'));
      let missingEnvVars = [];
      for (const [env, value] of Object.entries(this.params)) {
        const paramVal = EnvCheckerPlugin.findParam(env);
        if (!paramVal) missingEnvVars.push(env);
        else if (value instanceof RegExp) {
          if (!value.test(paramVal)) {
            throw new Error(
              `${chalk.red(`\n\nThe given`)} ${chalk.yellow(env)} ${chalk.red('value (')}` +
                `${chalk.yellow(paramVal)}${chalk.red(`) is not supported.\n\n`)}` +
                chalk.bold.red(`Please set a value that matches the expression `) +
                chalk.cyan(value.source) +
                chalk.bold.red(` and try re-running the build.\n`)
            );
          }
        }
      }
      if (missingEnvVars.length) {
        throw new Error(
          chalk.bold.red('\n\nPlease set the following parameters:\n\n') +
            chalk.yellow(`  • ${missingEnvVars.join('\n\n  • ')}\n\n`) +
            chalk.bold.red(`Then, try re-running the build.\n`)
        );
      }
    });
  }
}

export { webpack };
