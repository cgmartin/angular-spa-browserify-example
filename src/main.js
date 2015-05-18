'use strict';

//var zone = require('zone.js').zone;
//var profilingZone = require('./lib/profiling-zone');

var main = function() {
    //zone.marker = 'main';

    var App = require('./app/app.js');
    var sessionModule = require('./session/session-module');
    var loggingModule = require('./logging/logging-module');
    var errorModule = require('./error/error-module');
    var notificationsModule = require('./notifications/notifications-module');
    var todoModule = require('./todo/todo-module');

    // Load jQuery and Bootstrap for Nav
    window.$ = window.jQuery = require('jquery');
    require('bootstrap');

    // Global SPA namespace
    var SPA = window.SPA = window.SPA || {};
    SPA.bootLogging = true;

    // Manually bootstrap the angular SPA
    SPA.app = new App(
        [sessionModule, loggingModule, errorModule, notificationsModule, todoModule],
        {enableBootLogging: (document.location.hostname === 'localhost')}
    );
    SPA.app.bootstrap(true);
};

//zone.fork(profilingZone).run(main);
main();
