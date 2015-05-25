/*jshint -W098 */
'use strict';

module.exports = exceptionHandlerRouterDecorator;

/**
 * Route to error state upon exception
 */
// @ngInject
function exceptionHandlerRouterDecorator($provide) {
    $provide.decorator('$exceptionHandler', function($delegate, $injector) {
        return function error(exception, cause) {
            var errorToDisplay = $injector.get('errorToDisplay');
            var $state = $injector.get('$state');
            errorToDisplay.error = exception;
            $state.go('error', {}, {location: false, reload: true});

            $delegate(exception, cause);
        };
    });
}

