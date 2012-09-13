var log = new (require('../logger'))(module);

module.exports = function(repo) {
	log.info('Importing commits into database.');
};