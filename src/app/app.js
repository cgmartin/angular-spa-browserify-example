/*jshint -W098 */
'use strict';

var _ = require('lodash');
var $script = require('scriptjs');
var angular = require('angular');
var uiRouter = require('angular-ui-router');
var ngTranslate = require('angular-translate');
var ngConfigs = require('./config');
var ngPartials = require('./partials');
var ngServices = require('./service');
var ngDirectives = require('./directive');

module.exports = App;

function App(depModules, name) {
    depModules = depModules || [];
    this.name = name || 'app';

    this.dependencies = [
        uiRouter,
        ngTranslate,
        ngPartials.nav.name,
        ngPartials.home.name,
        ngPartials.login.name,
        ngPartials.chat.name
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

/**
 *
 * @param strictDi
 * @param domElement
 * @param injector
 */
App.prototype.bootstrap = function(strictDi, domElement, injector) {
    domElement = domElement || document;
    injector = injector || angular.injector(['ng']);
    var _this = this;

    // Load boot config file first before angular bootstrapping
    console.debug('[Boot] Loading config...');
    var $http = injector.get('$http');
    return $http.get('/spa-boot.json')
        .then(function bootConfigSuccess(response) {
            console.debug('[Boot] Config success:', response.data);
            continueBootstrap(response.data);
        }, function bootConfigError() {
            console.error('[Boot] Config failed');
            // Bootstrap the app regardless of failure...
            // Error handling for missing config will be within app
            continueBootstrap({});
        });

    function continueBootstrap(bootConfig) {
        if (bootConfig.isStubsEnabled) {
            console.debug('[Boot] Loading stubs.js...');
            $script('/js/stubs.js', function() {
                finallyBootstrap(bootConfig);
            });
        } else {
            finallyBootstrap(bootConfig);
        }
    }

    function finallyBootstrap(bootConfig) {
        console.debug('[Boot] Bootstrap angular app...');
        _this.module = angular
            .module(_this.name, _this.dependencies)
            .config(ngConfigs.log)
            .config(ngConfigs.compile)
            .config(ngConfigs.location)
            .config(ngConfigs.router)
            .config(ngConfigs.translate)
            .service('translateStorage', ngServices.translateStorage)
            .directive('spaNav', ngDirectives.spaNav);

        _this.module.constant('config', bootConfig);

        _this.runs.forEach(function(runFn) {_this.module.run(runFn);});

        angular.bootstrap(domElement, [_this.name], {strictDi: strictDi});
    }
};
