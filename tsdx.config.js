const html = require('@rollup/plugin-html');

module.exports = {
  input: 'src/index.ts',
  rollup(config, options) {
    config.plugins.push(html());
    return config;
  },
};
