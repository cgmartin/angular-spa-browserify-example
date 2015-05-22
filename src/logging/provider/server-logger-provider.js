'use strict';

var angular = require('angular');
var ServerLogger = require('../service/server-logger');

module.exports = ServerLoggerProvider;

/**
 * Configures the serverLogger service
 */
// @ngInject
function ServerLoggerProvider() {
    var LOG_LEVEL = this.LOG_LEVEL = {
        ERROR: 3,
        INFO:  2,
        DEBUG: 1
    };

    var loggerConfig = {
        appVersion: null,
        isLoggingEnabled: true,
        loggingLevel: LOG_LEVEL.INFO,
        loggingInterval: 120000,
        maxBufferSize: 1000,
        apiBaseUrl: '',
        isStubsEnabled: false,
        isConsoleLogEnabled: false,

        // Log types that can be filtered/excluded...
        //   ''           : no-type
        //   'exception'  : app errors
        //   'globalError': global errors
        //   'ajax'       : http requests
        //   'route'      : route changes
        //   'event'      : tracking events
        //   'metric'     : tracking metrics
        //   'input'      : clicks and field inputs
        excludeTypes: []
    };

    this.configure = function(value) {
        angular.extend(loggerConfig, value);
    };

    this.$get = serverLoggerFactory;

    // @ngInject
    function serverLoggerFactory(session, traceService, $locale, $translate, $log, $window) {
        return new ServerLogger(
            loggerConfig, LOG_LEVEL, session, traceService, $locale, $translate, $log, $window
        );
    }
}
