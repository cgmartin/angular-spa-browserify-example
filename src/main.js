'use strict';

// Load jQuery and Bootstrap for Nav
window.$ = window.jQuery = require('jquery');
require('bootstrap');

// Manually bootstrap the angular SPA
var SPA = window.SPA = window.SPA || {};
var App = require('./app/app.js');
SPA.app = new App();
SPA.app.bootstrap(true);
