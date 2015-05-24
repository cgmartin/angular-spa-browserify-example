'use strict';

// Called via /spa-boot.js JSONP callback
window.main = function(bootConfig) {
    var App = require('./app/app.js');

    // Load jQuery and Bootstrap for Nav
    window.$ = window.jQuery = require('jquery');
    require('bootstrap');

    // Global SPA namespace
    var SPA = window.SPA = window.SPA || {};

    // Manually bootstrap the angular SPA
    SPA.app = new App(bootConfig);
    SPA.app.bootstrap(true);
};
