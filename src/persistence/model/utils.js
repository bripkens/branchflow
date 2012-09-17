var log = new (require('../../logger'))(module);
  indexNotExistingError = /^Index .* does not exist$/i;

/**
 * @description
 * Checks whether the error message denotes an 'index not found error'. This
 * error is commonly found when querying an index for the first time (and
 * when the index has not been created). Neo4j indexes are created lazily, i.e.,
 * once a node is indexed under the index's name.
 *
 * @private
 *
 * @param {Object} err An error object. The object does not need to conform to
 *  any special requirements except the following one:
 * @param {String} [err.message] The actual error message. When no error message
 *  is found, this function returns false.
 * @return {Boolean} True when the err.message exists and looks like an 'index
 *  not found error'.
 */
module.exports.isIndexNotExistingError = function isIndexNotExistingError(err) {
  return err.hasOwnProperty('message') &&
    err.message.match(indexNotExistingError) != null;
};

/**
 * @description
 * Adds a proxied property to the class. A proxy property is a property which
 * can be accessed like normal properties, but whose values are stored in
 * neo4j's internal data structure.
 *
 * @private
 *
 * @param {Object} clazz The class which should get proxied properties.
 * @param {String} prop The property's name.
 * @param {Boolean} [isData=false] Whether or not the property's value is part
 *  of the node's internal data.
 */
module.exports.addProperty = function addProperty(clazz, prop, isData) {
  Object.defineProperty(clazz.prototype, prop, {
    get: function () {
      if (isData) {
        return this._node.data[prop];
      } else {
        return this._node[prop];
      }
    },
    set: function (value) {
      if (isData) {
        this._node.data[prop] = value;
      } else {
        this._node[prop] = value;
      }
    }
  });
}

/**
 * @description
 * Default save function which can be added to every model as a generic save
 * function.
 *
 * @param {Function} callback An error callback.
 */
module.exports.save = function save(callback) {
  this._node.save(callback);
};

/**
 * @∂escription
 * Convenience function to build neo4j queries. This function takes a variable
 * number of arguments. Starting from the first argument, this function
 * joins all the strings that it finds using a newline character and then
 * replaces all the placeholders.
 *
 * @example
 * buildQuery("START node=node:index.name(index.key = 'index.val')",
 *            "WHERE node.name = {name}",
 *             "RETURN node",
 *             "LIMIT 1", {
 *               'index.name': 'someName',
 *               'index.key': 'someKey',
 *               'index.val': 'someKVal'
 *             });
 */
module.exports.buildQuery = function buildQuery() {
  var queryParts = [],
    previousArgumentWasString = true,
    i,
    arg,
    query,
    placeholders,
    key;

  // extract all query parts
  for (i = 0; i < arguments.length && previousArgumentWasString; i++) {
    arg = arguments[i];

    if (typeof(arg) === 'string') {
      queryParts.push(arg);
    } else {
      previousArgumentWasString = false;
    }
  }

  // replace all the placeholders
  query = queryParts.join('\n');
  placeholders = arguments[i];
  for (key in placeholders) {
    if (placeholders.hasOwnProperty(key)) {
      query = query.replace(key, placeholders[key]);
    }
  }

  return query;
};