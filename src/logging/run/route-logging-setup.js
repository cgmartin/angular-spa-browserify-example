'use strict';

module.exports = routeLoggingSetup;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function routeLoggingSetup(serverLogger, traceService, $rootScope) {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.debug({
            message: 'route:start',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {url: toState.url, name: toState.name, params: toParams}
        });
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        serverLogger.error({
            message: 'route:notfound',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {name: unfoundState.to, params: unfoundState.toParams}
        });
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.info({
            message: 'route:success',
            from:    {url: fromState.url, name: fromState.name, params: fromParams},
            to:      {url: toState.url, name: toState.name, params: toParams}
        });
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        // use our traceService to generate a stack trace
        var stackTrace = traceService.print({e: error});

        serverLogger.error({
            message:    'route:error',
            error:      error.message,
            stackTrace: stackTrace,
            from:       {url: fromState.url, name: fromState.name, params: fromParams},
            to:         {url: toState.url, name: toState.name, params: toParams}
        });
    });
}
