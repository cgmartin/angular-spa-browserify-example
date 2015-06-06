'use strict';

var angular = require('angular');

module.exports = serverLoggerConfig;

/**
 * Configures the server logger from boot config values
 */
// @ngInject
function serverLoggerConfig(serverLoggerProvider, buildConfig, bootConfig) {
    var loggingConfig = {
        appVersion: buildConfig.version
    };
    if (angular.isDefined(bootConfig.apiBaseUrl)) {
        loggingConfig.apiBaseUrl = bootConfig.apiBaseUrl;
    }
    if (angular.isDefined(bootConfig.isStubsEnabled)) {
        loggingConfig.isStubsEnabled = bootConfig.isStubsEnabled;
    }
    if (angular.isDefined(bootConfig.serverLogging)) {
        angular.extend(loggingConfig, bootConfig.serverLogging);
    }
    serverLoggerProvider.configure(loggingConfig);

    serverLoggerProvider.interceptors.push('serverLoggerInterceptor');
}
