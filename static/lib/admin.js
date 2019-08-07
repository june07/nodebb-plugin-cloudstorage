'use strict';
/* globals $, app, socket */

define('admin/plugins/cloudstorage', ['settings', 'benchpress'], function (Settings, templates) {

	var ACP = {};

	ACP.init = function () {
		Settings.load('cloudstorage', $('.cloudstorage-settings'), (err, stuff) => {
        });

		$('#save').on('click', function () {
			Settings.save('cloudstorage', $('.cloudstorage-settings'), function () {
				app.alert({
					type: 'success',
					alert_id: 'cloudstorage-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function () {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};
    
    $(document).ready(function() {
        templates.registerHelper('storageProviderHelper', function(data, provider) {
            console.log('--------- storageProviderHelper ---------');
            return data === provider ? true : false;
        });
    });

	return ACP;
});