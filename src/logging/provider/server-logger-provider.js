'use strict';

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

    var serverLoggingLevel = LOG_LEVEL.ERROR;

    this.loggingLevel = function(value) {
        serverLoggingLevel = value;
    };

    this.$get = serverLoggerFactory;

    // @ngInject
    function serverLoggerFactory(session, $log, $window, config) {
        return new ServerLogger(serverLoggingLevel, LOG_LEVEL, session, $log, $window, config);
    }
}
