'use strict';

require('angular-translate');
require('angular-translate/dist/angular-translate-loader-static-files/angular-translate-loader-static-files');

module.exports = translateConfig;

/**
 * Configures the $translateProvider with language settings
 */
// @ngInject
function translateConfig($translateProvider, bootConfig) {
    $translateProvider.preferredLanguage(bootConfig.preferredLanguage || 'en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useStaticFilesLoader({
        prefix: '/lang/',
        suffix: '.json'
    });
    $translateProvider.useStorage('translateStorage');
}
