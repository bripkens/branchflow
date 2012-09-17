var vows = require('vows'),
  assert = require('assert'),
  testutils = require('../../testutils'),
  requireSource = testutils.requireSource;

var utils = requireSource('persistence/model/utils');

vows.describe('persistence.model.utils').addBatch({
  'index not found error are identified': function(topic) {
    assert.equal(utils.isIndexNotExistingError({
      message: 'Index foobar does not exist'
    }), true);

    assert.equal(utils.isIndexNotExistingError({
      message: 'An error occured: Index foobar does not exist'
    }), false);

    assert.equal(utils.isIndexNotExistingError({
      message: 'Not not found'
    }), false);

    assert.equal(utils.isIndexNotExistingError({}), false);

    assert.equal(utils.isIndexNotExistingError(), false);
  },

  'queries are correctly build': function(topic) {
    var expected = 'Do something with tomtom\n' +
      'when node.active = true';

    assert.equal(utils.buildQuery('Do something with theNode',
      'when node.active = isActive', {
        theNode: 'tomtom',
        isActive: true
      }), expected);
  }
}).export(module);