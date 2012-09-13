/**
 * @class Repository - a complete representation of a repository's activities
 *
 * @constructor
 * Constructs a new repository instance
 *
 */
function Repository() {
  this.name = '';
  this.authors = [];
  this.branches = {};
  this.commits = [];
  this.tags = [];
};

module.exports.Repository = Repository;

/**
 * @description
 * Adds an {@link Author} instances with the given name. The instance may
 * either be already registered for the repository, i.e., the author is already
 * known, or represent a new one. For new authors a respective {@link Author}
 * instance will be created and registered with the Repository.
 *
 * The function ensures that only one {@link Author} instance is created for the
 * author with the given name. Subsequent calls with the same name will yield
 * the same {@link Author} instance.
 *
 * @param {String} name The author's name.
 * @return {Author} An {@link Author} instance which represents the author.
 */
Repository.prototype.addAuthor = function(name) {
  for (var i = 0; i < this.authors.length; i++) {
    var author = this.authors[i];

    if (author.name.indexOf(name) !== -1) {
      return author;
    }
  }

  var newAuthor = new Author(name);
  this.authors.push(newAuthor);
  return newAuthor;
};

/**
 *
 * @description
 * Will add a name branch to the repository with the given name and returns
 * an {@link Branch} instance. Multiple calls of this method with the same
 * branch name will always yield the same branch instance.
 *
 * @param {String} branch The name of the branch
 * @return {Branch} A {@link Branch} instance for the branch with the
 *  given name.
 */
Repository.prototype.addBranch = function(branch) {
  return this.branches[branch] = this.branches[branch] || new Branch(branch);
};

/**
 * @description
 * Adds a commit (also known as changeset) with the given hash to the
 * repository. Should a commit with this hash be already registered, then the
 * existing {@link Commit} instance is returned.
 *
 * @param {String} hash The commit's (or changeset's) hash.
 @ @return {Commit} An instance of {@link Commit}.
 */
Repository.prototype.addCommit = function(hash) {
  var commit = this.getCommit(hash);
  if (commit) {
    return commit;
  }

  var newCommit = new Commit();
  newCommit.hash = hash;
  this.commits.push(newCommit);
  return newCommit;
};

/**
 * @description
 * Retrieve a commit from this repository based on the commit's hash.
 *
 * @param {String} hash A commit's hash.
 * @return {Commit} The matching commit or null in case there is no commit with
 *   such a hash in this repository.
 */
Repository.prototype.getCommit = function(hash) {
  for (var i = 0; i < this.commits.length; i++) {
    var commit = this.commits[i];

    if (commit.hash === hash) {
      return commit;
    }
  }

  return null;
};

/**
 * @description
 * Tag a commit with a name.
 *
 * @param {String} name The name of the tag.
 * @param {Commit} commit The commit which should be tagged
 * @return {Tag} a {@link Tag} instance.
 */
Repository.prototype.addTag = function(name, commit) {
  var tag = new Tag();
  tag.name = name;
  tag.commit = commit;
  this.tags.push(tag);
  return tag;
};

/**
 * @class Represents an author
 *
 * @constructor
 */
function Author(name, email) {
  this.name = name || null;
  this.email = email || null;
};

/**
 * @class Represents a branch
 *
 * @constructor
 */
function Branch(name) {
  this.name = name || null;
  this.commits = [];
};

/**
 * @description
 * Check whether the given commit is the last one in this branch.
 *
 * @param {@link Commit} commit The commit for which it should be checked
 *  whether it is the last.
 * @return {Boolean} true when it is the last commit in this branch, false
 *  otherwise.
 */
Branch.prototype.isLastCommit = function(commit) {
  if (this.commits.length === 0) {
    return false;
  }

  return this.commits[this.commits.length - 1] === commit;
};

/**
 * @class Represents a tag
 *
 * @constructor
 */
function Commit() {
  this.hash = null;
  this.revision = -1;
  this.date = null;
  this.author = null;
  this.branch = null;
  this.comment = null;
  this.tag = null;
  this.parents = [];
};

/**
 * @class Represents a tag
 *
 * @constructor
 */
function Tag(name) {
  this.name = name || null;
  this.commit = null;
};