import webpack from 'webpack';
import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

export default {
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(path.resolve(), './dist'),
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin()
  ]
};
