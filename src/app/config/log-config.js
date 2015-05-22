'use strict';

module.exports = logConfig;

/**
 * Configures the $logProvider with log level
 */
// @ngInject
function logConfig($logProvider, bootConfig) {
    $logProvider.debugEnabled(
        (bootConfig.isLogDebugEnabled !== undefined) ?
            bootConfig.isLogDebugEnabled : true
    );
}
