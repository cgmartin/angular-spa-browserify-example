'use strict';

var printStackTrace = require('stacktrace-js');

module.exports = TraceService;

/**
 * Prints cross-browser stacktraces via stracktrace.js
 * https://github.com/stacktracejs/stacktrace.js
 */
// @ngInject
function TraceService() {
    this.print = printStackTrace;
}

