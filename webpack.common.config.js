const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
				use: [
					{ loader: 'style-loader' },
					{
						loader: 'css-loader?url=false',
						options: {
							module: true,
							localIdentName: '[name]__[local]--[hash:base64:5]',
						},
					},
				],
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
		]
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
