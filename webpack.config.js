const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development', // or 'production' when ready to build for production
  entry: {
    main: './code.js',
    ui: './uiHandlers.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false, // Ensure this is true in production mode
    minimizer: [
      new TerserPlugin({
        terserOptions: {
            compress: {
                drop_console: true, // Remove console logs for production
                drop_debugger: true, // Remove debugger statements
                // Additional compress options here
            },
            mangle: false, // Ensure this is enabled to obfuscate names
            keep_classnames: true, // Consider the impact on your code
            keep_fnames: true, // Consider the impact on your code
            // Additional mangle options here
        },
        extractComments: true, // Remove comments
    })
    ,
    ],
  },
};
