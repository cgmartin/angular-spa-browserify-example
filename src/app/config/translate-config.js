'use strict';

require('angular-translate');
require('angular-translate/dist/angular-translate-loader-static-files/angular-translate-loader-static-files');

module.exports = translateConfig;

// @ngInject
function translateConfig($translateProvider, config) {
    $translateProvider.preferredLanguage(config.preferredLanguage || 'en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useStaticFilesLoader({
        prefix: '/lang/',
        suffix: '.json'
    });
    $translateProvider.useStorage('translateStorage');
}
