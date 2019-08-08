'use strict';

const debug = require('debug')('nodebb-plugin-cloudstorage:controller'),
  cloudinary = require('cloudinary').v2,
  ImageKit = require('imagekit');


module.exports = function() {
  const meta = require.main.require('./src/meta');

  let settings = {
    providerSettings: { 
      cloudinary: {
        config: {},
        options: { phash: true },
        deleteUnlinkedContent: false,
        logo: '/plugins/nodebb-plugin-cloudstorage/static/images/cloudinary_logo_for_white_bg.svg'
      },
      imagekit: {
        config: {},
        options: {},
        deleteUnlinkedContent: false,
        logo: '/plugins/nodebb-plugin-cloudstorage/static/images/imagekit_logo_black_rkS-BhflX.png'
      },
      imgur: {
        disabled: true,
        config: {},
        options: {},
        deleteUnlinkedContent: false,
        logo: '/plugins/nodebb-plugin-cloudstorage/static/images/imgur.svg'
      }
    }
  };

  (() => {
    meta.settings.get('cloudstorage', (error, savedSettings) => {
      if (error) return callback(error);
      if (savedSettings) {
        settings = mergeSavedWithDefaults(savedSettings);
        cloudinary.config(settings.providerSettings.cloudinary.config);
        debug('--------- saved settings ---------');
        debug(savedSettings);
        debug('--------- merged settings ---------');
        debug(JSON.stringify(settings));
        imagekit = new ImageKit(settings.providerSettings.imagekit.config);
      }
    });
  })();

  function mergeSavedWithDefaults(saved) {
    Object.entries(settings.providerSettings).map(provider => {
      switch (provider[0]) {
        case ('cloudinary'):
          return provider[1].config = {
            cloud_name: saved['cloudinary-cloudname'],
            api_key: saved['cloudinary-apikey'],
            api_secret: saved['cloudinary-secret']
          }
        case ('imagekit'):
          return provider[1].config = {
            imagekitId: saved['imagekit-imagekit_id'],
            apiKey: saved['imagekit-public_key'],
            apiSecret: saved['imagekit-private_key']
          }
      }
    });
    // Should remove the duplicates first.
    return Object.assign(settings, saved);
  }

  return {
    renderAdmin: function(req, res, next) {
      debug('--------- renderAdmin ---------');
      debug(settings);
      res.render('admin/plugins/cloudstorage', { settings });
    },
    renderAdminMenu: function(menu, callback) {
      menu.plugins.push({
        route: '/plugins/cloudstorage',
        icon: 'fa-picture-o',
        name: 'Cloud Storage'
      });
      callback(null, menu);
    },
    providersUpload: function(image, etag, callback) {
      debug('--------- providersUpload ---------');
      debug(settings);
      switch (settings.activeProvider) {
        case 'cloudinary':
          this.cloudinaryUpload(image, etag)
          .then(result => {
            callback(null, {
              url: result.url,
              name: image.name || ''
            });
          })
          .catch(error => {
            debug(error);
            callback(error);
          }); break;
        case 'imagekit':
          this.imagekitUpload();
          break;
      }
    },
    cloudinaryUpload: function(image, etag) {      
      return new Promise((resolve, reject) => {
        cloudinary.search
        .expression('tags=' + etag)
        .execute()
        .then(result => {
          if (result.total_count > 0) {
            let currentResource = result.resources[0];
            return resolve(currentResource);
          }
          cloudinary.uploader.upload(image.path, Object.assign({ tags: etag }, settings.providerSettings.cloudinary.options), (error, result) => {
            if (error) reject(error);
            resolve(result);
          });
        });
      });
    },
    imagekitUpload: function(image, etag) {
      return new Promise((resolve, reject) => {
        let encodedFile = fs.readFile(image.path, 'base64', function(error, response) {
          if (error) return reject(error);
          imagekit.upload(response, {
            'filename': etag,
            'folder': '/files'
          })
          .then(result => {
            resolve(result);
          }, error => {
            reject(error);
          });
        });
      });
    }
  }
};