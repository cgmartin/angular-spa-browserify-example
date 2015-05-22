'use strict';

module.exports = compileConfig;

/**
 * Toggle debug info data (better disabled in production environments)
 * https://docs.angularjs.org/guide/production
 */
// @ngInject
function compileConfig($compileProvider, bootConfig) {
    $compileProvider.debugInfoEnabled(
        (bootConfig.isCompileDebugInfoEnabled !== undefined) ?
            bootConfig.isCompileDebugInfoEnabled : true
    );
}
