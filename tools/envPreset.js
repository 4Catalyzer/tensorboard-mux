const babelPresetEnv = require('babel-preset-env');

const { BABEL_ENV } = process.env;

module.exports = {
  presets: [
    [babelPresetEnv, {
      targets: BABEL_ENV === 'dist' ? {} : { node: 'current' },
      loose: true,
      useBuiltIns: true,
    }],
  ],
};
