'use strict';

module.exports = navConfig;

/**
 * Configures the navConfig provider
 */
// @ngInject
function navConfig(navConfigProvider, bootConfig) {
    navConfigProvider.configure({
        supportedLanguages: bootConfig.supportedLanguages || [],
    });
}
