'use strict';

if (process.env.NODE_ENV !== "production") {
  global.fiveo = require('../fiveo');
}

const debug = require('debug')('nodebb-plugin-cloudstorage:controller'),
  cloudinary = require('cloudinary').v2,
  ImageKit = require('imagekit'),
  AWS = require('aws-sdk/clients/s3');

let imagekit = null,
  s3 = null;

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
      awss3: {
        config: {},
        options: {
          cloudFrontDomainName: ''
        },
        deleteUnlinkedContent: false,
        logo: '/plugins/nodebb-plugin-cloudstorage/static/images/amazon-s3.svg',
        cloudFrontLogo: '/plugins/nodebb-plugin-cloudstorage/static/images/cloud-front-cdn.svg'
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

  function loadSettings() {
    meta.settings.get('cloudstorage', (error, savedSettings) => {
      if (error) return callback(error);
      if (savedSettings) {
        settings = mergeSavedWithDefaults(savedSettings);
        cloudinary.config(settings.providerSettings.cloudinary.config);
        debug('--------- saved settings ---------');
        debug(JSON.stringify(savedSettings));
        debug('--------- merged settings ---------');
        debug(JSON.stringify(settings));
        try {
          imagekit = new ImageKit(settings.providerSettings.imagekit.config);
        } catch(error) {
          debug(`Error in function loadSettings(): ${error}`);
        }
        if (! settings.providerSettings.awss3.disabled) s3 = new AWS({
          apiVersion: '2006-03-01',
          accessKeyId: settings.providerSettings.awss3.config.accessKeyId,
          secretAccessKey: settings.providerSettings.awss3.config.secretAccessKey
        });
      }
    });
  }

  function mergeSavedWithDefaults(saved) {
    Object.entries(settings.providerSettings).map(provider => {
      switch (provider[0]) {
        case ('cloudinary'):
          provider[1].config = {
            cloud_name: saved['cloudinary-cloudname'],
            api_key: saved['cloudinary-apikey'],
            api_secret: saved['cloudinary-secret']
          }; break;
        case ('imagekit'):
          provider[1].config = {
            publicKey: saved['imagekit-public_key'],
            privateKey: saved['imagekit-private_key'],
            urlEndpoint: 'https://ik.imagekit.io/' + saved['imagekit-imagekit_id'] + '/'
          }; break;
        case ('awss3'):
          provider[1].config = {
            awss3_bucket: saved['awss3-awss3_bucket'],
            accessKeyId: saved['awss3-accessKeyId'],
            secretAccessKey: saved['awss3-secretAccessKey'],
          }
          provider[1].options = {
            cloudFrontDomainName: saved['awss3-cloudFrontDomainName']
          }; break;
      }
    });
    // Should remove the duplicates first.
    return Object.assign(settings, saved);
  }

  return {
    loadSettings,
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
    providersUpload: function(image, fileObject, callback) {
      debug('--------- providersUpload ---------');
      debug(settings);
      let etag = fileObject.etag,
        imageFile = fileObject.data;
        
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
            debug(`Error in function providersUpload() cloudinary: ${error.message}`);
            let message = error.message || error;
            if (message === 'disabled account') {
              message = 'The ' + settings.activeProvider + ' account is disabled.';
            }
            callback(error);
          }); break;
        case 'imagekit':
          this.imagekitUpload(imageFile, etag)
          .then(result => {
            callback(null, {
              url: result.url,
              name: image.name || ''
            });
          })
          .catch(error => {
            debug(`Error in function providersUpload() imagekit: ${error.message}`);
            callback(error);
          }); break;
        case 'awss3':
          this.awss3Upload(Object.assign(image, { fileObject }), etag)
          .then(result => {
            callback(null, {
              url: result.Location,
              name: image.name || ''
            });
          })
          .catch(error => {
            debug(`Error in function providersUpload() awss3: ${error.message}`);
            callback(error);
          }); break;
      }
    },
    cloudinaryUpload: function(image, etag) {      
      return new Promise((resolve, reject) => {
        cloudinary.search
        .expression('tags=' + etag)
        .execute({}, callback => {
          debug(callback);
          if (callback && callback.http_code && callback.http_code.toString().match(/4[0-9][0-9]/)) {
            return reject(callback.message);
          }
        })
        .then((result, something) => {
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
    imagekitUpload: function(imageFile, etag) {
      return new Promise((resolve, reject) => {
        imagekit.upload({
            'file': imageFile.toString('base64'),
          'fileName': etag,
          'folder': '/files'
        })
        .then(result => {
          resolve(result);
        }, error => {
          reject(error);
        });
      });
    },
    awss3Upload: function(image) {
      let imageFile = image.fileObject.data,
        etag = image.fileObject.etag;
      if (!image.headers) {
        const ext = image.path.split('.')[1];
        image.headers = {
          'content-disposition': 'attachment',
          'content-type': `image/${ext}`
        };
      }

      return new Promise((resolve, reject) => {
        var params = {
          ACL: 'public-read',
          Bucket: settings.providerSettings.awss3.config.awss3_bucket,
          Key: etag,
          Body: imageFile,
          ContentDisposition: image.headers['content-disposition'],
          ContentType: image.headers['content-type']
        };
        s3.upload(params, function(err, data) {
          if (err) return reject(err);

          let cloudFrontDomainName = settings.providerSettings.awss3.options.cloudFrontDomainName;
          data.Location = (cloudFrontDomainName) ? '//' + cloudFrontDomainName + '/' + data.Key: data.Location;
          resolve(data);
        });
      });
    }
  }
};
