#!/usr/local/bin/node
var neo4j = require('./src/persistence/neo4j');

neo4j.createNode({ name: 'develop', type: 'branch'}, function(err, branch) {
  console.log('Branch ID: ', branch.id);
  neo4j.createNode({ hash: '2sai32g9d', type: 'commit'}, function(err, commit) {
    console.log('Commit ID: ', commit.id);

    commit.createRelationshipTo(branch, 'belongs to', {}, function(err, rel) {
      console.log('err: ', err);
    });

  })
});
