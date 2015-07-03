'use strict';
/**
 * Starts a static server for the client app
 */
// To generate a heapdump on the running process, send: `kill -USR2 {pid}`
if (process.env.NODE_ENV === 'production') { require('heapdump'); }

var throng = require('throng');
var staticServer = require('spa-express-static-server');

// Cluster worker manager
throng(start, {
    workers: process.env.WEB_CONCURRENCY || 1,
    lifetime: Infinity
});

function start() {
    staticServer.start({
        webRootPath: process.env.STATIC_WEBROOT || './dist',
        spaBoot:     require('./spa-boot-config'),
        isCompressionEnabled: process.env.NODE_ENV === 'production',
        isGracefulShutdownEnabled: process.env.NODE_ENV === 'production'
    });
}
