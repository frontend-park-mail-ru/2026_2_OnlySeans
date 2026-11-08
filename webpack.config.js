import path from "node:path";
import { fileURLToPath } from "node:url";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (_env, argv) => {
  const isProduction = argv.mode === "production";
  const copyPatterns = [
    {
      from: path.resolve(__dirname, "src/assets/images/grain.svg"),
      to: "src/assets/images/grain.svg",
    },
    {
      from: path.resolve(__dirname, "src/assets/images/auth/film-perforation-mask.svg"),
      to: "src/assets/images/auth/film-perforation-mask.svg",
    },
  ];

  if (isProduction) {
    copyPatterns.push({
      from: path.resolve(__dirname, "src/service-worker.js"),
      to: "service-worker.js",
    });
  }

  return {
    entry: "./src/index.js",
    output: {
      filename: "assets/[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          dependency: { not: ["url"] },
          use: ["style-loader", "css-loader"],
        },
        {
          // Preserve relative image URLs in styles loaded through loadStyles().
          test: /\.css$/i,
          dependency: "url",
          type: "asset/resource",
          generator: { filename: "[path][name][ext]" },
        },
        {
          test: /\.hbs$/i,
          type: "asset/resource",
          generator: { filename: "assets/[name].[contenthash][ext]" },
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[name].[contenthash][ext]",
          },
        },
        {
          test: /\.[jt]s$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __ENABLE_SERVICE_WORKER__: JSON.stringify(isProduction),
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        favicon: "./src/assets/images/logo-mark.svg",
      }),
      new CopyWebpackPlugin({
        patterns: copyPatterns,
      }),
    ],
    devServer: {
      host: "0.0.0.0",
      port: 3000,
      historyApiFallback: true,
    },
  };
};
