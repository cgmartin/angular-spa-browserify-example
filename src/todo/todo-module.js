'use strict';

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

function TodoModule() {
    this.name = 'todo';

    var dependencies = [
        uiRouter,
        ngTranslate,
        todoPartial.name
    ];

    this.module = angular
        .module(this.name, dependencies)
        .config(routerConfig)
        .controller('todoController', TodoController)
        .directive('todoBlur', todoBlurDirective)
        .directive('todoFocus', todoFocusDirective)
        .service('todoStorage', TodoStorage);
}

TodoModule.prototype.getName = function() {
    return this.name;
};
