'use strict';

var _ = require('lodash');
var angular = require('angular');
var uiRouter = require('angular-ui-router');
var ngTranslate = require('angular-translate');
var routerConfig = require('./config/router-config');
var todoPartial = require('./partials/todo.partial.html');
var TodoController = require('./controller/todo-controller');
var todoBlurDirective = require('./directive/todo-blur-directive');
var todoFocusDirective = require('./directive/todo-focus-directive');
var TodoStorage = require('./service/todo-storage');

module.exports = TodoModule;

function TodoModule(depModules) {
    depModules = depModules || [];
    this.name = 'todo';

    var dependencies = [
        uiRouter,
        ngTranslate,
        todoPartial.name
    ].concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(this.name, dependencies)
        .config(routerConfig)
        .controller('todoController', TodoController)
        .directive('todoBlur', todoBlurDirective)
        .directive('todoFocus', todoFocusDirective)
        .service('todoStorage', TodoStorage);
}

