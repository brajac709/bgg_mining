const path = require('path');

module.exports = {
    entry: './client/index.js',
    resolve: {
        extensions: ['.js']
    },
    output: {
        filename: 'index-compiled.js',
        path: path.resolve(__dirname, 'prod'),
    },
    devtool: 'inline-source-map', // is this bad??? IDK???
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-react']
                }
            },
            {
                test: /\.css$/,
                loader: 'css-loader'
            }
        ]
    }
};