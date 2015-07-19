'use strict';
/**
 * Starts a static server for the client app
 */
var config = require('./config');
var throng = require('throng');
var staticServer = require('spa-express-static-server');

if (config.heapdumpEnabled) {
    // To generate a heapdump on the running process, send: `kill -USR2 {pid}`
    require('heapdump');
}

if (config.useCluster) {
    throng(start, {
        workers:  process.env.WEB_CONCURRENCY || 1,
        lifetime: Infinity
    });
} else {
    start();
}

function start() {
    staticServer.start(config);
}
