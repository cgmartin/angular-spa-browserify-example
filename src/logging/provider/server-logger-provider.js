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
        loggingLevel: LOG_LEVEL.ERROR,
        maxBufferSize: 100,
        batchSize: 0
    };

    this.configure = function(value) {
        angular.extend(loggerConfig, value);
    };

    this.$get = serverLoggerFactory;

    // @ngInject
    function serverLoggerFactory(session, traceService, $log, $window, config) {
        return new ServerLogger(loggerConfig, LOG_LEVEL, session, traceService, $log, $window, config);
    }
}
