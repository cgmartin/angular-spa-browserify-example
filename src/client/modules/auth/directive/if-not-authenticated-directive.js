'use strict';

module.exports = ifNotAuthenticatedDirective;

/**
 * Conditionally show an element if current session is NOT authenticated
 *
 * @ngInject
 */
function ifNotAuthenticatedDirective(authService, $rootScope) {
    return {
        link: function($scope, element) {
            $rootScope.$watch(authService.isLoggedIn, function(isLoggedIn) {
                if (isLoggedIn) {
                    element.hide();
                } else {
                    element.show();
                }
            });
        }
    };
}
