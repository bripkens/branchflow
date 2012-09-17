var log = new (require('../logger'))(module),
  model = require('./model');

function importRootNode(repo) {

};

module.exports = function(repo) {
	log.info('Importing commits into database.');

  log.info('Trying to locate existing import for repository %s.', repo.name);
  model.Repository.getByName(repo.name, function(err, existingRepo) {
    if (err) {
      log.error('Failed to retrieve repository from database.', err);
      process.exit(1);
    }

    if (existingRepo) {
      log.info('Existing import found. Using repository with ID %d.',
        existingRepo.id);
    } else {
      log.info('No existing import found for repository, creating new import.');

      model.Repository.create({ name: repo.name }, function(err, repo) {
        if (err) {
          log.error('Failed to create repository in database.', err);
          process.exit(1);
        }

        log.info('Successfully created new repository in database with ID %d.',
          repo.id);
      });
    }
  });
};