'use strict';

require('angular-ui-router');
var partials = require('../partials');

module.exports = routerConfig;

/**
 * Configures router states for exception, 404, and 500 errors
 */
// @ngInject
function routerConfig($stateProvider) {
    $stateProvider
        // unhandled errors and exceptions
        .state('login', {
            url: '/login',
            templateUrl: partials.login.name,
            controller: 'loginController'
        });
}

