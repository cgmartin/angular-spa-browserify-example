'use strict';

var App = require('./app/app.js');
var myApp = new App();
myApp.bootstrap(true);

module.exports = myApp;
