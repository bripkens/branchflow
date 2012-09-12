var argv = require('optimist')
  .usage('Usage: $0 -t [VCS_TYPE] -n [REPOSITORY_NAME] [FILE]')
  .demand(1) // require 1 non-option argument
  .options('t', {
    demand: true,
    default: 'hg',
    alias: 'type',
    describe: 'The type of log that. Either "hg" or "git".'
  })
  .options('n', {
    demand: true,
    alias: 'name',
    describe: 'Name of the repository.'
  })
  .options('c', {
    alias: 'config',
    describe: 'File path to branchflow config file. Overwrites ' +
              'standard branchflow configurations.'
  })
  .argv;

console.log('argv: ', argv);