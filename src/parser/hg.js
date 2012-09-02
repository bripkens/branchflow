var moment = require('moment'),
  ioutils = require('../ioutils')
  model = require('../model'),
  defaultBranchName = 'default',
  branchFlowDefaultBranchName = require('../def').defaultBranchName;
  defaultTag = 'tip',
  dateFormat = 'ddd MMM DD HH:mm:ss YYYY Z',
  commitLineRegex = /^changeset: +(\d+):([a-z0-9]{10,})$/i,
  parentLineRegex = /^parent: +(\d+):([a-z0-9]{10,})$/i,
  commentLineRegex = /^summary: *(.*)$/i,
  metaDataLines = [
    {
      key: 'author',
      regex: /^user: +(.*)$/i,
      group: 1
    }, {
      key: 'branch',
      regex: /^branch: +(.*)$/i,
      group: 1
    }, {
      key: 'date',
      regex: /^date: +(.*)$/i,
      group: 1,
      processor: dateProcessor
    }, {
      key: 'tag',
      regex: /^tag: +(.*)$/i,
      group: 1,
      processor: tagProcessor
    }
  ];

/**
 * @description
 * Transforms a Date in form of a String to a moment.js Date Object.
 *
 * @private
 *
 * @param {String} dateString A date as retrieved from a Mercurial log file.
 *  The String is parsed to a moment.js Date Object.
 * @return {MomentjsDate} A moment.js Date Object.
 */
function dateProcessor(dateString) {
  return moment(dateString, dateFormat);
};

/**
 * @description
 * Filters Mercurial's default tag 'tip' as it is of no use to branchflow.
 *
 * @private
 *
 * @param {String} tag A Mercurial tag name.
 * @return {String} The given tag or null when the tag equals 'tip'.
 */
function tagProcessor(tag) {
  if (tag === defaultTag) {
    return null;
  }

  return tag;
};

/**
 * @description
 * Processes the branch name, i.e., exchanges Mercurial's default branch name
 * 'default' with branchflow's default branch name.
 *
 * @private
 *
 * @param {String} branchName A name of a branch
 * @return {String} The processed branch name as described above.
 */
function branchProcessor(branchName) {
  if (branchName === defaultBranchName) {
    return branchFlowDefaultBranchName;
  }

  return branchName;
};

/**
 * @description
 * Parse a Mercurial log file into branchflow's internal structure.
 *
 * @param file A file descriptor
 * @paran file.path Absolute or relative path to the file.
 * @param file.encoding The file's encoding, e.g. 'utf8'.
 * @param {Function} resultCallback The function which is to be called once
 *  the log has been parsed completely.
 * @param {Function} [errorCallback] A function which should be called when an
 *  error occurs during the parsing process.
 */
function parseLog(file, resultCallback, errorCallback) {
  new MercurialParser(file, resultCallback, errorCallback).parse();
};

module.exports = parseLog;

/**
 * @class A Mercurial Parser
 *
 * @constructor
 * Constructs a new Parser for Mercurial log files. Please note that every
 * instance may only be used to parse a single Mercurial log file!
 *
 * @param file A file descriptor
 * @paran file.path Absolute or relative path to the file.
 * @param file.encoding The file's encoding, e.g. 'utf8'.
 * @param {Function} resultCallback The function which is to be called once
 *  the log has been parsed completely.
 * @param {Function} [errorCallback] A function which should be called when an
 *  error occurs during the parsing process.
 */
function MercurialParser(file, resultCallback, errorCallback) {
  this.file = file;
  this.resultCallback = resultCallback;
  this.errorCallback = errorCallback;
  this.parsedLog = {};
  this.lastEntry = null;
};

/**
 * @description
 * Starts the actual parsing process. This method communicates the parse
 * result through the callbacks which were given to the MercurialParser's
 * constructor.
 */
MercurialParser.prototype.parse = function() {
  var parser = this;
  ioutils.readByLine(this.file, function(line) {
    parser.parseLine(line);
  }, function() {
    parser.parsingFinished();
  }, function(error) {
    if (parser.errorCallback) {
      parser.errorCallback(error);
    }
  });
};

