import MiniCssExtractPlugin = require('mini-css-extract-plugin');
import * as path from 'path';

const APP_SOURCE = path.join(__dirname, 'src');

exports.loadJavaScript = () => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include: APP_SOURCE, // Consider extracting as a parameter
        use: 'babel-loader',
      },
    ],
  },
});

exports.generateSourceMaps = ({ type = 'source-map' }) => ({
  devtool: type,
});

exports.devServer = ({ host = `localhost`, port = `8080` } = {}) => ({
  devServer: {
    // Display only errors to reduce the amount of output.
    stats: 'errors-only',

    // Parse host and port from env to allow customization.
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
              plugins: () => [require('autoprefixer')(), require('precss')],
            },
          },
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
  // Output extracted CSS to a file
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
                plugins: () => [require('autoprefixer'), require('precss')],
              },
            },
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
              plugins: [
                { removeTitle: true },
                { convertColors: { shorthex: false } },
                { convertPathData: false },
              ],
            },
          },
        ],
      },
    ],
  },
});
