var vows = require('vows'),
    assert = require('assert'),
    testutils = require('./testutils'),
    requireSource = testutils.requireSource;

var gitParser = requireSource('git-parser');

var file = { path: 'test/input.log', encoding: 'utf8' };

vows.describe('Parser: Git').addBatch({
    'when parsing a standard log file': {
        topic: function() {
            gitParser(file, this.callback, console.error);
        },

        'the parsed log has the correct number of entries': function(result, err) {
            assert.equal(result.length, 5);
        },

        'merges are identified': function(result, err) {
            var entry = result[0];

            assert.equal(entry.merge.from, 'de8c04c');
            assert.equal(entry.merge.to, 'cbb34a3');
        },

        'branches are identified': function(result, err) {
            assert.equal(result[0].branch, 'master');
            assert.equal(result[1].branch, 'develop');
        }
    }
}).export(module);