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
 * instead of the constructor as it takes care of neo4j initialisation.
 *
 * @param {Object} data Any data associated to a repository node.
 * @param {Function} callback The error/result callback.
 */
Repository.create = function(data, callback) {
  var node = db.createNode(data);
  var repo = new Repository(node);

  node.save(function(err) {
    if (err) return callback(err);

    node.index(index.name, index.key, index.val, function(err) {
      if (err) return callback(err);

      callback(null, repo);
    });
  });
};

/**
 * @description
 * Retrieve all repository instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) super expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Repository.getAll = function(callback) {
  db.getIndexedNodes(index.name, index.key, index.val, function(err, nodes) {
    if (err && !utils.isIndexNotExistingError(err)) {
      return callback(err, null);
    } else if (err) {
      return callback(null, []);
    }

    var repositories = nodes.map(function(node) {
      return new Repository(node);
    });
    callback(null, repositories);
  });
};

/**
 * @description
 * Get a single repository by name. The name must be an exact match.
 *
 * @param {String} name The repository's name.
 * @param {Function} callback The error/result callback.
 */
Repository.getByName = function(name, callback) {
  var query;
  query = utils.buildQuery("START node=node:indexName(indexKey = 'indexVal')",
               "WHERE node.name = {name}",
               "RETURN node",
               "LIMIT 1", {
                'indexName': index.name,
                'indexKey': index.key,
                'indexVal': index.val,
               });

  var params = {
    name: name
  };

  db.query(query, params, function(err, nodes) {
    if (err && utils.isIndexNotExistingError(err)) {
      return callback(null, null);
    } else if (err) {
      return callback(err, null);
    } else if (nodes.length === 0) {
      return callback(null, null);
    }

    callback(null, new Repository(nodes[0].node));
  });
};