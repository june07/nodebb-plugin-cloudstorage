'use strict'

import { save, load } from 'settings'
import * as alerts from 'alerts'

export function init() {
    const $form = $('.cloudstorage-settings') // jQuery object

    // Load existing settings
    load('cloudstorage', $('.cloudstorage-settings'), function (err) {
        if (err) {
            alerts.error(err?.message || err)
        }
    })

    // Save button
    $('#save').on('click', (e) => {
        e.preventDefault()

        console.log('Saving settings...', save)
        save('cloudstorage', $form, function (err) {
            if (err) {
                return alerts.error(err?.message || err)
            }
            alerts.success('Settings saved! Please reload NodeBB to apply changes.')
        })
    })
}
