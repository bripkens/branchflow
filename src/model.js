function Repository() {
  this.authors = [];
  this.branches = {};
  this.commits = [];
};

Repository.prototype.getAuthor = function(authorLog) {
  for (var i = 0; i < this.authors.length; i++) {
    var author = this.authors[i];

    if (authorLog.indexOf(author.name) !== -1) {
      return author;
    }
  }

  var newAuthor = Author.fromLog(authorLog);
  this.authors.push(newAuthor);
  return newAuthor;
};

Repository.prototype.getBranch = function(branch) {
  return this.branches[branch] = this.branches[branch] || new Branch(branch);
};

Repository.prototype.getCommit = function(hash) {
  for (var i = 0; i < this.commits.length; i++) {
    var commit = this.commits[i];

    if (commit.hash.indexOf(hash) === 0 || hash.indexOf(commit.hash) === 0) {
      if (hash.length > commit.hash.length) {
        commit.hash = hash;
      }

      return commit;
    }
  }

  var newCommit = new Commit();
  newCommit.hash = hash;
  this.commits.push(newCommit);
  return newCommit;
};

Repository.fromLog = function(log) {
  var repository = new Repository();

  for (var i = 0; i < log.length; i++) {
    var entry = log[i],
      commit = repository.getCommit(entry.commit);

    commit.branch = repository.getBranch(entry.branch);
    commit.author = repository.getAuthor(entry.author);
    commit.date = entry.date;
    commit.comment = entry.comment;

    if (entry.merge !== undefined) {
      commit.merge = new Merge(repository.getCommit(entry.merge.from),
        repository.getCommit(entry.merge.to));
    }

    commit.branch.commits.push(commit);
  }

  return repository;
};

function Author(name, email) {
  this.name = name || null;
  this.email = email || null;
};

Author.fromLog = function(author) {
  var match = author.match(/^(.*?)\s*<(.*)>.*$/);
  return new Author(match[1], match[2]);
};

function Branch(name) {
  this.name = name || null;
  this.commits = [];
};

function Commit() {
  this.hash = null;
  this.date = null;
  this.author = null;
  this.branch = null;
  this.comment = null;
  this.merge = null;
};

function Merge(from, to) {
  this.from = from || null;
  this.to = to || null;
};

module.exports.Repository = Repository;