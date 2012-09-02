var fs = require('fs'),
  lazy = require('lazy');

/**
 * @description
 * Lazily read a file line-by-line.
 *
 * @param file A file descriptor
 * @paran file.path Absolute or relative path to the file.
 * @param file.encoding The file's encoding, e.g., 'utf8'.
 * @param {Function} callback The function which is to be called for every line.
 * @param {Function} successCallback Since the process is lazy and the caller of
 *  this function does not have access to the underlying stream, the caller can
 *  not determine whether the stream has no further data. This callback is used
 *  to solve this issue. The function is called once no more data is available,
 *  i.e., the file has been read completely.
 * @param {Function} [errorCallback] A function which should be called when an
 *  error occurs while reading the file.
 */
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