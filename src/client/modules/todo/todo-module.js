'use strict';

var angular = require('angular');
var uiRouter = require('angular-ui-router');
var ngTranslate = require('angular-translate');
var notificationsModule = require('../notifications/notifications-module');
var loadingModule = require('../loading/loading-module');
var routerConfig = require('./config/router-config');
var todoPartial = require('./partials/todo.partial.html');
var TodoController = require('./controller/todo-controller');
var todoBlurDirective = require('./directive/todo-blur-directive');
var todoFocusDirective = require('./directive/todo-focus-directive');
var TodoStorage = require('./service/todo-storage');

var moduleName = module.exports = 'todo';

var dependencies = [
    uiRouter,
    ngTranslate,
    todoPartial.name,
    notificationsModule,
    loadingModule
];

angular
    .module(moduleName, dependencies)
    .config(routerConfig)
    .controller('todoController', TodoController)
    .directive('todoBlur', todoBlurDirective)
    .directive('todoFocus', todoFocusDirective)
    .service('todoStorage', TodoStorage);
