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

      testutils.assert.equal(commit.parents[0].hash, '52324c976823',
        '46272b255675');
      testutils.assert.equal(commit.parents[1].hash, '52324c976823',
        '46272b255675');
    },

    'default branch is identified': function(repo, err) {
      assert.equal(repo.getCommit('1f626050434f').branch.name,
        def.defaultBranchName);
    },

    'branches are identified': function(repo, err) {
      assert.equal(repo.getCommit('9ee04bfe4fb7').branch.name, 'develop');
    },

    '(local) revision numbers are set': function(repo, err) {
      for (var i = repo.commits.length - 1; i >= 0; i--) {
        var revision = repo.commits[i].revision;

        // zero is not a truthy value, so just ignore it.
        if (revision !== 0) {
          assert(revision);
        }
      }
    },

    'every commit has a parent revision': function(repo, err) {
      for (var i = repo.commits.length - 1; i >= 0; i--) {
        var commit = repo.commits[i];

        if (commit.revision > 0 && commit.parents.length === 0) {
          testutils.assert.fail('Every commit (except the first one) should ' +
            'have a parent.');
        }
      }

      // first commit overall
      var commit = repo.getCommit('a1f1399bf6d7');
      assert.equal(commit.parents.length, 0);

      // first commit in a branch
      commit = repo.getCommit('9ee04bfe4fb7');
      assert.equal(commit.parents[0], repo.getCommit('69dde1b48a92'));

      // a commit without any other activities involved
      commit = repo.getCommit('69dde1b48a92');
      assert.equal(commit.parents[0], repo.getCommit('a1f1399bf6d7'));
    }
  }
}).export(module);