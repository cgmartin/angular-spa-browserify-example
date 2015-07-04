'use strict';

module.exports = ifAuthenticatedDirective;

/**
 * Conditionally show an element if current session is authenticated
 *
 * Works in conjuction with the ngIf directive:
 *  http://stackoverflow.com/questions/20325480
 *
 * @ngInject
 */
function ifAuthenticatedDirective(authService, ngIfDirective) {
    var ngIf = ngIfDirective[0];

    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority - 1,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        link: function($scope, element, attr) {
            var isLoggedIn = function() {
                return authService.isLoggedIn();
            };

            var existingNgIf = attr.ngIf;
            var ifEval;
            if (existingNgIf) {
                ifEval = function() {
                    return $scope.$eval(existingNgIf) && isLoggedIn();
                };
            } else {
                ifEval = isLoggedIn;
            }
            attr.ngIf = ifEval;
            ngIf.link.apply(ngIf, arguments);
        }
    };
}
