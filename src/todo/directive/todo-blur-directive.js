'use strict';

module.exports = todoBlurDirective;
/**
 * Directive that executes an expression when the element it is applied to loses focus.
 */
function todoBlurDirective() {
    return {
        link: function($scope, element, attributes) {
            element.bind('blur', function() { $scope.$apply(attributes.todoBlur); });
            $scope.$on('$destroy', function() { element.unbind('blur'); });
        }
    };
}
