'use strict';

module.exports = routerConfig;

/**
 * Set up the default app routes
 */
// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
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

