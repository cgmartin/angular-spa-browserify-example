'use strict';

var angular = require('angular');

module.exports = serverLoggerConfig;

/**
 * Configures the server logger from boot config values
 */
// @ngInject
function serverLoggerConfig(serverLoggerProvider, config) {
    var loggingConfig = {};
    if (angular.isDefined(config.apiBaseUrl)) {
        loggingConfig.apiBaseUrl = config.apiBaseUrl;
    }
    if (angular.isDefined(config.isStubsEnabled)) {
        loggingConfig.isStubsEnabled = config.isStubsEnabled;
    }
    if (angular.isDefined(config.serverLogging)) {
        angular.extend(loggingConfig, config.serverLogging);
    }
    serverLoggerProvider.configure(loggingConfig);
}
