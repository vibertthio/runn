const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const loaders = require('./webpack.loaders');

module.exports = {
	entry: {
		// main: './src/index.js',
		three: './src/three/app.js',
	},
	output: {
		path: path.resolve(__dirname, 'public/'),
		publicPath: '/',
		filename: './js/[name].[hash].bundle.js',
	},
	resolve: {
		extensions: ['.js', '.jsx'],
		alias: {
			libs: path.resolve(__dirname, 'src/libs'),
		},
	},
	module: {
		loaders,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/template.html',
			files: {
				js: ['bundle.js'],
			},
			filename: 'index.html',
		}),
	],
};
