'use strict';

module.exports = ifNotAuthenticatedDirective;

/**
 * Conditionally show an element if current session is NOT authenticated
 *
 * Works in conjuction with the ngIf directive:
 *  http://stackoverflow.com/questions/20325480
 *
 * @ngInject
 */
function ifNotAuthenticatedDirective(authService, ngIfDirective) {
    var ngIf = ngIfDirective[0];

    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority - 1,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        link: function($scope, element, attr) {
            var isNotLoggedIn = function() {
                return !authService.isLoggedIn();
            };

            var existingNgIf = attr.ngIf;
            var ifEval;
            if (existingNgIf) {
                ifEval = function() {
                    return $scope.$eval(existingNgIf) && isNotLoggedIn();
                };
            } else {
                ifEval = isNotLoggedIn;
            }
            attr.ngIf = ifEval;
            ngIf.link.apply(ngIf, arguments);
        }
    };
}
