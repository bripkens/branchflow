var def = require('../def'),
  util = require('util'),
  neo4j = require('neo4j'),
  log = new (require('../logger'))(module);
  db = new neo4j.GraphDatabase(def.persistence.url);

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

function save(callback) {
  this._node.save(callback);
};

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

Repository.create = function(data, callback) {
  var node = db.createNode(data);
  var repo = new Repository(node);

  node.save(function(err) {
    if (err) {
      return callback(err);
    }
    node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, repo);
    });
  });
};

Repository.getAll = function(callback) {
  db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function(err, nodes) {
    // if (err) return callback(err);
    // XXX FIXME the index might not exist in the beginning, so special-case
    // this error detection. warning: this is super brittle!!
    if (err) {
      return callback(err, null);
    }

    var repositories = nodes.map(function(node) {
      return new Repository(node);
    });
    callback(null, repositories);
  });
};

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
    if (err) {
      return callback(err, null);
    } else if (nodes.length === 0) {
      callback(null, null);
      return;
    }

    callback(null, new Repository(nodes[0].node));
  });
};