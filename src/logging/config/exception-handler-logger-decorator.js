/*jshint -W098 */
'use strict';

module.exports = exceptionHandlerLoggerDecorator;

/**
 * Route to error state upon exception
 */
// @ngInject
function exceptionHandlerLoggerDecorator($provide) {
    $provide.decorator('$exceptionHandler', function($delegate, $injector) {
        return function error(exception, cause) {
            $delegate(exception, cause);

            // Send error to the server
            var serverLogger = $injector.get('serverLogger');
            serverLogger.trackError(exception);
        };
    });
}