/**
 * @description
 * This method is called for every line in the log file. It analyses each line
 * add the obtained information to the internal parsed log (this.parsedLog).
 *
 * @private
 *
 * @param {String} line A line of text which was obtained from a Mercurial
 *  log file.
 */
MercurialParser.prototype.parseLine = function(line) {
  var match = line.match(commitLineRegex);

  // Do we have a new log entry?
  if (match) {
    this.addNewLogEntry(match[1], match[2]);
    return;
  }

  var parsed = this.parseMetaDataLines(line);
  if (parsed) {
    return;
  }

  parsed = this.parseParentChangesets(line);
  if (!parsed) {
    this.parseComment(line);
  }
};

/**
 * @description
 * Start a new log entry.
 *
 * @private
 *
 * @param {String} revision The internal revision as used by the repository
 *  clone.
 * @param {String} hash The changeset's hash.
 */
MercurialParser.prototype.addNewLogEntry = function(revision,
    hash) {
  var entry = this.parsedLog[hash] = this.lastEntry = {
    hash: hash,
    revision: revision,
    author: null,
    branch: defaultBranchName,
    tag: null,
    leftParent: null,
    rightParent: null,
    comment: ''
  };
};

/**
 * @description
 * Parse meta data, e.g., information about the changeset author, the commit
 * date and various other information which is contained within a single
 * line. This does not include a changeset's summary.
 *
 * @private
 *
 * @param {String} line A line of the log file
 * ®return {Boolean} true when the line is a meta data line and was
 *  parsed successfully, false otherwise.
 */
MercurialParser.prototype.parseMetaDataLines = function(line) {
  for (var i = 0; i < metaDataLines.length; i++) {
    var metaDataLine = metaDataLines[i];

    var match = line.match(metaDataLine.regex);

    if (match) {
      var val = match[metaDataLine.group];

      if (metaDataLine.processor) {
        val = metaDataLine.processor(val);
      }

      this.lastEntry[metaDataLine.key] = val;
      return true;
    }
  }

  return false;
};

/**
 * @description
 * Parse a log's parent changeset information. A changeset may have up to
 * two parents, which is why this parsing process can not be done as part of
 * the meta data line parsing.
 *
 * @private
 *
 * @param {String} line A line of the log file
 * ®return {Boolean} true when the line is a meta data line and was
 *  parsed successfully, false otherwise.
 */
MercurialParser.prototype.parseParentChangesets = function(line) {
  var match = line.match(parentLineRegex);

  if (match) {
    var hash = match[2];

    if (!this.lastEntry.leftParent) {
      this.lastEntry.leftParent = hash;
    } else {
      this.lastEntry.rightParent = hash;
    }

    return true;
  }

  return false;
};

/**
 * @description
 * Parse the free-style commit message (also called summary).
 *
 * @private
 *
 * @param {String} line A line of the log file
 */
MercurialParser.prototype.parseComment = function(line) {
  var match = line.match(commentLineRegex),
    comment = line;

  if (match) {
    comment = match[1];
  }

  this.lastEntry.comment += comment;
};

/**
 * @description
 * This method transform the internal (internal to this parser) log
 * representation to branchflow's global (global to all parsers).
 * It furthermore also calls the resultCallback.
 *
 * @private
 */
MercurialParser.prototype.parsingFinished = function() {
  var repository = new model.Repository();

  for (var hash in this.parsedLog) {
    if (this.parsedLog.hasOwnProperty(hash)) {
      var logEntry = this.parsedLog[hash];

      var commit = repository.addCommit(hash);
      commit.date = logEntry.date;
      commit.author = repository.addAuthor(logEntry.author);
      commit.branch = repository.addBranch(branchProcessor(logEntry.branch));
      commit.branch.commits.push(commit);
      commit.comment = logEntry.comment;
      commit.revision = parseInt(logEntry.revision);

      if (logEntry.tag) {
        commit.tag = repository.addTag(logEntry.tag, commit);
      }
      if (logEntry.leftParent) {
        commit.parents.push(repository.addBranch(logEntry.leftParent));
      }
      if (logEntry.rightParent) {
        commit.parents.push(repository.addBranch(logEntry.rightParent));
      }
    }
  }

  this.resultCallback(repository);
};