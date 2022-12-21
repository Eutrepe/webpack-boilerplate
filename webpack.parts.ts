const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const webpack = require('webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const path = require('path');
exports.path = path;

const chalk = require('chalk');
exports.chalk = chalk;

const APP_SOURCE = path.join(__dirname, 'src');

exports.loadOptimization = () => ({
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

exports.loadOutput = (
  filename: string = '[name].[contenthash].js',
  outputDir: string = './public'
) => ({
  output: {
    path: path.resolve(__dirname, outputDir),
    publicPath: '',
    filename: filename,
    assetModuleFilename: 'assets/images/[hash][ext][query]',
  },
});

exports.loadHTML = () => ({
  module: {
    rules: [
      {
        test: /\.html$/i,
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
                filter: (
                  tag: any,
                  attribute: any,
                  attributes: any,
                  resourcePath: any
                ) => {
                  let result = false;
                  // The `tag` argument contains a name of the HTML tag.
                  // The `attribute` argument contains a name of the HTML attribute.
                  // The `attributes` argument contains all attributes of the tag.
                  // The `resourcePath` argument contains a path to the loaded HTML file.

                  // add hash to <a> tag only if has class 'hash-this'

                  for (const attribute of attributes) {
                    if (
                      attribute.name === 'class' &&
                      attribute.value.indexOf('hash-this') > -1
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
    chunkFilename: '[id].[contenthash].css',
  });

  return {
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postcssPresetEnv(/* pluginOptions */)],
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

exports.loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/i,
        type: 'asset/resource',
        use: [
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
              // the webp option will enable WEBP
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
        use: [
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

exports.loadVideos = () => ({
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

exports.loadAudios = () => ({
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

exports.loadFonts = () => ({
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

exports.devServer = ({
  host = `localhost`,
  port = `8080`,
  open = true,
} = {}) => ({
  devServer: {
    //
    // If you use Docker, Vagrant or Cloud9, set
    // host: "0.0.0.0";
    //
    // 0.0.0.0 is available to all network devices
    // unlike default `localhost`.
    host: host, // Defaults to `localhost`
    port: port, // Defaults to 8080
    open: open, // Open the page in browser
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
});

exports.attachRevision = () => ({
  plugins: [
    new webpack.BannerPlugin({
      banner: new GitRevisionPlugin().version(),
    }),
  ],
});

exports.clean = () => ({
  plugins: [new CleanWebpackPlugin()],
});

exports.generateSourceMaps = ({ type = 'source-map' }) => ({
  devtool: type,
});

class EnvCheckerPlugin {
  private params: object;

  static findParam = (param: string): string | null => {
    let result = null;
    process.argv.forEach(argv => {
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
              `${chalk.red(`\n\nThe given`)} ${chalk.yellow(env)} ${chalk.red(
                'value ('
              )}` +
                `${chalk.yellow(paramVal)}${chalk.red(
                  `) is not supported.\n\n`
                )}` +
                chalk.bold.red(
                  `Please set a value that matches the expression `
                ) +
                chalk.cyan(value.source) +
                chalk.bold.red(` and try re-running the build.\n`)
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

exports.EnvCheckerPlugin = EnvCheckerPlugin;
exports.webpack = webpack;
