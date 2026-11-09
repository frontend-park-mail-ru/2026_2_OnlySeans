const webpack = require('webpack');
const ServiceWorkerPlugin = require('./build/ServiceWorkerPlugin.cjs');
const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (_, argv) => {
  const production = argv.mode === 'production';

  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/[name].[contenthash].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext]',
      publicPath: '/',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js'],
      extensionAlias: { '.js': ['.ts', '.js'] },
      alias: { handlebars: 'handlebars/dist/handlebars.js' }
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]s$/,
          exclude: /node_modules/,
          type: 'javascript/auto',
          use: 'babel-loader'
        },
        {
          test: /\.css$/,
          use: [production ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader']
        },
        { test: /\.hbs$/, type: 'asset/source' },
        { test: /\.(svg|png|jpe?g|webp|gif|woff2?|mp4|webm|mp3)$/, type: 'asset/resource' }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({ __SW_ENABLED__: JSON.stringify(production) }),
      ...(production ? [new ServiceWorkerPlugin()] : []),
      new HtmlWebpackPlugin({ template: './index.html', scriptLoading: 'defer' }),
      new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash].css' }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/assets', to: 'src/assets' },
          { from: 'src/assets/images/logo-mark.svg', to: 'assets/logo-mark.svg' }
        ]
      })
    ],
    devtool: production ? false : 'source-map',
    devServer: {
      host: '127.0.0.1',
      port: 3000,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api', '/static', '/avatars'],
          target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true
        }
      ]
    },
    performance: { maxEntrypointSize: 650000, maxAssetSize: 650000 }
  };
};
