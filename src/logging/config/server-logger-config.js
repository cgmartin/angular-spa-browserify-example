'use strict';

module.exports = serverLoggerConfig;

// @ngInject
function serverLoggerConfig(serverLoggerProvider, config) {
    // Enable/disable log debug flag
    if (typeof config.serverLoggingLevel !== 'undefined') {
        serverLoggerProvider.loggingLevel(config.serverLoggingLevel);
    }
}
