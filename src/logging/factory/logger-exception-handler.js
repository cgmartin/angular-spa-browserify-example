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

        // use our traceService to generate a stack trace
        var stackTrace = traceService.print({e: exception});

        // use AJAX (in this example jQuery) and NOT
        // an angular service such as $http
        serverLogger.error({
            message:    exception.message,
            stackTrace: stackTrace
            //cause:      (cause || '')
        });
    }
}
