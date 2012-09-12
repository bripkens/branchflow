var log = new (require('./logger'))(module),
  fs = require('fs');
  argv = require('optimist')
    .usage('Usage: $0 -t [VCS_TYPE] -n [REPOSITORY_NAME] [FILE]')
    .demand(1) // require 1 non-option argument
    .options('t', {
      demand: true,
      alias: 'type',
      describe: 'The type of log that. Until now only "hg".'
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
    .options('e', {
      alias: 'encoding',
      default: 'utf8',
      describe: 'Log file encoding.'
    })
    .check(function(args) {
      if (args.type.match(/^(hg)$/i) === null) {
        throw 'Unsupported log type.';
      }
    })
    .argv;

var repoName = argv.name,
  type = argv.type.toLowerCase(),
  file = {
    path: argv._[0],
    encoding: argv.encoding
  },
  config = argv.config;

function doImport() {
  log.info('Attempting to parse %s log file "%s" and index it under ' +
    'name %s.', type, file.path, repoName);

  function success(repo) {
    log.info('Successfully parsed the log file. Attempting to import it.');
  };

  function error(err) {
    log.error(err);
    process.exit(1);
  };

  require('./parser/' + type)(file, success, error);
};

if (config) {
  log.info('Overwriting branchflow\'s default configuration.');
  fs.readFile(config, function(err, data) {
    if (err) {
      log.error('Failed to read config file. Reason %s', err);
      process.exit(1);
    }

    var config = JSON.parse(data);
    require('./def').overwrite(config);
    doImport();
  });
} else {
  doImport();
}