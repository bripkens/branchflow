var vows = require('vows'),
  assert = require('assert'),
  testutils = require('../testutils'),
  requireSource = testutils.requireSource;

var hgParser = requireSource('parser/hg'),
  def = requireSource('def');

var file = { path: 'test/hg.log', encoding: 'utf8' };

vows.describe('Parser: Mercurial').addBatch({
  'when parsing a standard log file': {
    topic: function() {
      hgParser(file, this.callback, console.error);
    },

    'the parsed log has the correct number of commits': function(repo, err) {
      assert.equal(repo.commits.length, 6);
    },

    'merges are identified': function(repo, err) {
      var commit = repo.getCommit('1f626050434f');

      assert.equal(commit.parents.length, 2);

      var one = commit.parents[0],
        two = commit.parents[1];
      // TODO check hashes of parents
    },

    'default branch is identified': function(repo, err) {
      assert.equal(repo.getCommit('1f626050434f').branch.name,
        def.defaultBranchName);
    },

    'branches are identified': function(repo, err) {
      assert.equal(repo.getCommit('9ee04bfe4fb7').branch.name, 'develop');
    }
  }
}).export(module);