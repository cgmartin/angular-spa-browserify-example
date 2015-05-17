'use strict';

module.exports = logConfig;

/**
 * Configures the $logProvider with log level
 */
// @ngInject
function logConfig($logProvider, config) {
    $logProvider.debugEnabled(
        (config.isLogDebugEnabled !== undefined) ?
            config.isLogDebugEnabled : true
    );
}
