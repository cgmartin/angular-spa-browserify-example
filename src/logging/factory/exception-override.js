'use strict';

module.exports = exceptionOverride;

// @ngInject
function exceptionOverride($log, traceService, serverLogger) {
    return error;

    function error(exception, cause) {

        // preserve the default behaviour which will log the error
        // to the console, and allow the application to continue running.
        $log.error.apply($log, arguments);

        // now try to log the error to the server side.
        try {
            var errorMessage = exception.toString();

            // use our traceService to generate a stack trace
            var stackTrace = traceService.print({e: exception});

            // use AJAX (in this example jQuery) and NOT
            // an angular service such as $http
            serverLogger.logToServer({
                message:    errorMessage,
                type:       'exception',
                stackTrace: stackTrace,
                cause:      (cause || '')
            });

        } catch (loggingError) {
            $log.warn('Error server-side logging failed');
            $log.log(loggingError);
        }
    }
}
