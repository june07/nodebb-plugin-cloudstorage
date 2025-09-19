'use strict'

const crypto = require.main.require('crypto'),
    fs = require.main.require('fs'),
    debug = require('debug')('nodebb-plugin-cloudstorage:library'),

    controllers = require('./lib/controllers')(),
    errorHandler = require('./lib/errorHandler'),

    NodeBB_Controllers = require.main.require('./src/controllers'),
    NodeBB_Templates = require.main.require('benchpressjs')

let plugin = {}

plugin.controllers = controllers
plugin.errorHandler = errorHandler

plugin.staticAppPreload = function (params, callback) {
    // params = { app, middleware }
    debug('--------- staticAppPreload ---------')

    callback()
}
plugin.staticAppLoad = function (data, callback) {
    // data = { app, router, middleware, controllers }
    debug('--------- staticAppLoad ---------')

    NodeBB_Templates.registerHelper('storageProviderHelper', (data, provider) => {
        // debug('--------- storageProviderHelper ---------', data, provider)
        return data === provider ? true : false
    })

    data.router.get('/admin/plugins/cloudstorage', data.middleware.applyCSRF, data.middleware.admin.buildHeader, controllers.renderAdmin)
    data.router.get('/api/admin/plugins/cloudstorage', data.middleware.applyCSRF, controllers.renderAdmin)
    data.router.get('/cloudstorage/:sha', async (req, res) => {
        debug('--------- /cloudstorage/:sha ---------', req.params)
        const sha = req.params.sha
        const now = Date.now()
        const freshnessWindow = 5 * 60 * 1000 // 5 minutes
        const db = require.main.require('./src/database')
        const key = `cloudstorage:github:mapping:${sha}`
        const cached = await db.getObject(key)

        if (!cached) {
            const fallback = req.query.f && Buffer.from(req.query.f, 'base64').toString('utf-8')

            if (fallback) {
                debug(`Redirecting to fallback URL: ${fallback}`)

                return res.redirect(fallback) // fallback URL
            } else {
                return res.status(404).send('File not found')
            }
        }

        let { cdnUrl, downloadUrl, lastChecked, useCdn } = cached
        lastChecked = parseInt(lastChecked, 10) || 0
        useCdn = useCdn || false

        // Check if we need to verify CDN
        if (!useCdn || now - lastChecked >= freshnessWindow) {
            try {
                const response = await fetch(cdnUrl, { method: 'HEAD' })
                if (response.ok) {
                    useCdn = true
                } else {
                    useCdn = false
                }
            } catch (err) {
                debug(`Error checking CDN URL: ${err}`)
                useCdn = false
            }

            // Update cached object
            await db.setObject(key, { ...cached, lastChecked: now, useCdn })
        }

        const url = useCdn ? cdnUrl : downloadUrl
        res.redirect(url)
    })

    controllers.loadSettings()

    //debug(params);
    callback()
}

plugin.filterUploadImage = function filterUploadImage(params, callback) {
    debug('--------- filterUploadImage ---------')
    const image = params.image

    new Promise((resolve, reject) => {
        fs.readFile(image.path, (error, data) => {
            if (error) return reject(error)
            const etag = crypto.createHash('md5').update(data).digest('hex')
            resolve({ data, etag })
        })
    })
        .then(fileObject => {
            controllers.providersUpload(image, fileObject, callback)
        })
}

module.exports = plugin
