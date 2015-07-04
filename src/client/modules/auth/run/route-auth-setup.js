'use strict';

module.exports = routeAuthSetup;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function routeAuthSetup(authService, $rootScope, $state) {

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
        var authCfg = toState.auth || {};

        if ((authCfg.authenticate || authCfg.authorize) && (!authService.isLoggedIn())) {
            // Not logged in
            event.preventDefault();
            $rootScope.$broadcast('$stateChangeUnauthenticated', toState, toParams);
        } else if (authCfg.authorize && !authService.isAuthorized(authCfg.authorize)) {
            // Not authorized
            event.preventDefault();
            $rootScope.$broadcast('$stateChangeUnauthorized', toState, toParams);
        }
    });

    $rootScope.$on('$stateChangeUnauthenticated', function(event, toState, toParams) {
        $state.go('login', {
            toState: toState,
            toStateParams: toParams
        });
    });
}
