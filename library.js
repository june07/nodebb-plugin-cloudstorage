'use strict';

const crypto = require.main.require('crypto'),
  fs = require.main.require('fs'),
  cloudinary = require('cloudinary').v2,
  debug = require('debug')('nodebb-plugin-cloudstorage:library'),

  controllers = require('./lib/controllers')({cloudinary}),

  NodeBB_Controllers = require.main.require('./src/controllers'),
  NodeBB_Templates = require.main.require('benchpressjs');

let plugin = {};

plugin.controllers = controllers;

plugin.staticAppPreload = function(params, callback) {
  // params = { app, middleware }
  debug('--------- staticAppPreload ---------');
  callback();
}
plugin.staticAppLoad = function(data, callback) {
  // data = { app, router, middleware, controllers }
  debug('\n\n--------- staticAppLoad ---------n\n');
  data.router.get('/admin/plugins/cloudstorage', data.middleware.applyCSRF, data.middleware.admin.buildHeader, controllers.renderAdmin);
  data.router.get('/api/admin/plugins/cloudstorage', data.middleware.applyCSRF, controllers.renderAdmin);

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
    uid = params.uid,
    options = { phash: true };

  new Promise((resolve, reject) => {
    fs.readFile(image.path, (error, data) => {
      if (error) return reject(error);
      let etag = crypto.createHash('md5').update(data).digest('hex');
      resolve(etag);
    });
  })
  .then(etag => {
    return cloudinary.search
    .expression('tags=' + etag)
    .execute()
    .then(result => {
      return { etag, result };
    })
    .catch(error => {
      debug(error);
      throw(error);
    });
  })
  .then(p => {
    debugger
    if (p.result.total_count > 0) {
      let currentResource = p.result.resources[0];

      return callback(null, {
        url: true ? currentResource.url : currentResource.secure_url,
        name: currentResource.filename
      });
    }
    cloudinary.uploader.upload(image.path, Object.assign({ tags: p.etag }, options), (error, result) => {
      if (error) return callback(error);

      callback(null, {
        url: result.url,
        name: image.name || ''
      });
    });
  });
}

module.exports = plugin;