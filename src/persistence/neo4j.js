var neo4j = require('neo4j'),
  log = new (require('../logger'))(module);
  db = new neo4j.GraphDatabase('http://localhost:7474');


module.exports.createNode = function createNode(data, callback) {
  var node = db.createNode(data);
  log.debug('Saving node', data);
  node.save(function(err) {
    if (err) {
      (callback || log.error)(err);
    } else if (callback) {
      callback(null, node);
    }
  });
};