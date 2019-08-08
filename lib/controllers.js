'use strict';

const debug = require('debug')('nodebb-plugin-cloudstorage:controller');

module.exports = function(deps) {
  const meta = require.main.require('./src/meta');

  const cloudinary = deps.cloudinary;
  let settings = {
    providerSettings: { 
      cloudinary: {
        config: {},
        options: {},
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
      }
    });
  })();

  function mergeSavedWithDefaults(saved) {
    Object.entries(settings.providerSettings).map(provider => {
      switch (provider[0]) {
        case ('cloudinary'):
          provider[1].config = {
            cloud_name: saved['cloudinary-cloudname'],
            api_key: saved['cloudinary-apikey'],
            api_secret: saved['cloudinary-secret']
          }
        case ('imagekit'):
          provider[1].config = {
            imagekitId: saved['imagekit-imagekit_id'],
            apiKey: saved['imagekit-public_key'],
            apiSecret: saved['imagekit-private_key']
          }
      }
    });
    return settings;
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
    }
  }
};