const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.af",
  mode: "development",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      'afast-boot': path.resolve(__dirname, '../afast-boot')
    },
  },
  devtool: "source-map",
  devServer: {
    static: "dist",
    port: 6600,
    historyApiFallback: {
      rewrites: [
        {
          from: /.+/,
          to: '/'
        },
      ]
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.less$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              importLoaders: 2,
              sourceMap: true,
              esModule: false
            },
          },
          "less-loader"
        ]
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              importLoaders: 2,
              sourceMap: true,
              esModule: false
            },
          },
          {
            loader: "sass-loader"
          },
          "postcss-loader",
        ],
        sideEffects: true,
      },
      {
        test: /\.af$/,
        use: "../afast-loader-react",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
