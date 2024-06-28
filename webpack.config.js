const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'development', // Use 'production' for deployment
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
    minimize: false, // Already set to disable code minimization
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            // Set to false or adjust according to your needs for debugging
            drop_console: false,
            drop_debugger: false,
          },
          mangle: {
            // Disable mangle to make the code more readable in debug mode
            properties: false, // Ensure property names are not mangled
          },
          // Preserving class and function names can aid in debugging
          keep_classnames: true,
          keep_fnames: true,
        },
        extractComments: false, // Can be set to true if you want to keep comments
      }),
    ],
  },
};