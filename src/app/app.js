/*jshint -W098, -W030 */
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
var exceptionHandlerOverride = require('./factory/exception-handler-override');

module.exports = App;

/**
 * Wraps angular.module to manually bootstrap an angular application.
 *
 * @param depModules (optional) Additional module names to include as dependencies
 * @param options (optional)
 * @constructor
 */
function App(depModules, options) {
    depModules = depModules || [];
    options = options || {};
    this.name = 'app';

    this.bootLog = (options.enableBootLogging === true) ?
        function() { console.debug.apply(console, arguments); } :
        _.noop;

    this.dependencies = [
        'bootConfig',
        uiRouter,
        ngTranslate,
        ngPartials.nav.name,
        ngPartials.home.name,
        ngPartials.login.name,
        ngPartials.chat.name
    ].concat(depModules);
    this.module = null;
}

/**
 * Manually bootstrap the angular application after first loading a config file
 * and optional stubs bundle.
 *
 * @param strictDi Strict DI mode?
 * @param domElement (optional) DOM element to attach to (default: document)
 * @param injector (optional) Angular injector to use (default: angular.injector(['ng']))
 */
App.prototype.bootstrap = function(strictDi, domElement, injector) {
    domElement = domElement || document;
    injector = injector || angular.injector(['ng']);
    var _this = this;

    // 1. Load boot config file first before angular bootstrapping
    _this.bootLog('[Boot] Loading config...');
    var $http = injector.get('$http');
    return $http.get('/spa-boot.json')
        .then(function bootConfigSuccess(response) {
            _this.bootLog('[Boot] Config success:', response.data);
            continueBootstrap(response.data);
        }, function bootConfigError() {
            _this.bootLog('[Boot] Config failed');
            // Bootstrap the app regardless of failure...
            // Error handling for missing config will be within app
            continueBootstrap({});
        });

    // 2. Continue bootstrapping and load fake backend stubs bundle, if enabled
    function continueBootstrap(bootConfig) {
        if (bootConfig.isStubsEnabled) {
            _this.bootLog('[Boot] Loading stubs.js...');
            $script('/js/stubs.js', function() {
                finallyBootstrap(bootConfig);
            });
        } else {
            finallyBootstrap(bootConfig);
        }
    }

    // 3. OK, now finally bootstrap the angular app
    function finallyBootstrap(bootConfig) {
        _this.bootLog('[Boot] Bootstrap angular app...');

        angular.module('bootConfig', []).constant('config', bootConfig);

        _this.module = angular.module(_this.name, _this.dependencies);

        // Bind all configs, services, directives
        _.forEach(ngConfigs, function(c) {
            _this.module.config(c);
        });
        _.forEach(ngServices, function(s, key) {
            _this.module.service(key, s);
        });
        _.forEach(ngDirectives, function(d, key) {
            _this.module.directive(key, d);
        });

        _this.module.factory('$exceptionHandler', exceptionHandlerOverride);

        angular.bootstrap(domElement, [_this.name], {strictDi: strictDi});
    }
};

