'use strict';

module.exports = ifNotAuthorizedDirective;

/**
 * Conditionally show an element if current session is NOT authorized for a certain scope
 *
 * Works in conjuction with the ngIf directive:
 *  http://stackoverflow.com/questions/20325480
 *
 * @ngInject
 */
function ifNotAuthorizedDirective(authService, ngIfDirective) {
    var ngIf = ngIfDirective[0];

    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority - 1,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        link: function($scope, $element, $attr) {
            var authScope;
            $attr.$observe('ifAuthorized', function(value) {
                authScope = $scope.$eval(value);
            });

            var isNotAuthorized = function() {
                return !authService.isAuthorized(authScope);
            };

            var existingNgIf = $attr.ngIf;
            var ifEval;
            if (existingNgIf) {
                ifEval = function() {
                    return $scope.$eval(existingNgIf) && isNotAuthorized();
                };
            } else {
                ifEval = isNotAuthorized;
            }
            $attr.ngIf = ifEval;
            ngIf.link.apply(ngIf, arguments);
        }
    };
}
