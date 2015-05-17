/*jshint -W098 */
'use strict';

module.exports = exceptionHandlerOverride;

/**
 * Overrides the default exception handler with our custom handler(s)
 */
// @ngInject
function exceptionHandlerOverride(exceptionErrorRouteHandler, loggerExceptionHandler) {
    return error;

    function error(exception, cause) {
        loggerExceptionHandler(exception, cause);
        exceptionErrorRouteHandler(exception, cause);
    }
}
