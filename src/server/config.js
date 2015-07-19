'use strict';

/**
 * Default configuration options
 */
module.exports = {
    // Use throng to cluster the processes across CPUs
    useCluster: (process.env.STATIC_CLUSTER === '1'),

    // Enable heapdump support
    heapdumpEnabled: (process.env.STATIC_HEAPDUMP === '1'),

    // The www root path that the static server should serve
    webRootPath: process.env.STATIC_WEBROOT || './dist',

    // The route endpoint to provide an 'OK' status for health checks (will not log request)
    statusRoute: '/status',

    // Boot configuration that is served to the SPA via JSONP
    spaBoot: require('./spa-boot-config')
};

