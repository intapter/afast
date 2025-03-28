const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: './src/index.af',
    mode: 'development',
    resolve: {
        alias:{
            '@': path.resolve(__dirname, 'src')
        }
    },
    // devtool:"inline-source-map",
    devServer:{
        static: 'dist',
        port: 6644
    },
    module: {
        rules: [
            {
                test: /\.af$/,
                use: '../afast/loader/afast-loader'
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ]
}