var user = require('./user'),
  log = require('../logger')(module);
  hgParser = require('../parser/hg'),
  file = {
    path: 'test/hg.log',
    encoding: 'utf8'
  };

module.exports = function(app) {
  app.get('/', index);
  app.get('/users', user.list);
};


function index(req, res) {
  hgParser(file, function(repo) {
    res.render('sequential', {
      title: 'Sequential repository view',
      repo: repo
    });
  }, function(err) {
    log.error(err);
    res.render('error', {
      title: 'Error',
      msg: 'Failed to parse Mercurial log. See Server log for details.'
    });
  });
};