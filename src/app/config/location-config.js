'use strict';

module.exports = locationConfig;

// @ngInject
function locationConfig($locationProvider, config) {
    $locationProvider.html5Mode(
        (config.isHtml5ModeEnabled !== undefined) ? config.isHtml5ModeEnabled : false
    );
}
