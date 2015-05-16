'use strict';

//var zone = require('zone.js').zone;
//var profilingZone = require('./lib/profiling-zone');

var main = function() {
    //zone.marker = 'main';

    var App = require('./app/app.js');
    var SessionModule = require('./session/session-module');
    var LoggingModule = require('./logging/logging-module');
    var TodoModule = require('./todo/todo-module');

    // Load jQuery and Bootstrap for Nav
    window.$ = window.jQuery = require('jquery');
    require('bootstrap');

    // Global SPA namespace
    var SPA = window.SPA = window.SPA || {};
    SPA.bootLogging = true;

    // Feature modules
    var sessionModule = new SessionModule();
    var loggingModule = new LoggingModule();
    var todoModule = new TodoModule();

    // Manually bootstrap the angular SPA
    SPA.app = new App(
        [sessionModule, loggingModule, todoModule],
        {enableBootLogging: (document.location.hostname === 'localhost')}
    );
    SPA.app.bootstrap(true);
};

//zone.fork(profilingZone).run(main);
main();
