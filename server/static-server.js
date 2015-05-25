'use strict';
// Starts a static server for the client app
var throng = require('throng');
var staticServer = require('spa-express-static-server');

throng(start, {
    workers: process.env.WEB_CONCURRENCY || 1,
    lifetime: Infinity
});

function start() {
    staticServer.start({
        webRootPath: process.env.STATIC_WEBROOT || './dist',
        spaBoot:     require('./spa-boot')
    });
}
