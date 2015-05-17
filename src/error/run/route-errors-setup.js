/* jshint -W098 */
'use strict';

module.exports = routeErrorsSetup;

/**
 * Sets up event listeners on ui-router failures to route to error, 404, 500 states
 */
// @ngInject
function routeErrorsSetup($rootScope, $state, errorToDisplay) {

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        event.preventDefault();
        errorToDisplay.error = new Error('State not found: ' + unfoundState.to);
        $state.go('error', {}, {location: false, reload: true});
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        event.preventDefault();
        errorToDisplay.error = error;
        $state.go('error', {}, {location: false, reload: true});
    });
}
