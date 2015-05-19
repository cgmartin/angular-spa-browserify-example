'use strict';

module.exports = serverLoggerConfig;

/**
 * Configures the server logger from boot config values
 */
// @ngInject
function serverLoggerConfig(serverLoggerProvider, config) {
    // Enable/disable log debug flag
    if (typeof config.serverLoggingLevel !== 'undefined') {
        serverLoggerProvider.configure({loggingLevel: config.serverLoggingLevel});
    }
}
