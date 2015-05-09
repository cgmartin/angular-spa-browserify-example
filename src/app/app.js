'use strict';

var angular = require('angular');
var uiRouter = require('angular-ui-router');
var _ = require('lodash');

// Config Functions
var compileConfig = require('./config/compile-config');
var locationConfig = require('./config/location-config');
var routerConfig = require('./config/router-config');

// Partials
var navPartial = require('./partials/nav.partial.html');
var homePartial = require('./partials/home.partial.html');
var loginPartial = require('./partials/login.partial.html');
var chatPartial = require('./partials/chat.partial.html');

module.exports = App;

function App(depModules, name) {
    depModules = depModules || [];
    name = name || 'app';

    var dependencies = [
        uiRouter,
        navPartial.name,
        homePartial.name,
        loginPartial.name,
        chatPartial.name
    ].concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(name, dependencies)
        .config(compileConfig)
        .config(locationConfig)
        .config(routerConfig);
}

App.prototype.getName = function() {
    return this.module.name;
};

App.prototype.bootstrap = function(strictDi, domElement, injector) {
    injector = injector || angular.injector(['ng']);

    // Load boot config file first before angular bootstrapping
    var _this = this;
    var $http = injector.get('$http');
    return $http.get('/spa-boot.json')
        .then(function success(response) {
            _this.continueBootstrap(response.data, strictDi, domElement);
        }, function error() {
            // Bootstrap the app regardless of failure...
            // Error handling for missing config will be within app
            _this.continueBootstrap({}, strictDi, domElement);
        });
};

App.prototype.continueBootstrap = function(bootConfig, strictDi, domElement) {
    domElement = domElement || document;
    this.module.constant('config', bootConfig);
    angular.bootstrap(domElement, [this.getName()], {strictDi: strictDi});
};
