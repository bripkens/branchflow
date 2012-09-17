var def = require('../def'),
  util = require('util'),
  neo4j = require('neo4j'),
  log = new (require('../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  indexNotExistingError = /^Index .* does not exist$/i;

/**
 * @description
 * Checks whether the error message denotes an 'index not found error'. This
 * error is commonly found when querying an index for the first time (and
 * when the index has not been created). Neo4j indexes are created lazily, i.e.,
 * once a node is indexed under the index's name.
 *
 * @private
 *
 * @param {Object} err An error object. The object does not need to conform to
 *  any special requirements except the following one:
 * @param {String} [err.message] The actual error message. When no error message
 *  is found, this function returns false.
 * @return {Boolean} True when the err.message exists and looks like an 'index
 *  not found error'.
 */
function isIndexNotExistingError(err) {
  return err.hasOwnProperty('message') &&
    err.message.match(indexNotExistingError) != null;
};

/**
 * @description
 * Adds a proxied property to the class. A proxy property is a property which
 * can be accessed like normal properties, but whose values are stored in
 * neo4j's internal data structure.
 *
 * @private
 *
 * @param {Object} clazz The class which should get proxied properties.
 * @param {String} prop The property's name.
 * @param {Boolean} [isData=false] Whether or not the property's value is part
 *  of the node's internal data.
 */
function addProperty(clazz, prop, isData) {
  Object.defineProperty(clazz.prototype, prop, {
    get: function () {
      if (isData) {
        return this._node.data[prop];
      } else {
        return this._node[prop];
      }
    },
    set: function (value) {
      if (isData) {
        this._node.data[prop] = value;
      } else {
        this._node[prop] = value;
      }
    }
  });
}

/**
 * @description
 * Default save function which can be added to every model as a generic save
 * function.
 *
 * @param {Function} callback An error callback.
 */
function save(callback) {
  this._node.save(callback);
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
var Repository = module.exports.Repository = function Repository(_node) {
  this._node = _node;
};
addProperty(Repository, 'id');
addProperty(Repository, 'exists');
addProperty(Repository, 'name', true);

Repository.prototype.save = save;

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'repository';

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

    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err) {
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
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err, nodes) {
    if (err && !isIndexNotExistingError(err)) {
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
  var query = ["START node=node:INDEX_NAME(INDEX_KEY = 'INDEX_VAL')",
               "WHERE node.name = {name}",
               "RETURN node",
               "LIMIT 1"
  ].join('\n')
    .replace('INDEX_NAME', INDEX_NAME)
    .replace('INDEX_KEY', INDEX_KEY)
    .replace('INDEX_VAL', INDEX_VAL);

  var params = {
    name: name
  };

  db.query(query, params, function(err, nodes) {
    if (err && isIndexNotExistingError(err)) {
      return callback(null, null);
    } else if (err) {
      return callback(err, null);
    } else if (nodes.length === 0) {
      return callback(null, null);
    }

    callback(null, new Repository(nodes[0].node));
  });
};