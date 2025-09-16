'use strict'

const debug = require('debug')('nodebb-plugin-cloudstorage:controller'),
    cloudinary = require('cloudinary').v2,
    ImageKit = require('imagekit'),
    AWS = require('aws-sdk/clients/s3')
const { Octokit } = require('@octokit/rest')

let imagekit = null,
    s3 = null,
    github = null,
    fileTypeFromBuffer = null

module.exports = function () {
    let settings = {
        providerSettings: {
            github: {
                config: {},
                options: {},
                deleteUnlinkedContent: false,
                logo: '/plugins/nodebb-plugin-cloudstorage/static/images/github.svg'
            },
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
    }

    async function loadSettings() {
        try {
            // Use async/await style
            const meta = require.main.require('./src/meta')
            const { promisify } = require('util')
            const getSettingsAsync = promisify(meta.settings.get).bind(meta.settings)
            const savedSettings = await getSettingsAsync('cloudstorage')

            debug('--------- saved settings ---------', meta.settings)
            debug(JSON.stringify(savedSettings))

            if (savedSettings) {
                settings = mergeSavedWithDefaults(savedSettings)

                debug('--------- merged settings ---------')
                debug(JSON.stringify(settings))
                // Initialize providers
                if (!settings.providerSettings.awss3.disabled) {
                    s3 = new AWS({
                        apiVersion: '2006-03-01',
                        accessKeyId: settings.providerSettings.awss3.config.accessKeyId,
                        secretAccessKey: settings.providerSettings.awss3.config.secretAccessKey,
                    })
                }

                if (!settings.providerSettings.github.disabled && savedSettings['github-token']) {
                    github = new Octokit({ auth: savedSettings['github-token'] })
                }

                if (!settings.providerSettings.imagekit.disabled && savedSettings['imagekit-public_key']) {
                    try {
                        imagekit = new ImageKit(settings.providerSettings.imagekit.config)
                    } catch (err) {
                        debug(`Error initializing ImageKit: ${err}`)
                    }
                }

                if (!settings.providerSettings.cloudinary.disabled && savedSettings['cloudinary-cloudname']) {
                    cloudinary.config(settings.providerSettings.cloudinary.config)
                }
            }

            return settings
        } catch (err) {
            debug(`Error loading cloudstorage settings: ${err}`)
            return {}
        }
    }

    function mergeSavedWithDefaults(saved) {
        debug('--------- saved settings ---------')
        debug(JSON.stringify(saved))

        // Make a copy so defaults stay intact
        const merged = JSON.parse(JSON.stringify(settings))

        if (saved.activeProvider) merged.activeProvider = saved.activeProvider
        else merged.activeProvider = 'github' // default

        // Cloudinary
        if (saved['cloudinary-cloudname']) merged.providerSettings.cloudinary.config.cloud_name = saved['cloudinary-cloudname']
        if (saved['cloudinary-apikey']) merged.providerSettings.cloudinary.config.api_key = saved['cloudinary-apikey']
        if (saved['cloudinary-secret']) merged.providerSettings.cloudinary.config.api_secret = saved['cloudinary-secret']

        // ImageKit
        if (saved['imagekit-public_key']) merged.providerSettings.imagekit.config.publicKey = saved['imagekit-public_key']
        if (saved['imagekit-private_key']) merged.providerSettings.imagekit.config.privateKey = saved['imagekit-private_key']
        if (saved['imagekit-imagekit_id']) merged.providerSettings.imagekit.config.urlEndpoint = `https://ik.imagekit.io/${saved['imagekit-imagekit_id']}/`

        // AWS S3
        if (saved['awss3-awss3_bucket']) merged.providerSettings.awss3.config.awss3_bucket = saved['awss3-awss3_bucket']
        if (saved['awss3-accessKeyId']) merged.providerSettings.awss3.config.accessKeyId = saved['awss3-accessKeyId']
        if (saved['awss3-secretAccessKey']) merged.providerSettings.awss3.config.secretAccessKey = saved['awss3-secretAccessKey']
        if (saved['awss3-cloudFrontDomainName']) merged.providerSettings.awss3.options.cloudFrontDomainName = saved['awss3-cloudFrontDomainName']

        // GitHub
        if (saved['github-token']) merged.providerSettings.github.config.token = saved['github-token']
        if (saved['github-owner']) merged.providerSettings.github.config.owner = saved['github-owner']
        if (saved['github-repo']) merged.providerSettings.github.config.repo = saved['github-repo']
        if (saved['github-path']) merged.providerSettings.github.config.path = saved['github-path']
        if (saved['github-originUrl']) merged.providerSettings.github.config.originUrl = saved['github-originUrl']
        else merged.providerSettings.github.config.originUrl = `https://${merged.providerSettings.github.config.owner}.github.io/${merged.providerSettings.github.config.repo}`

        return merged
    }

    return {
        loadSettings,
        renderAdmin: async function (req, res, next) {
            await loadSettings() // populate settings object
            debug('--------- renderAdmin ---------')
            debug(JSON.stringify(settings))
            res.render('admin/plugins/cloudstorage', { settings })
        },
        renderAdminMenu: function (menu, callback) {
            menu.plugins.push({
                route: '/plugins/cloudstorage',
                icon: 'fa-picture-o',
                name: 'Cloud Storage'
            })
            callback(null, menu)
        },
        providersUpload: function (image, fileObject, callback) {
            debug('--------- providersUpload ---------', image, { ...fileObject, data: undefined })
            debug(settings.activeProvider)

            switch (settings.activeProvider) {
                case 'cloudinary':
                    this.cloudinaryUpload(image, fileObject.etag)
                        .then(result => {
                            callback(null, {
                                url: result.url,
                                name: image.name || ''
                            })
                        })
                        .catch(error => {
                            debug(`Error in function providersUpload() cloudinary: ${error.message}`)
                            let message = error.message || error
                            if (message === 'disabled account') {
                                message = 'The ' + settings.activeProvider + ' account is disabled.'
                            }
                            callback(error)
                        }); break
                case 'imagekit':
                    this.imagekitUpload(fileObject.data, fileObject.etag)
                        .then(result => {
                            callback(null, {
                                url: result.url,
                                name: image.name || ''
                            })
                        })
                        .catch(error => {
                            debug(`Error in function providersUpload() imagekit: ${error.message}`)
                            callback(error)
                        }); break
                case 'awss3':
                    this.awss3Upload(Object.assign(image, { fileObject }), fileObject.etag)
                        .then(result => {
                            callback(null, {
                                url: result.Location,
                                name: image.name || ''
                            })
                        })
                        .catch(error => {
                            debug(`Error in function providersUpload() awss3: ${error.message}`)
                            callback(error)
                        }); break
                case 'github':
                    this.githubUpload(fileObject.data, fileObject.etag)
                        .then(data => {
                            debug('GitHub upload result:', JSON.stringify(data, null, 2))

                            const { name, download_url: downloadUrl, path } = data.content

                            callback(null, {
                                url: settings.providerSettings.github.config.originUrl + '/' + path,
                                path: downloadUrl,
                                name: name || ''
                            })
                        })
                        .catch(error => {
                            debug(`Error in function providersUpload() github: ${error.message}`)
                            callback(error)
                        })
                    break
            }
        },
        cloudinaryUpload: function (image, etag) {
            return new Promise((resolve, reject) => {
                cloudinary.search
                    .expression('tags=' + etag)
                    .execute({}, callback => {
                        debug(callback)
                        if (callback && callback.http_code && callback.http_code.toString().match(/4[0-9][0-9]/)) {
                            return reject(callback.message)
                        }
                    })
                    .then((result, something) => {
                        if (result.total_count > 0) {
                            let currentResource = result.resources[0]
                            return resolve(currentResource)
                        }
                        cloudinary.uploader.upload(image.path, Object.assign({ tags: etag }, settings.providerSettings.cloudinary.options), (error, result) => {
                            if (error) reject(error)
                            resolve(result)
                        })
                    })
            })
        },
        imagekitUpload: function (imageFile, etag) {
            return new Promise((resolve, reject) => {
                imagekit.upload({
                    'file': imageFile.toString('base64'),
                    'fileName': etag,
                    'folder': '/files'
                })
                    .then(result => {
                        resolve(result)
                    }, error => {
                        reject(error)
                    })
            })
        },
        awss3Upload: function (image) {
            let imageFile = image.fileObject.data,
                etag = image.fileObject.etag
            if (!image.headers) {
                const ext = image.path.split('.')[1]
                image.headers = {
                    'content-disposition': 'attachment',
                    'content-type': `image/${ext}`
                }
            }

            return new Promise((resolve, reject) => {
                var params = {
                    ACL: 'public-read',
                    Bucket: settings.providerSettings.awss3.config.awss3_bucket,
                    Key: etag,
                    Body: imageFile,
                    ContentDisposition: image.headers['content-disposition'],
                    ContentType: image.headers['content-type']
                }
                s3.upload(params, function (err, data) {
                    if (err) return reject(err)

                    let cloudFrontDomainName = settings.providerSettings.awss3.options.cloudFrontDomainName
                    data.Location = (cloudFrontDomainName) ? '//' + cloudFrontDomainName + '/' + data.Key : data.Location
                    resolve(data)
                })
            })
        },
        githubUpload: async function (file, etag) {
            if (!github) return Promise.reject(new Error('GitHub provider not configured'))

            let path = settings.providerSettings.github.config.path || 'uploads/' // or derive extension dynamically

            // Ensure path ends with a single trailing slash
            if (!path.endsWith('/')) {
                path += '/'
            }

            // Detect file type from buffer
            if (!fileTypeFromBuffer) {
                const module = await import('file-type')
                fileTypeFromBuffer = module.fileTypeFromBuffer
            }
            const type = await fileTypeFromBuffer(file)
            const extension = type ? type.ext : 'bin' // fallback if type not detected
            const fullyQualifiedPath = `${path}${etag}-${Date.now()}.${extension}`

            try {
                const result = await github.repos.createOrUpdateFileContents({
                    owner: settings.providerSettings.github.config.owner,
                    repo: settings.providerSettings.github.config.repo,
                    path: fullyQualifiedPath,
                    message: `Upload ${etag}`,
                    content: file.toString('base64')
                })
                debug('GitHub upload successful:', JSON.stringify(result))

                return result.data
            } catch (error) {
                debug('GitHub upload error:', error)

                // If file already exists (422), fetch the existing file and return it
                if (error.status === 422) {
                    try {
                        const existing = await github.repos.getContent({
                            owner: settings.providerSettings.github.config.owner,
                            repo: settings.providerSettings.github.config.repo,
                            path: fullyQualifiedPath,
                        })

                        debug('Fetched existing file from GitHub')

                        return existing.data
                    } catch (fetchErr) {
                        debug('Error fetching existing file:', fetchErr)
                        throw fetchErr
                    }
                }

                throw error
            }
        }
    }
}
