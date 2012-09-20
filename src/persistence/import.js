var log = new (require('../logger'))(module),
  _ = require('underscore'),
  Repository = require('./model/repository'),
  Author = require('./model/author'),
  Tag = require('./model/tag'),
  Branch = require('./model/branch'),
  Commit = require('./model/commit');

module.exports = function(repo) {
	log.info('Importing into database.');

  importRootNode(repo);
};

function genericImport(coll,
    getByFn,
    getByProp,
    createNodeFn,
    createDataFn,
    eachCallback,
    allDoneCallback,
    nodeName) {

  nodeName = nodeName || 'node';

  var keys = Object.keys(coll),
    importCount = 0;

  if (keys.length === 0) {
    // just in case that there are no tags / branches / authors...
    allDoneCallback();
    return;
  }

  var nodeImported = function(node, entry) {
    eachCallback(node, entry);
    if (++importCount == keys.length) {
      allDoneCallback();
    }
  };

  keys.forEach(function(key) {
    var entry = coll[key],
      prop = entry[getByProp];

    getByFn(prop, function(err, node) {
      if (err) {
        var fnName = getByFn.name || 'anonFn';
        log.error('Failed to retrieve %s from database (tried to load node ' +
          'using %s with parameter %s): %s.', nodeName, fnName, prop, err);
        process.exit(1);
      } else if (node) {
        log.info('Existing import found. Using %s #%d (%s).',
          nodeName, node.id, prop);
        nodeImported(node, entry);
      } else {
        createNodeFn(createDataFn(entry), function(err, node) {
          if (err) {
            var fnName = createNodeFn.name || 'anonFn';
            log.error('Failed to create %s in database (tried to create node ' +
              'using %s): %s.', nodeName, fnName, prop, err);
            process.exit(1);
          }

          log.info('Successfully created new %s in database ' +
            'with ID %d (%s).', nodeName, node.id, prop);
          nodeImported(node, entry);
        });
      }
    });
  });
};

/**
 *
 *
 */
function importRootNode(repo) {
  var repoNode;

  var each = function(node) {
    repoNode = node;
  };

  var allDone = function() {
    importAuthors(repo, repoNode);
  };

  genericImport([repo],
    Repository.getByName,
    'name',
    Repository.create,
    getRepositoryData,
    each,
    allDone,
    'repository');
};

function getRepositoryData(repo) {
  return {
    name: repo.name
  };
}

/**
 *
 *
 */
function importAuthors(repo, repoNode) {
  log.info('Starting author node import');

  var authorNodes = {};

  var each = function(authorNode) {
    authorNode.contributedTo(repoNode, function(err) {
      if (err) {
        log.error('Failed to create relationship between repository #%d ' +
          'and author #%d: %s', repoNode.id, authorNode.id, err);
        process.exit(1);
      }

      log.info('Associated %s with repository %s.', authorNode.name,
        repoNode.name);
    });

    authorNodes[authorNode.name] = authorNode;
  };

  var allDone = function() {
    log.info('Finished importing author nodes.');
    importTags(repo, repoNode, authorNodes);
  };

  genericImport(repo.authors,
    Author.getByName,
    'name',
    Author.create,
    getAuthorData,
    each,
    allDone,
    'author');
};

function getAuthorData(author) {
  var data = {
    name: author.name
  };

  if (author.email) {
    data.email = author.email;
  }

  return data;
};

/**
 *
 *
 */
function importTags(repo, repoNode, authorNodes) {
  log.info('Starting tag node import');

  var tagNodes = {};

  var each = function(tagNode) {
    tagNodes[tagNode.name] = tagNode;
  };

  var allDone = function() {
    log.info('Finished tag node import.');
    importBranches(repo, repoNode, authorNodes, tagNodes);
  };

  genericImport(repo.tags,
    Tag.getByName,
    'name',
    Tag.create,
    getTagData,
    each,
    allDone,
    'tag');
};

function getTagData(tag) {
  return {
    name: tag.name
  };
};

/**
 *
 *
 */
function importBranches(repo, repoNode, authorNodes, tagNodes) {
  log.info('Starting branch node import');

  var branchNodes = {};

  var each = function(branchNode) {
    branchNodes[branchNode.name] = branchNode;

    branchNode.belongsTo(repoNode, function(err) {
      if (err) {
        log.error('Failed to create relationship between repository #%d ' +
          'and branch #%d: %s', repoNode.id, branchNode.id, err);
        process.exit(1);
      }

      log.info('Associated %s with repository %s.', branchNode.name,
        repoNode.name);
    });
  };

  var allDone = function() {
    log.info('Finished branch node import.');
    importCommits(repo, repoNode, authorNodes, tagNodes, branchNodes);
  };

  genericImport(repo.branches,
    Branch.getByName,
    'name',
    Branch.create,
    getBranchData,
    each,
    allDone,
    'branch');
};

function getBranchData(branch) {
  return {
    name: branch.name
  };
};

/**
 *
 *
 */
function importCommits(repo, repoNode, authorNodes, tagNodes, branchNodes) {
  log.info('Starting commit node import');

  var commitNodes = {};

  var each = function(commitNode, commit) {
    var branchNode = branchNodes[commit.branch.name];
    commitNode.authoredIn(branchNode, function(err) {
      if (err) {
        log.error('Failed to create relationship between branch #%d ' +
          'and commit #%d: %s', branchNode.id, commitNode.id, err);
        process.exit(1);
      }

      log.info('Associated commit %s with branch %s.', commitNode.hash,
        branchNode.name);
    });

    var authorNode = authorNodes[commit.author.name];
    authorNode.authored(commitNode, function(err) {
      if (err) {
        log.error('Failed to create relationship between author #%d ' +
          'and commit #%d: %s', authorNode.id, commitNode.id, err);
        process.exit(1);
      }

      log.info('Associated commit %s with author %s.', commitNode.hash,
        authorNode.name);
    });

    if (commit.tag) {
      var tagNode = tagNodes[commit.tag.name];
      tagNode.tagged(commitNode, function(err) {
        if (err) {
          log.error('Failed to create relationship between tag #%s ' +
            'and commit #%s: %s', tagNode.id, commitNode.id, err);
          process.exit(1);
        }

        log.info('Associated commit %s with tag %s.', commitNode.hash,
          tagNode.name);
      });
    }

    commitNodes[commitNode.hash] = commitNode;
  };

  var allDone = function() {
    _.each(commitNodes, function(commitNode) {
      var hash = commitNode.hash,
        commit = repo.getCommit(hash);

      _.each(commit.parents, function(parent) {
        var parentCommitNode = commitNodes[parent.hash];

        commitNode.parent(parentCommitNode, function(err) {
          if (err) {
            log.error('Failed to create relationship between commit #%s and ' +
              ' parent-commit #%s: %s', commitNode.id, parentCommitNode.id, err);
            process.exit(1);
          }

          log.info('Associated commit %s with parent-commit %s.',
            commitNode.hash, parentCommitNode.hash);
        });
      });
    });

    log.info('Finished commit node import.');
    log.info('-------------------------------------------');
    log.info('Finished branchflow import.')
  };

  genericImport(repo.commits,
    Commit.getByHash,
    'hash',
    Commit.create,
    getCommitData,
    each,
    allDone,
    'commit');
};

function getCommitData(commit) {
  var data = {
    hash: commit.hash
  };

  if (commit.comment) {
    data.comment = commit.comment;
  }

  if (commit.date) {
    data.date = commit.date.format();
  }

  return data;
};