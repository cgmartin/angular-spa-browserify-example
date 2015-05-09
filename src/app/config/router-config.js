'use strict';

var RouterState = require('../../lib/router-state');
var homePartial = require('../partials/home.partial.html');
var loginPartial = require('../partials/login.partial.html');
var chatPartial = require('../partials/chat.partial.html');

module.exports = routerConfig;

// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home',  new RouterState('/home',  homePartial.name))
        .state('login', new RouterState('/login', loginPartial.name))
        .state('chat',  new RouterState('/chat',  chatPartial.name));

    $urlRouterProvider.otherwise('/home');
}

