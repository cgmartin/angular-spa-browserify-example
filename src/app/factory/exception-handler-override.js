/*jshint -W098 */
'use strict';

module.exports = exceptionHandlerOverride;

/**
 * Overrides the default exception handler with our custom handler(s)
 */
// @ngInject
function exceptionHandlerOverride(exceptionErrorRouteHandler, loggerExceptionHandler, $log) {
    return error;

    // TODO: Use decorator for $exceptionHandler, instead of replacement
    function error(exception, cause) {
        // Catch any errors here so as not to cause infinite exception loops
        try {
            loggerExceptionHandler(exception, cause);
            exceptionErrorRouteHandler(exception, cause);
        } catch (ex) {
            $log.error(ex);
        }
    }
}
