const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.common.config.js');

// Dashboard
const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const dashboard = new Dashboard();

module.exports = merge(common, {
	plugins: [
		new DashboardPlugin(dashboard.setData),
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new BrowserSyncPlugin(
			{
				host: 'localhost',
				port: 3001,
				proxy: 'http://localhost:8080/',
				logLevel: "silent",
				files: [
					{
						match: ['**/*.html'],
						fn: (event) => {
							if (event === 'change') {
								const bs = require('browser-sync').get('bs-webpack-plugin');
								bs.reload();
							}
						},
					},
				],
			},
			{ reload: false }
		),
	],
	devServer: {
		hot: false, // Tell the dev-server we're using HMR
		quiet: true,
		contentBase: path.resolve(__dirname, 'public'),
		publicPath: '/',
	},
	watch: true,
	devtool: 'cheap-eval-source-map',
});
