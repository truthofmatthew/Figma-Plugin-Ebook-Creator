const path = require('path');

module.exports = {
  mode: 'development', // Use 'production' for production builds
  entry: {
    main: './code.js', // This will be your main plugin code
    ui: './uiHandlers.js', // This will be your UI code
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
    filename: '[name].js', // Dynamically name the output file
    path: path.resolve(__dirname, 'dist'), // The output directory
  },
};
