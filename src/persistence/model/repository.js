var def = require('../../def'),
  util = require('util'),
  utils = require('./utils'),
  neo4j = require('neo4j'),
  log = new (require('../../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  index = {
    name: 'nodes',
    key: 'type',
    val: 'repository'
  };

/**
 * @class Repository
 *
 * @constructor
 * Creates a new neo4j-aware repository model. This function should generally
 * not be invoked directly, but instead through the generator function
 * Repository.create(...).
 *
 * @param {Neo4jNode} _node neo4j's internal node. Strictly required. Without
 *  this node, all attempts to access properties will fail.
 */
var Repository = module.exports = function Repository(_node) {
  this._node = _node;
};

utils.addProperty(Repository, 'id');
utils.addProperty(Repository, 'exists');
utils.addProperty(Repository, 'name', true);

Repository.prototype.save = utils.save;

/**
 * @description
 * Creates a new repository instance. This method should generally be used
 * instead of the constructor as it takes care of the neo4j initialisation.
 *
 * @param {Object} data Any data associated to a repository node.
 * @param {Function} callback The error/result callback.
 */
Repository.create = utils.newCreateFunction(db, Repository, index);

/**
 * @description
 * Retrieve all repository instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Repository.getAll = utils.newGetAllFunction(db, Repository, index);

/**
 * @description
 * Get a single repository by name. The name must be an exact match.
 *
 * @param {String} name The repository's name.
 * @param {Function} callback The error/result callback.
 */
Repository.getByName = utils.newGetByDataFunction(db, Repository, index, 'name');