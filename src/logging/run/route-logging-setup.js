'use strict';

module.exports = routeLoggingSetup;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function routeLoggingSetup(serverLogger, traceService, $rootScope) {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.debug('route:start -> ' + toState.url + ' (' + toState.name + ')', {
            type:    'route',
            event:   'start',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {url: toState.url, name: toState.name, params: toParams}
        });
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        serverLogger.error('route:notFound -> ' + unfoundState.to, {
            type:    'route',
            event:   'notfound',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {name: unfoundState.to, params: unfoundState.toParams}
        });
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.info('route:success -> ' + toState.url + ' (' + toState.name + ')', {
            type:    'route',
            event:   'success',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {url: toState.url, name: toState.name, params: toParams}
        });
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        serverLogger.error('route:error -> ' + toState.url + ' (' + toState.name + ')', {
            type:  'route',
            event: 'error',
            error: {
                message: error.message,
                stack:   traceService.print({e: error}),
                name:    error.name,
                data:    error.data
            },
            from:  {url: fromState.url, name: fromState.name, params: fromParams},
            to:    {url: toState.url, name: toState.name, params: toParams}
        });
    });
}
