'use strict';

const crypto = require.main.require('crypto'),
  fs = require.main.require('fs'),
  debug = require('debug')('nodebb-plugin-cloudstorage:library'),

  controllers = require('./lib/controllers')(),
  errorHandler = require('./lib/errorHandler'),

  NodeBB_Controllers = require.main.require('./src/controllers'),
  NodeBB_Templates = require.main.require('benchpressjs');

let plugin = {};

plugin.controllers = controllers;
plugin.errorHandler = errorHandler;

plugin.staticAppPreload = function(params, callback) {
  // params = { app, middleware }
  debug('--------- staticAppPreload ---------');
  callback();
}
plugin.staticAppLoad = function(data, callback) {
  // data = { app, router, middleware, controllers }
  debug('--------- staticAppLoad ---------');
  data.router.get('/admin/plugins/cloudstorage', data.middleware.applyCSRF, data.middleware.admin.buildHeader, controllers.renderAdmin);
  data.router.get('/api/admin/plugins/cloudstorage', data.middleware.applyCSRF, controllers.renderAdmin);
  controllers.loadSettings();

  NodeBB_Templates.registerHelper('storageProviderHelper', (data, provider) => {
    debug('--------- storageProviderHelper ---------');
    return data === provider ? true : false;
  });

  //debug(params);
  callback();
}

plugin.filterUploadImage = function filterUploadImage(params, callback) {
  debug('--------- filterUploadImage ---------');
  let image = params.image,
    uid = params.uid;

  new Promise((resolve, reject) => {
    fs.readFile(image.path, (error, data) => {
      if (error) return reject(error);
      let etag = crypto.createHash('md5').update(data).digest('hex');
      resolve({data, etag});
    });
  })
  .then(fileObject => {
    controllers.providersUpload(image, fileObject, callback);
  });
}

module.exports = plugin;
