'use strict';

var homePartial = require('./home.partial.html');
var homeController = require('./home-controller');

module.exports = homeRouterConfig;

/**
 * Set up the home route(s)
 */
// @ngInject
function homeRouterConfig($stateProvider) {
    $stateProvider
        // Example views
        .state('home', {
            url: '/',
            templateUrl: homePartial.name,
            controller: homeController
        });
}

