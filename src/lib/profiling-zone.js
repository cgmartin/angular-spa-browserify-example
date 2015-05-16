/*jshint -W098 */
'use strict';

var zone = require('zone.js').zone;

var time = 0;
// use the high-res timer if available
var timer = performance ?
    performance.now.bind(performance) :
    Date.now.bind(Date);

zone.marker = '?';
//zone.reset = function() {
//    time = 0;
//};

// TODO: See https://github.com/gilbox/vizone
var profilingZone = {
    onZoneCreated: function() {
        time = 0;
    },
    beforeTask: function() {
        this.originalStart = this.originalStart || timer();
        this.start = timer();
        //console.log('Entered task');
    },
    afterTask: function() {
        var diff = timer() - this.start;
        var totalDiff = timer() - this.originalStart;
        //console.log('Exited task ' + zone.marker + ' after ' + diff);
        time += diff;
        //console.log('Total active time: ' + this.time());
        //console.log('Total elapsed time: ' + totalDiff);
    },
    time: function() {
        return Math.floor(time * 100) / 100 + 'ms';
    }
};

module.exports = profilingZone;
