'use strict';

var SPA = window.SPA = window.SPA || {};

var App = require('./app/app.js');
SPA.app = new App();
SPA.app.bootstrap(true);
