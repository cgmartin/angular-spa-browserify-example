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
        });

    $urlRouterProvider.otherwise(function($injector, $location) {
        var serverLogger = $injector.get('serverLogger');
        var $state = $injector.get('$state');

        var locationPath = $location.path();
        serverLogger.error('route:404 -> ' + locationPath, {
            type:    'route',
            event:   '404',
            from:    {url: $state.current.url, name: $state.current.name, params: $state.current.params},
            to:      {url: locationPath}
        });
        $state.go('error-404');
        return locationPath;
    });
}

