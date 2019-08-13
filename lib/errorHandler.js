'use strict';

const debug = require('debug')('nodebb-plugin-cloudstorage:errorHandler');

module.exports = function(data, next) {
    debug('--------- errorHandler ---------');
    return next(null, data);
}