const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.af",
  mode: "development",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      'afast-boot': path.resolve(__dirname, '../packages/afast-boot')
    },
  },
  devtool: "source-map",
  devServer: {
    static: "dist",
    port: 6644,
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
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
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
        use: "../packages/afast-loader-react",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
