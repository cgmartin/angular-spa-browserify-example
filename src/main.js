'use strict';

var App = require('./app/app.js');
var TodoModule = require('./todo/todo-module');

// Load jQuery and Bootstrap for Nav
window.$ = window.jQuery = require('jquery');
require('bootstrap');

// Global SPA namespace
var SPA = window.SPA = window.SPA || {};
SPA.bootLogging = true;

// Feature modules
var todoModule = new TodoModule();

// Manually bootstrap the angular SPA
SPA.app = new App(
    [todoModule],
    {enableBootLogging: (document.location.hostname === 'localhost')}
);
SPA.app.bootstrap(true);
