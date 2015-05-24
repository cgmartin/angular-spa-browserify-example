'use strict';
// Starts a static server for the client app
var staticServer = require('spa-express-static-server');
staticServer.start({
    webRootPath: './client',
    spaBoot:     require('./spa-boot')
});
