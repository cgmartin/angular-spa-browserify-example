'use strict';

module.exports = notificationsConfig;

/**
 * Configures the server logger from boot config values
 */
// @ngInject
function notificationsConfig(notificationsProvider, config) {
    // Enable/disable log debug flag
    var configOverrides = {};
    if (typeof config.notificationsMaximumOpen !== 'undefined') {
        configOverrides.maximumOpen = config.notificationsMaximumOpen;
    }
    if (typeof config.notificationsDuration !== 'undefined') {
        configOverrides.duration = config.notificationsDuration;
    }
    notificationsProvider.configure(configOverrides);
}
