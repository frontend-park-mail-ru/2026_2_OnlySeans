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
      from: path.resolve(__dirname, "src/media"),
      to: "src/media",
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
      clean: true,
    },
    resolve: {
         extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
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
