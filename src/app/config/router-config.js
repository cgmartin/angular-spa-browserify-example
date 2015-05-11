'use strict';

require('angular-ui-router');
var RouterState = require('../../lib/router-state');
var partials = require('../partials');

module.exports = routerConfig;

// @ngInject
function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home',  new RouterState('/home',  partials.home.name))
        .state('login', new RouterState('/login', partials.login.name))
        .state('chat',  new RouterState('/chat',  partials.chat.name));

    $urlRouterProvider.otherwise('/home');
}

