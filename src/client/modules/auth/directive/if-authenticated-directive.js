'use strict';

module.exports = ifAuthenticatedDirective;

/**
 * Conditionally show an element if current session is authenticated
 *
 * @ngInject
 */
function ifAuthenticatedDirective(authService, $rootScope) {
    return {
        link: function($scope, element) {
            $rootScope.$watch(authService.isLoggedIn, function(isLoggedIn) {
                if (isLoggedIn) {
                    element.show();
                } else {
                    element.hide();
                }
            });
        }
    };
}
