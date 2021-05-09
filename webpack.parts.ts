const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const { extendDefaultPlugins } = require('svgo');

const path = require('path');

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const APP_SOURCE = path.join(__dirname, 'src');


exports.loadOptimization = () => ({
  optimization: {
    minimize: true,
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ],
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


exports.loadOutput = (filename: string = '[name].[contenthash].js') => ({
  output: {
    path: path.resolve(__dirname, './web'),
    publicPath: '',
    filename: filename,
  },
});



exports.loadHTML = () => (
  {
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
      ]
    }
  }
);


exports.loadPug = () => (
  {
    module: {
      rules: [
        { 
          test: /\.pug$/,
          use: ['pug-loader']
        },
      ]
    }
  }
);


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


exports.loadTypescript = () => (
  {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'babel-loader',
          include: APP_SOURCE, 
          exclude: /node_modules/,
        },
      ]
    }
  }
);


exports.loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'assets/images',
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
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'assets/images',
            },
          },
          {
            loader: 'svgo-loader',
            options: {
              options: {
                plugins: extendDefaultPlugins([
                  {
                    name: 'removeTitle',
                    active: true
                  },
                  {
                    name: 'convertPathData',
                    active: false
                  },
                  {
                    name: 'convertColors',
                    params: {
                      shorthex: false
                    }
                  }
                ])
              },
            },
          },
        ],
      },
    ],
  },
});


exports.loadFonts = () => (
  {
    module: {
      rules: [
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          include: [path.resolve(__dirname, 'src/assets/fonts/')],
          use: {
            loader: 'file-loader',
            options: {
              name: 'assets/fonts/[name].[ext]',
            },
          },
        },
      ]
    }
  }
);


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