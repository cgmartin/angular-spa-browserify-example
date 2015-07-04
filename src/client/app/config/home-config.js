'use strict';

module.exports = navConfig;

/**
 * Configures the navConfig provider
 */
// @ngInject
function navConfig(homeConfigProvider, bootConfig) {
    homeConfigProvider.configure({
        appVersion: bootConfig.version || '0.0.0',
    });
}
