/*jshint -W098 */
'use strict';

module.exports = exceptionErrorRouteHandler;

/**
 * Route to error state upon exception
 */
// @ngInject
function exceptionErrorRouteHandler($injector, errorToDisplay) {
    return error;

    function error(exception, cause) {
        var $state = $injector.get('$state');
        errorToDisplay.error = exception;
        $state.go('error-exception', {}, {location: false, reload: true});
    }
}
