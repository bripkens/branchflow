module.exports.requireSource = function(name) {
  return require('../src/' + name);
};

module.exports.assert = {};
module.exports.assert.equal = function(actual) {
  var valueFound = false;

  for (var i = 1; i < arguments.length; i++) {
    if (arguments[i] === actual) {
      valueFound = true;
    }
  }

  if (!valueFound) {
    throw {
      name: 'AssertionError',
      message: 'expected {expected},\n\tgot\t {actual} ({operator})',
      actual: actual,
      expected: Array.prototype.slice.call(arguments, 1),
      operator: '==='
    };
  }
};

module.exports.assert.fail = function(reason) {
  throw {
    name: 'AssertionError',
    message: reason
  };
};