/* jshint -W098 */
'use strict';

module.exports = globalOnerrorHandler;

/**
 * Sets up global error event listener for errors outside of angular
 */
// @ngInject
function globalOnerrorHandler($window, $exceptionHandler) {
    $window.onerror = function(errorMsg, url, lineNumber) {
        var error = new Error(errorMsg + ' (' + url + ':' + lineNumber + ')');
        error.type = 'globalError';
        $exceptionHandler(error);
        return false;
    };
}
