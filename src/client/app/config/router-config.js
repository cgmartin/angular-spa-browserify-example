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
        // Example views
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
        })

        // Example: Thrown error within a controller
        .state('throw-error', {
            url: '/throw-error',
            controller: function ThrowErrorController() {
                throw new Error('Error controller failure');
            }
        })
        // Example: Thrown error outside of angular
        .state('throw-non-angular-error', {
            url: '/throw-non-angular-error',
            controller: function ThrowNonAngularError() {
                setTimeout(function outsideAngular() {
                    throw new Error('Error from outside angular');
                });
            }
        })
        // Example: Thrown error during route resolve
        .state('throw-resolve-error', {
            url: '/throw-resolve-error',
            resolve: {
                error: function() { throw new Error('Error thrown in resolve'); }
            }
        });

    $urlRouterProvider.when('', '/');
}

