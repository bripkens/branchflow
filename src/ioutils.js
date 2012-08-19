var fs = require('fs'),
  lazy = require('lazy');

function readByLine(file, callback, successCallback, errorCallback) {
  var stream = fs.createReadStream(file.path, {
    flags: 'r',
    encoding: file.encoding,
    fd: null,
    mode: 0666,
    bufferSize: 64 * 1024
  });

  if (errorCallback) {
    stream.on('error', errorCallback);
  }

  new lazy(stream).lines
    .forEach(function(line) {
      callback(line.toString());
    });

  if (successCallback) {
    stream.on('end', successCallback);
  }
};

module.exports.readByLine = readByLine;