'use strict';

module.exports = compileConfig;

// @ngInject
function compileConfig($compileProvider, config) {
    // Enable/disable debug data
    // https://docs.angularjs.org/guide/production
    $compileProvider.debugInfoEnabled(
        (config.isDebugInfoEnabled !== undefined) ? config.isDebugInfoEnabled : true
    );
}
