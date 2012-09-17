var def = require('../../def'),
  util = require('util'),
  utils = require('./utils'),
  neo4j = require('neo4j'),
  log = new (require('../../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url),
  index = {
    name: 'nodes',
    key: 'type',
    val: 'tag'
  };

/**
 * @class Tag
 *
 * @constructor
 * Creates a new neo4j-aware Tag model. This function should generally
 * not be invoked directly, but instead through the generator function
 * Tag.create(...).
 *
 * @param {Neo4jNode} _node neo4j's internal node. Strictly required. Without
 *  this node, all attempts to access properties will fail.
 */
var Tag = module.exports = function Tag(_node) {
  this._node = _node;
};

utils.addProperty(Tag, 'id');
utils.addProperty(Tag, 'exists');
utils.addProperty(Tag, 'name', true);

Tag.prototype.save = utils.save;

Tag.prototype.belongsTo = function(repo, callback) {
  this._node.createRelationshipTo(repo._node, 'belongsTo',
      {},
      function (err, rel) {
    callback(err);
  });
};

/**
 * @description
 * Creates a new Tag instance. This method should generally be used
 * instead of the constructor as it takes care of the neo4j initialisation.
 *
 * @param {Object} data Any data associated to a Tag node.
 * @param {Function} callback The error/result callback.
 */
Tag.create = utils.newCreateFunction(db, Tag, index);

/**
 * @description
 * Retrieve all Tag instances from the data store.
 *
 *                            - BEWARE -
 * This operation may be (depending on the number of nodes) expensive.
 *
 * @param {Function} callback The error/result callback.
 */
Tag.getAll = utils.newGetAllFunction(db, Tag, index);

/**
 * @description
 * Get a single Tag by name. The name must be an exact match.
 *
 * @param {String} name The Tag's name.
 * @param {Function} callback The error/result callback.
 */
Tag.getByName = utils.newGetByDataFunction(db, Tag, index, 'name');