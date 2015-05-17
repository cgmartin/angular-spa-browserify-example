'use strict';

require('angular-ui-router');
var partials = require('../partials');

module.exports = routerConfig;

/**
 * Set up the default app routes
 */
// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: partials.home.name
        })
        .state('login', {
            url: '/login',
            templateUrl: partials.login.name
        })
        .state('chat', {
            url: '/chat',
            templateUrl: partials.chat.name
        });

    $urlRouterProvider.when('', '/');
}

