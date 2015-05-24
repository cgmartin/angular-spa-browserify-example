'use strict';

module.exports = locationConfig;

/**
 * Configures the $locationProvider with html5Mode setting
 */
// @ngInject
function locationConfig($locationProvider, bootConfig) {
    $locationProvider.html5Mode(
        (bootConfig.isHtml5ModeEnabled !== undefined) ? bootConfig.isHtml5ModeEnabled : false
    );
}
