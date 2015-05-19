/*jshint -W098 */
'use strict';

module.exports = loggerExceptionHandler;

/**
 * Log exceptions to the server
 */
// @ngInject
function loggerExceptionHandler($log, traceService, serverLogger) {
    return error;

    function error(exception, cause) {
        // preserve the default behaviour which will log the error
        // to the console, and allow the application to continue running.
        $log.error.apply($log, arguments);

        // use AJAX (in this example jQuery) and NOT
        // an angular service such as $http
        serverLogger.error(exception.message, {
            type:    'exception',
            message: exception.message,
            stack:   traceService.print({e: exception}),
            name:    exception.name,
            data:    exception.data
            //cause:   (cause || '')
        });
    }
}
