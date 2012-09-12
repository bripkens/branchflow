var vows = require('vows'),
  assert = require('assert'),
  testutils = require('./testutils'),
  requireSource = testutils.requireSource;

var utils = requireSource('utils');

vows.describe('Utils').addBatch({
  'deepExtend': {
    topic: function() {
      return {
        name: 'Tom Mason',
        dayOfBirth: new Date(1970, 9, 10),
        alive: true,
        kills: /.*/i,
        killCount: 42,
        family: {
          father: 'John Doe',
          mother: 'Jane Doe'
        }
      };
    },

    'Strings are overwritten': function(topic) {
      var newName = 'John Wayne';
      utils.deepExtend({
        name: newName
      }, topic);

      assert.equal(topic.name, newName);
    },

    'Booleans are overwritten': function(topic) {
      var alive = false;
      utils.deepExtend({
        alive: alive
      }, topic);

      assert.equal(topic.alive, alive);
    },

    'Numbers are overwritten': function(topic) {
      var killCount = Infinity;
      utils.deepExtend({
        killCount: killCount
      }, topic);

      assert.equal(topic.killCount, killCount);
    },

    'RegExps are overwritten': function(topic) {
      var kills = /^Zombies$/;
      utils.deepExtend({
        kills: kills
      }, topic);

      assert.equal(topic.kills, kills);
    },

    'New values are added': function(topic) {
      var weakness = "unknown";
      utils.deepExtend({
        weakness: weakness
      }, topic);

      assert.equal(topic.weakness, weakness);
    },

    'Nested values are taken care of': function(topic) {
      var weakness = "unknown";
      utils.deepExtend({
        stats: {
          weakness: weakness
        }
      }, topic);

      assert.equal(topic.stats.weakness, weakness);
    },

    'Existing nested values are overwritten': function(topic) {
      var father = 'John Connor';
      utils.deepExtend({
        family: {
          father: father
        }
      }, topic);

      assert.equal(topic.family.father, father);
      assert.equal(topic.family.mother, 'Jane Doe');
    }
  }
}).export(module);