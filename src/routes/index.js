var user = require('./user');

module.exports = function(app) {
  app.get('/', index);
  app.get('/users', user.list);
};


function index(req, res){
  res.render('index', { title: 'Express' });
};