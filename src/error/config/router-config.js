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
        // unhandled errors and exceptions
        .state('error', {
            templateUrl: partials.error.name,
            controller: 'errorController'
        })
        // page not found
        .state('error-404', {
            templateUrl: partials.error404.name
        })
        // Example: Thrown error within a controller
        .state('throw-error', {
            url: '/throw-error',
            controller: function ThrowErrorController() {
                throw new Error('Error controller failure');
            }
        })
        // Example: Thrown error during route resolve
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
