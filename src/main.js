'use strict';

//var zone = require('zone.js').zone;
//var profilingZone = require('./lib/profiling-zone');

var main = function() {
    //zone.marker = 'main';

    var App = require('./app/app.js');

    // Load jQuery and Bootstrap for Nav
    window.$ = window.jQuery = require('jquery');
    require('bootstrap');

    // Global SPA namespace
    var SPA = window.SPA = window.SPA || {};
    SPA.bootLogging = true;

    // Manually bootstrap the angular SPA
    SPA.app = new App({
        enableBootLogging: (document.location.hostname === 'localhost')
    });
    SPA.app.bootstrap(true);
};

//zone.fork(profilingZone).run(main);
main();
