var _ = require('underscore');

/**
 * @description
 * Checks whether the provided value is an atomic value, i.e., either a string,
 * boolean, regular expression, number, function or date.
 *
 * @private
 *
 * @param {Object} val Some value which should be checked
 * @return {Boolean} True when the value is of one of the aforementioned
 *  types.
 */
function isAtomicValue(val) {
  return _.isString(val) ||
    _.isBoolean(val) ||
    _.isRegExp(val) ||
    _.isNumber(val) ||
    _.isFunction(val) ||
    _.isDate(val);
}

/**
 * @description
 * Copy all properties from source to target while taking nested properties
 * into account (where nested means objects and arrays).
 *
 * @param {Object} source The object from which properties should be copied
 * @param {Object} target The object which is extended with new properties.
 */
module.exports.deepExtend = function deepExtend(source, target) {
  for (var prop in source) {
    if (source.hasOwnProperty(prop)) {
      var val = source[prop],
        hasProp = target.hasOwnProperty(prop);

      if (isAtomicValue(val)) {
        target[prop] = source[prop];
      } else if (_.isArray(val)) {
        // TODO array handling
      } else if (_.isObject(val)) {
        if (!hasProp) {
          target[prop] = val;
        } else {
          deepExtend(source[prop], target[prop]);
        }
      }
    }
  }
};