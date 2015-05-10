/*jshint -W098 */
'use strict';

var angular = require('angular');
var uiRouter = require('angular-ui-router');
var _ = require('lodash');
var $ = require('jquery');
var ngConfigs = require('./config');
var partials = require('./partials');

module.exports = App;

function App(depModules, name) {
    depModules = depModules || [];
    this.name = name || 'app';

    this.dependencies = [
        uiRouter,
        partials.nav.name,
        partials.home.name,
        partials.login.name,
        partials.chat.name
    ].concat(_.pluck(depModules, 'name'));

    this.runs = [];

    this.module = null;
}

App.prototype.getName = function() {
    return this.name;
};

App.prototype.addDependency = function(dep) {
    this.dependencies.push(dep);
    return this;
};

App.prototype.addRun = function(runFn) {
    this.runs.push(runFn);
    return this;
};

App.prototype.bootstrap = function(strictDi, domElement, injector) {
    domElement = domElement || document;
    injector = injector || angular.injector(['ng']);
    var _this = this;

    // Load boot config file first before angular bootstrapping
    var $http = injector.get('$http');
    return $http.get('/spa-boot.json')
        .then(function success(response) {
            console.log('[Boot] Config success:', response.data);
            continueBootstrap(response.data);
        }, function error() {
            console.error('[Boot] Config failed');
            // Bootstrap the app regardless of failure...
            // Error handling for missing config will be within app
            continueBootstrap({});
        });

    function continueBootstrap(bootConfig) {
        if (bootConfig.isStubsEnabled) {
            $.getScript('/js/stubs.js')
                .done(function(script, status) {
                    finallyBootstrap(bootConfig);
                })
                .fail(function(jqxhr, settings, exception) {
                    console.error('[Boot] Unable to load stubs bundle.', exception);
                    finallyBootstrap(bootConfig);
                });
        } else {
            finallyBootstrap(bootConfig);
        }
    }

    function finallyBootstrap(bootConfig) {
        console.log('[Boot] Final bootstrap...');
        _this.module = angular
            .module(_this.name, _this.dependencies)
            .config(ngConfigs.compileConfig)
            .config(ngConfigs.locationConfig)
            .config(ngConfigs.routerConfig);

        _this.module.constant('config', bootConfig);

        _this.runs.forEach(function(runFn) {_this.module.run(runFn);});

        angular.bootstrap(domElement, [_this.name], {strictDi: strictDi});
    }
};
