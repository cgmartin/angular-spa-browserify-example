'use strict';

module.exports = ifAuthorizedDirective;

/**
 * Conditionally show an element if current session is authenticated
 *
 * @ngInject
 */
function ifAuthorizedDirective(authService, $rootScope, $parse) {
    return {
        link: function($scope, element, attrs) {
            var attrExpr = attrs.ifAuthorized;
            var authScope;

            function hideShowElement(user) {
                if (user && authService.isAuthorized(authScope)) {
                    element.show();
                } else {
                    element.hide();
                }
            }

            if (attrExpr) {
                $scope.$watch($parse(attrExpr), function(value) {
                    authScope = value;
                    hideShowElement(authService.getLoggedInUser());
                });

                $rootScope.$watch(authService.getLoggedInUser, function(user) {
                    hideShowElement(user);
                });
            }
        }
    };
}
