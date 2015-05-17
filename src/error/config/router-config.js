'use strict';

require('angular-ui-router');
var partials = require('../partials');

module.exports = routerConfig;

/**
 * Configures router states for exception, 404, and 500 errors
 */
// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('error', {
            templateUrl: partials.error.name,
            controller: 'errorController'
        })
        .state('error-exception', {
            templateUrl: partials.error.name,
            controller: 'errorController'
        })
        .state('error-404', {
            templateUrl: partials.error404.name
        })
        .state('throw-error', {
            url: '/throw-error',
            controller: function ThrowErrorController() {
                throw new Error('Error controller failure');
            }
        })
        .state('throw-resolve-error', {
            url: '/throw-resolve-error',
            resolve: {
                error: function() { throw new Error('Error thrown in resolve'); }
            }
        });

    $urlRouterProvider.otherwise(function($injector, $location) {
        var $state = $injector.get('$state');
        $state.go('error-404');
        return $location.path();
    });
}

