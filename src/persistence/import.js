var log = new (require('../logger'))(module),
  Repository = require('./model/repository'),
  Author = require('./model/author'),
  Tag = require('./model/tag');

module.exports = function(repo) {
	log.info('Importing into database.');

  importRootNode(repo);
};

function importRootNode(repo) {
  log.info('Trying to locate existing import for repository %s.', repo.name);
  Repository.getByName(repo.name, function(err, existingRepo) {
    if (err) {
      log.error('Failed to retrieve repository from database.', err);
      process.exit(1);
    }

    if (existingRepo) {
      log.info('Existing import found. Using repository #%d.',
        existingRepo.id);
      importAuthors(repo, existingRepo);
    } else {
      log.info('No existing import found for repository, creating new import.');

      Repository.create({ name: repo.name }, function(err, repoNode) {
        if (err) {
          log.error('Failed to create repository in database: %s', err);
          process.exit(1);
        }

        log.info('Successfully created new repository in database with ID %d.',
          repo.id);
        importAuthors(repo, repoNode);
      });
    }
  });
};

function importAuthors(repo, repoNode) {
  var authorCount = repo.authors.length,
    authorNodeCount = 0,
    authorMap = {};

  log.info("Importing authors");

  var addRefs = function(authorNode, author) {
    authorNode.contributedTo(repoNode, function(err) {
      if (err) {
        log.error('Failed to create relationship between repository #%d ' +
          'and author #%d: %s', repoNode.id, authorNode.id, err);
        process.exit(1);
      } else {
        log.info('Associated %s with repository %s.', authorNode.name,
          repoNode.name);

        authorMap[author.name] = authorNode;
        authorNodeCount++;
        if (authorNodeCount === authorCount) {
          log.info('Imported all authors.');
          importTags(repo, repoNode, authorMap);
        }
      }
    });
  };

  repo.authors.forEach(function(author) {
    Author.getByName(author.name, function(err, authorNode) {
      if (err) {
        log.error('Failed to retrieve author from database: %s', err);
        process.exit(1);
      }

      if (authorNode) {
        log.info('Found author node #%d for author %s.', authorNode.id,
          authorNode.name);
        addRefs(authorNode, author);
      } else {
        log.info('Could not locate an existing author node for name: %s.',
          author.name);

        Author.create(getAuthorData(author), function(err, authorNode) {
          if (err) {
            log.error('Failed to create new author node: %s.', err);
            process.exit(1);
          }

          log.info('Successfully created new author node #%d for user %s.',
            authorNode.id, authorNode.name);
          addRefs(authorNode, author);
        });
      }
    });
  });
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

function importTags(repo, repoNode, authors) {
  log.info('Starting to import tags.');

  // TODO handle no existing tags => continue importing

  repo.tags.forEach(function(tag) {
    Tag.getByName(tag.name, function(err, tagNode) {
      if (err) {
        log.error('Failed to retrieve tag from database: %s', err);
        process.exit(1);
      }

      if (tagNode) {
        log.info('Found tag node #%d for tag %s.', tagNode.id, tagNode.name);
      } else {
        log.info('Could not locate an existing tag node for name: %s.',
          tag.name);

        Tag.create({ name: tag.name}, function(err, tagNode) {
          if (err) {
            log.error('Failed to create new tag node: %s.', err);
            process.exit(1);
          }

          log.info('Successfully created new tag node #%d for user %s.',
            tagNode.id, tagNode.name);
        });
      }
    });
  });
};