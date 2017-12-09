module.exports = [
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
];
