/**
 * @description
 * Some version control systems do not show the parent for revisions were there
 * are no co-authors involved. For instance:
 *
 * A -- B -- C
 *
 * The revisions B and C, no parents would be declared. Fortunately, this
 * information can be obtained by analysing the log. This function fills in
 * the omitted parents.
 *
 * @param {@link Repository} A completely parsed repository instance.
 */
function fillOmmitedParents(repository) {

};

module.exports.fillOmmitedParents = fillOmmitedParents;