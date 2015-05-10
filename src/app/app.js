'use strict';

var angular = require('angular');
var uiRouter = require('angular-ui-router');
var _ = require('lodash');
var ngConfigs = require('./config');
var partials = require('./partials');

module.exports = App;

function App(depModules, name) {
    depModules = depModules || [];
    name = name || 'app';

    var dependencies = [
        uiRouter,
        partials.nav.name,
        partials.home.name,
        partials.login.name,
        partials.chat.name
    ].concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(name, dependencies)
        .config(ngConfigs.compileConfig)
        .config(ngConfigs.locationConfig)
        .config(ngConfigs.routerConfig);
}

App.prototype.getName = function() {
    return this.module.name;
};

App.prototype.bootstrap = function(strictDi, domElement, injector) {
    injector = injector || angular.injector(['ng']);
    var _this = this;

    function continueBootstrap(bootConfig, strictDi, domElement) {
        domElement = domElement || document;
        _this.module.constant('config', bootConfig);
        angular.bootstrap(domElement, [_this.getName()], {strictDi: strictDi});
    }

    // Load boot config file first before angular bootstrapping
    var $http = injector.get('$http');
    return $http.get('/spa-boot.json')
        .then(function success(response) {
            continueBootstrap(response.data, strictDi, domElement);
        }, function error() {
            // Bootstrap the app regardless of failure...
            // Error handling for missing config will be within app
            continueBootstrap({}, strictDi, domElement);
        });
};

