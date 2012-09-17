var log = new (require('./logger'))(module),
  def = require('./def'),
  commonAuthorNameStyle = /(.*?) *<(.*)>/i;

/**
 * @description
 * Some version control systems do not show the parent for revisions were there
 * are no co-authors involved. For instance:
 *
 * A -- B -- C
 *
 * For the revisions B and C, no parents would be declared. Fortunately,
 * this information can be obtained by analysing the log. This function fills in
 * the omitted parents.
 *
 * @param {@link Repository} A completely parsed repository instance.
 */
function fillOmmitedParents(repository) {
  for (var i = 0; i < repository.commits.length; i++) {
    var commit = repository.commits[i];

    if (commit.parents.length === 0) {
      var parentCommit = getParentCommit(repository, commit);

      if (parentCommit) {
        commit.parents.push(parentCommit);
      } else {
        log.debug('Could not find a parent revision for commit %s.',
          commit.hash);
      }
    }
  }
};
module.exports.fillOmmitedParents = fillOmmitedParents;

/**
 * @description
 * Find a parent commit in a repository.
 *
 * @private
 *
 * @param {Repository} repo The repository which is used to search for a
 *  parent commit.
 * @param {Commit} commit The commit for which a parent should be found.
 * @return {Commit} The parent commit, if one could be found. Null in case non
 *  was found.
 */
function getParentCommit(repo, commit) {
  var branch = commit.branch,
    parentCommit = findPreviousCommit(branch, commit);


  // there was a parent commit in the branch
  if (parentCommit) {
    return parentCommit;
  }

  // the commit seems to be the first one for the branch. In case no parent
  // is defined for the first commit, we assume it originated in the default
  // branch
  branch = repo.branches[def.defaultBranchName];
  return findPreviousCommit(branch, commit);
};

/**
 * @description
 * Find the previous commit in a branch by date
 *
 * @private
 *
 * @param {Branch} branch The branch in which the previous commit should be
 *  searched for.
 * @param {Commit} commit The commit for which you need to find the previous
 *  one.
 * @return {Commit} The previous commit, if one was found, null otherwise.
 */
function findPreviousCommit(branch, commit) {
  var date = commit.date;

  for (var i = 0; i < branch.commits.length; i++) {
    var eachCommit = branch.commits[i];
    if (date.diff(eachCommit.date) > 0) {
      return eachCommit;
    }
  }

  return null;
};

/**
 * @description
 * Sort commits in a repository by date
 *
 * @param {Repository} repo The repository instance which should be sorted
 * @param {Boolean} [ascending] Whether the commits should be sorted in
 *  ascending or descending order. Defaults to descending.
 */
module.exports.sortCommits = function sortCommits(repo, ascending) {
  var factor = ascending ? 1 : -1;

  repo.commits.sort(function(commit1, commit2) {
    return commit1.date.diff(commit2.date) * factor;
  });
};

/**
 * @description
 * Try to extract authors' email adresses from their name by using the common
 * commit author style: "Forename lastname <email>".
 *
 * @param {Repository} repo THe repository for which authors email addresses
 *  should be extracted.
 */
module.exports.fillAuthorEmails = function fillAuthorEmails(repo) {
  var i,
    author,
    match;

  for (i = 0; i < repo.authors.length; i++) {
    author = repo.authors[i];
    match = author.name.match(commonAuthorNameStyle);

    if (match) {
      author.name = match[1];
      author.email = match[2];
    }
  }
};