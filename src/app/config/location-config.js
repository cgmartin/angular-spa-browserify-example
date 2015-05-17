'use strict';

module.exports = locationConfig;

/**
 * Configures the $locationProvider with html5Mode setting
 */
// @ngInject
function locationConfig($locationProvider, config) {
    $locationProvider.html5Mode(
        (config.isHtml5ModeEnabled !== undefined) ? config.isHtml5ModeEnabled : false
    );
}
