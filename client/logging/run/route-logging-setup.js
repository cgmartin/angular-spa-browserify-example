'use strict';

module.exports = routeLoggingSetup;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function routeLoggingSetup(serverLogger, $rootScope, $timeout) {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.trackStateChange('debug', 'start', toState, toParams, fromState, fromParams);
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        serverLogger.trackStateChange('error', 'notFound',
            {name: unfoundState.to}, unfoundState.toParams, fromState, fromParams);
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        $timeout(function() {
            serverLogger.trackStateChange('info', 'success', toState, toParams, fromState, fromParams);
        });
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        serverLogger.trackStateChange('error', 'error', toState, toParams, fromState, fromParams);
        serverLogger.trackError(error);
    });
}
