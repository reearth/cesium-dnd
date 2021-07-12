module.exports = {
  rollup(config) {
    config.output.globals = {
      ...config.output.globals,
      cesium: 'Cesium',
    };
    return config;
  },
};
