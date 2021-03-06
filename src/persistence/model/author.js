var def = require('../../def'),
  util = require('util'),
  utils = require('./utils'),
  neo4j = require('neo4j'),
  log = new (require('../../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  index = {
    name: 'nodes',
    key: 'type',
    val: 'author'
  };

/**
 * @class Author
 *
 * @constructor
 * Creates a new neo4j-aware author model. This function should generally
 * not be invoked directly, but instead through the generator function
 * Author.create(...).
 *
 * @param {Neo4jNode} _node neo4j's internal node. Strictly required. Without
 *  this node, all attempts to access properties will fail.
 */
var Author = module.exports = function Author(_node) {
  this._node = _node;
};

utils.addProperty(Author, 'id');
utils.addProperty(Author, 'exists');
utils.addProperty(Author, 'name', true);
utils.addProperty(Author, 'email', true);

Author.prototype.save = utils.save;

Author.prototype.contributedTo = function(repo, callback) {
  this._node.createRelationshipTo(repo._node, 'contributedTo',
      {},
      function (err, rel) {
    callback(err);
  });
};

Author.prototype.authored = function(commit, callback) {
  this._node.createRelationshipTo(commit._node, 'authored',
      {},
      function (err, rel) {
    callback(err);
  });
};

/**
 * @description
 * Creates a new Author instance. This method should generally be used
 * instead of the constructor as it takes care of the neo4j initialisation.
 *
 * @param {Object} data Any data associated to a Author node.
 * @param {Function} callback The error/result callback.
 */
Author.create = utils.newCreateFunction(db, Author, index);

/**
 * @description
 * Retrieve all Author instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Author.getAll = utils.newGetAllFunction(db, Author, index);

/**
 * @description
 * Get a single Author by name. The name must be an exact match.
 *
 * @param {String} name The Author's name.
 * @param {Function} callback The error/result callback.
 */
Author.getByName = utils.newGetByDataFunction(db, Author, index, 'name');