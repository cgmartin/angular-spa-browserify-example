'use strict';

module.exports = compileConfig;

/**
 * Toggle debug info data (better disabled in production environments)
 * https://docs.angularjs.org/guide/production
 */
// @ngInject
function compileConfig($compileProvider, config) {
    $compileProvider.debugInfoEnabled(
        (config.isCompileDebugInfoEnabled !== undefined) ?
            config.isCompileDebugInfoEnabled : true
    );
}
