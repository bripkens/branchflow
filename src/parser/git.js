var io = require('./ioutils'),
  moment = require('moment'),
  defaultBranchName = 'master',
  dateFormat = 'ddd MMM DD HH:mm:ss YYYY Z',
  commitLineRegex = /^commit ([a-z0-9]{40,})( \((HEAD, )?(.*)\))?$/i,
  metaDataLines = [
    {
      keys: ['author'],
      regex: /^Author: (.*)$/i,
      groups: [1]
    }, {
      keys: ['merge.to', 'merge.from'],
      regex: /^Merge: ([0-9a-z]{7,}) ([0-9a-z]{7,})$/i,
      groups: [1, 2]
    }, {
      keys: ['date'],
      regex: /^Date:\s*(.*)$/i,
      groups: [1],
      processor: [parseDate]
    }
  ];

function parseLog(file, resultCallback, errorCallback) {
  var log = [];

  io.readByLine(file, function(line) {
    parseLine(line, log);
  }, function() {
    resultCallback(log);
  }, function(error) {
    errorCallback(error);
  });
};

module.exports = parseLog;

function parseLine(line, log) {
  if (line.match(commitLineRegex)) {
    createNewLogEntry(line, log);
    return;
  }

  var lineSuccessfullyParsed = parseMetaDataLines(line, log);

  if (!lineSuccessfullyParsed) {
    parseComment(line, log);
  }
};

function createNewLogEntry(line, log) {
  var match = line.match(commitLineRegex);

  var newEntry = {
    commit: match[1],
    branch: match[4] || defaultBranchName
  };

  log.push(newEntry);
};

function parseMetaDataLines(line, log) {
  for (var i = 0; i < metaDataLines.length; i++) {
    var metaDataLine = metaDataLines[i],
      match = line.match(metaDataLine.regex);

    if (match) {
      extractMetaDataFromMatchedLine(metaDataLine, match, getLastLogEntry(log));
      return true;
    }
  }

  return false;
};

function extractMetaDataFromMatchedLine(metaDataLine, match, logEntry) {
  for (var i = 0; i < metaDataLine.keys.length; i++) {
    var key = metaDataLine.keys[i],
      group = metaDataLine.groups[i],
      value = match[group];

    if (metaDataLine.processor !== undefined && metaDataLine.processor[i] !== undefined) {
      value = metaDataLine.processor[i](value);
    }

    writeNestedProperty(logEntry, key, value);
  }
};

function getLastLogEntry(log) {
  return log[log.length - 1];
};

function writeNestedProperty(object, propertyDescriptor, value) {
  var properties = propertyDescriptor.split('.');

  var currentObject = object;
  for (var i = 0; i < properties.length - 1; i++) {
    var currentProperty = properties[i];
    currentObject = currentObject[currentProperty] = currentObject[currentProperty] || {};
  }

  var finalPropertyName = properties[properties.length - 1];
  currentObject[finalPropertyName] = value;
};

function parseComment(line, log) {
  var logEntry =  getLastLogEntry(log);

  logEntry.comment = logEntry.comment || '';
  logEntry.comment = logEntry.comment + line;
};

function parseDate(dateString) {
  return moment(dateString, dateFormat);
};