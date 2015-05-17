'use strict';

module.exports = routeLoggingSetup;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function routeLoggingSetup(serverLogger, $rootScope) {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.debug(
            'Route state change start,' +
            ' from: ' + fromState.url + ' [' + fromState.name + '] ' + JSON.stringify(fromParams) +
            ' to: ' + toState.url + ' [' + toState.name + '] ' + JSON.stringify(toParams)
        );
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        serverLogger.error(
            'Route state change not found,' +
            ' from: ' + fromState.url + ' [' + fromState.name + '] ' + JSON.stringify(fromParams) +
            ' to: [' + unfoundState.to + '] ' + JSON.stringify(unfoundState.toParams)
        );
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        serverLogger.info(
            'Route state change success,' +
            ' from: ' + fromState.url + ' [' + fromState.name + '] ' + JSON.stringify(fromParams) +
            ' to: ' + toState.url + ' [' + toState.name + '] ' + JSON.stringify(toParams)
        );
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        serverLogger.error(
            'Route state change error "' + error + '"' +
            ' from: ' + fromState.url + ' [' + fromState.name + '] ' + JSON.stringify(fromParams) +
            ' to: ' + toState.url + ' [' + toState.name + '] ' + JSON.stringify(toParams)
        );
    });
}
