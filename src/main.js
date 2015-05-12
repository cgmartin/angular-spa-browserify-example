'use strict';

// Load jQuery and Bootstrap for Nav
window.$ = window.jQuery = require('jquery');
require('bootstrap');

// Global SPA namespace
var SPA = window.SPA = window.SPA || {};
SPA.bootLogging = true;

// Manually bootstrap the angular SPA
var App = require('./app/app.js');
SPA.app = new App([], {
    enableBootLogging: (document.location.hostname === 'localhost')
});
SPA.app.bootstrap(true);
