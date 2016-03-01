var webpack = require('webpack')
var path = require('path')

module.exports = {
  entry: path.resolve('public/javascripts/src/main.js'),
  output: {
    path: path.resolve('public/javascripts/build'),
    filename: "app.js"
  },
  resolveLoader: {
    root: path.resolve('../node_modules'),
  },
  module: {
    loaders: [{
      test: /\.vue$/,
      loader: "vue"
    }, {
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/
    }, {
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.(png|jpg|gif|svg)$/,
      loader: 'url',
      query: {
        limit: 10000,
        name: '[name].[ext]?[hash]'
      }
    }]
  },
  devtool: 'source-map'
}
