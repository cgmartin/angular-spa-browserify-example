'use strict';

module.exports = notificationsConfig;

/**
 * Configures the server logger from boot config values
 */
// @ngInject
function notificationsConfig(notificationsProvider, bootConfig) {
    // Enable/disable log debug flag
    var configOverrides = {};
    if (typeof bootConfig.notificationsMaximumOpen !== 'undefined') {
        configOverrides.maximumOpen = bootConfig.notificationsMaximumOpen;
    }
    if (typeof bootConfig.notificationsDuration !== 'undefined') {
        configOverrides.duration = bootConfig.notificationsDuration;
    }
    notificationsProvider.configure(configOverrides);
}
