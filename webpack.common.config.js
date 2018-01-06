const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: {
		main: './src/index.js',
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
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /(node_modules|public\/)/,
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							query: {
								modules: true,
								localIdentName: '[name]__[local]___[hash:base64:5]',
							},
						},
						'postcss-loader',
					],
				}),
				exclude: ['node_modules'],
			},
			{
				test: /\.(glsl|frag|vert)$/,
				loader: 'raw-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(glsl|frag|vert)$/,
				loader: 'glslify-loader',
				exclude: /node_modules/,
			},
		],
	},
	plugins: [
		new ExtractTextPlugin("style.css"),
		new HtmlWebpackPlugin({
			template: './src/template.html',
			files: {
				js: ['bundle.js'],
			},
			filename: 'index.html',
		}),
	],
};
