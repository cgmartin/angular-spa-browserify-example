'use strict';

var todoPartial = require('../partials/todo.partial.html');

module.exports = routerConfig;

// @ngInject
function routerConfig($stateProvider) {
    $stateProvider
        .state('todos', {
            url: '/todos',
            templateUrl: todoPartial.name,
            controller: 'todoController'
        });
}
