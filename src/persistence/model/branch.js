var def = require('../../def'),
  util = require('util'),
  utils = require('./utils'),
  neo4j = require('neo4j'),
  log = new (require('../../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  index = {
    name: 'nodes',
    key: 'type',
    val: 'branch'
  };

/**
 * @class Branch
 *
 * @constructor
 * Creates a new neo4j-aware Branch model. This function should generally
 * not be invoked directly, but instead through the generator function
 * Branch.create(...).
 *
 * @param {Neo4jNode} _node neo4j's internal node. Strictly required. Without
 *  this node, all attempts to access properties will fail.
 */
var Branch = module.exports = function Branch(_node) {
  this._node = _node;
};

utils.addProperty(Branch, 'id');
utils.addProperty(Branch, 'exists');
utils.addProperty(Branch, 'name', true);

Branch.prototype.save = utils.save;

Branch.prototype.belongsTo = function(repo, callback) {
  this._node.createRelationshipTo(repo._node, 'belongsTo',
      {},
      function (err, rel) {
    callback(err);
  });
};

/**
 * @description
 * Creates a new Branch instance. This method should generally be used
 * instead of the constructor as it takes care of the neo4j initialisation.
 *
 * @param {Object} data Any data associated to a Branch node.
 * @param {Function} callback The error/result callback.
 */
Branch.create = utils.newCreateFunction(db, Branch, index);

/**
 * @description
 * Retrieve all Branch instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Branch.getAll = utils.newGetAllFunction(db, Branch, index);

/**
 * @description
 * Get a single Branch by name. The name must be an exact match.
 *
 * @param {String} name The Branch's name.
 * @param {Function} callback The error/result callback.
 */
Branch.getByName = utils.newGetByDataFunction(db, Branch, index, 'name');