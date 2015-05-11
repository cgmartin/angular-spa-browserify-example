'use strict';

module.exports = logConfig;

// @ngInject
function logConfig($logProvider, config) {
    // Enable/disable log debug flag
    $logProvider.debugEnabled(
        (config.isLogDebugEnabled !== undefined) ?
            config.isLogDebugEnabled : true
    );
}
