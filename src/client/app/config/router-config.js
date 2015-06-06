'use strict';

require('angular-ui-router');
var partials = require('../partials');
var homeController = require('../controller/home-controller');

module.exports = routerConfig;

/**
 * Set up the default app routes
 */
// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: partials.home.name,
            controller: homeController
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

