var log = new (require('../logger'))(module),
  model = require('./model');

module.exports = function(repo) {
	log.info('Importing commits into database.');

  // model.Repository.create({ name: repo.name }, function(err, repo) {
  //   // console.log('err: ', err);
  //   // console.log('repo: ', repo);
  //   // console.log('repo.id: ', repo.id);

  //   model.Repository.getAll(function(err, repos) {
  //     if (err) {
  //       log.error(err);
  //     }

  //     for (var i = 0; i < repos.length; i++) {
  //       console.log(repos[i].name);
  //     }
  //   });
  // });

  model.Repository.getByName('icis+', function(err, repo) {
    console.log('repo.name: ', repo.name);
  });
};