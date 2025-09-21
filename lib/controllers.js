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
            s3: {
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
                if (!settings.providerSettings.s3.disabled) {
                    s3 = new AWS({
                        apiVersion: '2006-03-01',
                        accessKeyId: settings.providerSettings.s33.config.accessKeyId,
                        secretAccessKey: settings.providerSettings.s33.config.secretAccessKey,
                    })
                }

                if (!settings.providerSettings.github.disabled && settings.providerSettings.github.config?.token) {
                    github = new Octokit({ auth: settings.providerSettings.github.config.token })
                } else {
                    debug('GitHub provider not configured')
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
    async function saveMapping({ sha, downloadUrl, cdnUrl }) {
        const db = require.main.require('./src/database')
        const key = `cloudstorage:github:mapping:${sha}`
        const base64DownloadUrl = Buffer.from(downloadUrl).toString('base64')
        let path = `/cloudstorage/${sha}`

        try {
            // Update DB entry
            await db.setObject(key, {
                sha,
                downloadUrl,
                cdnUrl,
                lastModified: Date.now(),
            })
        } catch (err) {
            debug(`Error saving mapping: ${err}`)
        }

        return path + `?f=${base64DownloadUrl}`
    }
    function mergeSavedWithDefaults(saved) {
        debug('--------- saved settings ---------')
        debug(JSON.stringify(saved, null, 4))

        // Make a copy so defaults stay intact
        const merged = JSON.parse(JSON.stringify(settings))

        merged.providerSettings.github.config = {
            ...merged.providerSettings.github.config,
            activeProvider: merged.providerSettings.github.config.activeProvider || 'github',
            branch: merged.providerSettings.github.config.branch || 'main', // default branch
            originUrl: merged.providerSettings.github.config.originUrl || (merged.providerSettings.github.config.owner && merged.providerSettings.github.config.repo && `https://${merged.providerSettings.github.config.owner}.github.io/${merged.providerSettings.github.config.repo}`)
        }

        debug('--------- merged default settings ---------')
        debug(JSON.stringify(merged, null, 4))

        if (saved.activeProvider) merged.activeProvider = saved.activeProvider

        // Cloudinary
        if (saved['cloudinary-cloudname']) merged.providerSettings.cloudinary.config.cloud_name = saved['cloudinary-cloudname']
        if (saved['cloudinary-apikey']) merged.providerSettings.cloudinary.config.api_key = saved['cloudinary-apikey']
        if (saved['cloudinary-secret']) merged.providerSettings.cloudinary.config.api_secret = saved['cloudinary-secret']

        // ImageKit
        if (saved['imagekit-public_key']) merged.providerSettings.imagekit.config.publicKey = saved['imagekit-public_key']
        if (saved['imagekit-private_key']) merged.providerSettings.imagekit.config.privateKey = saved['imagekit-private_key']
        if (saved['imagekit-imagekit_id']) merged.providerSettings.imagekit.config.urlEndpoint = `https://ik.imagekit.io/${saved['imagekit-imagekit_id']}/`

        // AWS S3
        if (saved['s33-s33_bucket']) merged.providerSettings.s33.config.s33_bucket = saved['s33-s33_bucket']
        if (saved['s33-accessKeyId']) merged.providerSettings.s33.config.accessKeyId = saved['s33-accessKeyId']
        if (saved['s33-secretAccessKey']) merged.providerSettings.s33.config.secretAccessKey = saved['s33-secretAccessKey']
        if (saved['s33-cloudFrontDomainName']) merged.providerSettings.s33.options.cloudFrontDomainName = saved['s33-cloudFrontDomainName']

        // GitHub
        if (saved['github-token']) merged.providerSettings.github.config.token = saved['github-token']
        if (saved['github-owner']) merged.providerSettings.github.config.owner = saved['github-owner']
        if (saved['github-repo']) merged.providerSettings.github.config.repo = saved['github-repo']
        if (saved['github-path']) merged.providerSettings.github.config.path = saved['github-path']
        if (saved['github-branch']) merged.providerSettings.github.config.branch = saved['github-branch']
        if (saved['github-originUrl']) merged.providerSettings.github.config.originUrl = saved['github-originUrl']

        debug('--------- merged settings ---------')
        debug(JSON.stringify(merged, null, 4))

        return merged
    }

    return {
        loadSettings,
        renderAdmin: async function (req, res, next) {
            await loadSettings() // populate settings object

            debug('--------- renderAdmin ---------')
            debug(JSON.stringify(settings))

            // Precompute active flags for provider tabs
            for (const key in settings.providerSettings) {
                settings.providerSettings[key].isActive = (key === settings.activeProvider)
                debug(`Provider ${key} isActive: ${settings.providerSettings[key].isActive}`)
            }

            res.render('admin/plugins/cloudstorage', { title: 'Cloud Storage', settings })
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
                case 's33':
                    this.s33Upload(Object.assign(image, { fileObject }), fileObject.etag)
                        .then(result => {
                            callback(null, {
                                url: result.Location,
                                name: image.name || ''
                            })
                        })
                        .catch(error => {
                            debug(`Error in function providersUpload() s33: ${error.message}`)
                            callback(error)
                        }); break
                case 'github':
                    this.githubUpload(fileObject.data, fileObject.etag)
                        .then(async data => {
                            debug('GitHub upload result:', JSON.stringify(data, null, 2))

                            const { sha, name, download_url: downloadUrl, path } = data.content
                            const cdnUrl = settings.providerSettings.github.config.originUrl + '/' + path

                            const url = (await saveMapping({ sha, downloadUrl, cdnUrl })) || downloadUrl

                            callback(null, {
                                url,
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
        s33Upload: function (image) {
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
                    Bucket: settings.providerSettings.s33.config.s33_bucket,
                    Key: etag,
                    Body: imageFile,
                    ContentDisposition: image.headers['content-disposition'],
                    ContentType: image.headers['content-type']
                }
                s3.upload(params, function (err, data) {
                    if (err) return reject(err)

                    let cloudFrontDomainName = settings.providerSettings.s33.options.cloudFrontDomainName
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
            const options = {
                owner: settings.providerSettings.github.config.owner,
                repo: settings.providerSettings.github.config.repo,
                branch: settings.providerSettings.github.config.branch,
                path: fullyQualifiedPath,
                message: `Upload ${etag}`,
                content: file.toString('base64')
            }

            debug('Calling GitHub API:', JSON.stringify({ ...options, content: 'REDACTED' }, null, 4))

            try {
                const result = await github.repos.createOrUpdateFileContents(options)

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
                } else if (error.status === 404 && error?.response?.data?.message && /Branch.*not\sfound/i.test(error.response.data.message)) {
                    const branchName = options.branch
                    const owner = options.owner
                    const repo = options.repo

                    debug(`Branch "${branchName}" not found. Creating it...`)

                    // 1. Get the default branch SHA
                    const { data: repoData } = await github.repos.get({ owner, repo })
                    const defaultBranch = repoData.default_branch

                    const { data: refData } = await github.git.getRef({
                        owner,
                        repo,
                        ref: `heads/${defaultBranch}`,
                    })

                    // 2. Create the new branch
                    await github.git.createRef({
                        owner,
                        repo,
                        ref: `refs/heads/${branchName}`,
                        sha: refData.object.sha,
                    })

                    debug(`Branch "${branchName}" created. Retrying file upload...`)

                    // 3. Retry the file upload
                    const result = await github.repos.createOrUpdateFileContents(options)

                    debug('GitHub upload successful after creating branch:', JSON.stringify({ ...options, content: 'REDACTED' }, null, 4))

                    return result.data
                }

                throw error
            }
        }
    }
}
