'use strict';

var RouterState = require('../../lib/router-state');
var todoPartial = require('../partials/todo.partial.html');

module.exports = routerConfig;

// @ngInject
function routerConfig($stateProvider) {
    $stateProvider
        .state('todos', new RouterState('/todos', todoPartial.name, 'todoController'));
}
