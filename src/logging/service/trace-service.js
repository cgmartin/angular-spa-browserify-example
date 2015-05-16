'use strict';

var printStackTrace = require('stacktrace-js');

module.exports = TraceService;

// @ngInject
function TraceService() {
    // Using stracktrace.js
    // https://github.com/stacktracejs/stacktrace.js
    this.print = printStackTrace;
}

