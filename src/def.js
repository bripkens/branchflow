var util = require('./utils');

module.exports = {
  defaultBranchName: 'master',

  // revision numbers are zero-based
  firstRevision: 0,

  logging: {
    activeLevel: 'debug',
    format: '[%s] [%s]: %s',
    colorize: true
  },

  persistence: {
    url: 'http://127.0.0.1:7474'
  },

  overwrite: function(config) {
    util.deepExtend(config, module.exports);
  }
};