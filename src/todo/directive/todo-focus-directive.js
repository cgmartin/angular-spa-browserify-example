'use strict';

module.exports = todoFocusDirective;

/**
 * Directive that places focus on the element it is applied to when the expression it binds to evaluates to true.
 */
// @ngInject
function todoFocusDirective($timeout) {
    return {
        link: function($scope, element, attributes) {
            $scope.$watch(attributes.todoFocus, function(newval) {
                if (newval) {
                    $timeout(function() { return element[0].focus(); }, 0, false);
                }
            });
        }
    };
}
