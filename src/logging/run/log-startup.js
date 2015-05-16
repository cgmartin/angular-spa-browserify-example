'use strict';

module.exports = logStartup;

// @ngInject
function logStartup(serverLogger) {
    serverLogger.debug('[Run] Logging Service started...');
}
