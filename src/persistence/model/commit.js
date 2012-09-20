var def = require('../../def'),
  util = require('util'),
  utils = require('./utils'),
  neo4j = require('neo4j'),
  log = new (require('../../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  index = {
    name: 'nodes',
    key: 'type',
    val: 'commit'
  };

/**
 * @class Commit
 *
 * @constructor
 * Creates a new neo4j-aware Commit model. This function should generally
 * not be invoked directly, but instead through the generator function
 * Commit.create(...).
 *
 * @param {Neo4jNode} _node neo4j's internal node. Strictly required. Without
 *  this node, all attempts to access properties will fail.
 */
var Commit = module.exports = function Commit(_node) {
  this._node = _node;
};

utils.addProperty(Commit, 'id');
utils.addProperty(Commit, 'exists');
utils.addProperty(Commit, 'hash', true);

Commit.prototype.save = utils.save;

Commit.prototype.authoredIn = function(branch, callback) {
  this._node.createRelationshipTo(branch._node, 'authoredIn',
      {},
      function (err, rel) {
    callback(err);
  });
};

Commit.prototype.parent = function(parentCommit, callback) {
  this._node.createRelationshipTo(parentCommit._node, 'parent',
      {},
      function (err, rel) {
    callback(err);
  });
};

/**
 * @description
 * Creates a new Commit instance. This method should generally be used
 * instead of the constructor as it takes care of the neo4j initialisation.
 *
 * @param {Object} data Any data associated to a Commit node.
 * @param {Function} callback The error/result callback.
 */
Commit.create = utils.newCreateFunction(db, Commit, index);

/**
 * @description
 * Retrieve all Commit instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Commit.getAll = utils.newGetAllFunction(db, Commit, index);

/**
 * @description
 * Get a single Commit by hash. The hash must be an exact match.
 *
 * @param {String} hash The Commit's hash.
 * @param {Function} callback The error/result callback.
 */
Commit.getByHash = utils.newGetByDataFunction(db, Commit, index, 'hash');