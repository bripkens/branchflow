var winston = require('winston'),
  util = require('util'),
  def = require('./def'),
  levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  colors = {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  },
  // we know that the Winston wrapper is located in the application's root
  // directory. We use this information to strip the path from modules'
  // file names.
  moduleBasePath = module.filename.replace('logger.js', '');

winston.addColors(colors);

var logger = new (winston.Logger)({
  levels: levels,
  transports: [
    new (winston.transports.Console)({
      // Winston is not capable of switching log levels on the fly
      // which is why we enable all levels by default and hack in our own
      // system!
      level: 'debug',
      timestamp: false
    })
  ]
});

/**
 * @class Just a simple logger
 *
 * @description
 * This class acts as a wrapper around the logging facility. At this point we
 * do not want to rely to heavily on a specific logging library, especially
 * since winston does not provide all necessary features.
 *
 * @constructor
 *
 * @param module A node.js module descriptor which is used to generate the
 *  logger name.
 * @param module.filename This property is inspected to generate the logger
 *  name - fake the module descriptor if necessary...
 */
function Logger(module) {
  this.name = module.filename.replace(moduleBasePath, '');
};
module.exports = Logger;

/**
 * @description
 * Prefix a log message with the current date and time as well as the logger's
 * name.
 *
 * @private
 *
 * @param {String} msg The log message.
 * @return {String} prefixed log message.
 */
Logger.prototype.prefixMessage = function(msg) {
  return util.format(def.logging.format, new Date(), this.name, msg);
};

// just adding a bunch of methods to the Logger were each method has the
// following signature:
// Logger.<logLevel>(formatString, args...);
// Example:
// Logger.info("The answer to your question '%s' is '%d'", '?', 42);
for (var eachLevel in levels) {
  (function(level) {
    Logger.prototype[level] = function(msg) {
      if (levels[level] >= levels[def.logging.activeLevel]) {
        var args = Array.prototype.slice.call(arguments, 1);
        var msg = this.prefixMessage(util.format(msg, args));
        logger.log(level, msg);
      }
    };
  })(eachLevel);
}
