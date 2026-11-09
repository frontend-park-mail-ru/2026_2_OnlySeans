module.exports = {
  presets: [
    ['@babel/preset-env', { targets: 'defaults and supports es6-module', modules: false }],
    '@babel/preset-typescript'
  ]
};
