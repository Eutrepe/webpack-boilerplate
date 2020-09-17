const MiniCssExtractPlugin = require('mini-css-extract-plugin');

exports.devServer = ({ host, port } = {}) => ({
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

exports.loadCSS = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        include,
        exclude,
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

exports.extractCSS = ({ include, exclude } = {}) => {
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
          include,
          exclude,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [require('autoprefixer'), require('precss')],
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    plugins: [plugin],
  };
};

exports.loadImages = ({ include, exclude, options } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g)$/i,
        include,
        exclude,
        use: [
          {
            loader: 'file-loader',
            options: {},
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
          { loader: 'file-loader' },
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
