'use strict';

module.exports = logPerformanceTiming;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function logPerformanceTiming(serverLogger, $window) {
    if (!$window.performance) { return; }

    var timing = window.performance.timing || {};

    if ($window.chrome && $window.chrome.loadTimes) {
        var loadTimes = $window.chrome.loadTimes();
        var firstPaintTimeSecs = (loadTimes) ? loadTimes.firstPaintTime : 0;
        timing.chromeFirstPaintTime = Math.round(firstPaintTimeSecs * 1000);
    }

    serverLogger.trackMetric('performanceTiming', timing);
}
