/*jshint -W098, -W030 */
'use strict';

var _ = require('lodash');
var $script = require('scriptjs');
var angular = require('angular');
var ngAnimate = require('angular-animate');
var uiRouter = require('angular-ui-router');
var ngTranslate = require('angular-translate');
var ngConfigs = require('./config');
var ngServices = require('./service');
var unauthenticatedEventHandler = require('./run/unauthenticated-event-handler');

// App Modules
var sessionModule = require('../modules/session/session-module');
var loggingModule = require('../modules/logging/logging-module');
var errorModule = require('../modules/error/error-module');
var notificationsModule = require('../modules/notifications/notifications-module');
var authModule = require('../modules/auth/auth-module');
var navModule = require('../modules/nav/nav-module');
var homeModule = require('../modules/home/home-module');
var todoModule = require('../modules/todo/todo-module');
var chatModule = require('../modules/chat/chat-module');

module.exports = App;

/**
 * Wraps angular.module to manually bootstrap an angular application.
 *
 * @param depModules (optional) Additional module names to include as dependencies
 * @param options (optional)
 * @constructor
 */
function App(options) {
    this.options = _.extend({
        isLogDebugEnabled: false
    }, options);
    this.name = 'app';

    this.bootLog = (this.options.isLogDebugEnabled === true) ?
        function() { console.debug.apply(console, arguments); } :
        _.noop;

    this.dependencies = [
        'app.config',
        uiRouter,
        ngTranslate,
        ngAnimate,
        sessionModule,
        loggingModule,
        errorModule,
        notificationsModule,
        //loadingModule,
        authModule,
        navModule,
        homeModule,
        todoModule,
        chatModule,
    ];

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

    // Example of calling a service endpoint prior to app bootstrap...
    // 1. Load boot config file first before angular bootstrapping
    //_this.bootLog('[Boot] Calling service...');
    //var $http = injector.get('$http');
    //return $http.get('/api/boot-service')
    //    .then(function bootServiceSuccess(response) {
    //        _this.bootLog('[Boot] Service success:', response.data);
    //        continueBootstrap(response.data);
    //    }, function bootServiceError() {
    //        _this.bootLog('[Boot] Service failed');
    //        // Bootstrap the app regardless of failure...
    //        // Error handling for missing config will be within app
    //        continueBootstrap({});
    //    });
    continueBootstrap(this.options);

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

        angular.module('app.config', [])
            .constant('bootConfig', bootConfig);  // run-time config

        _this.module = angular.module(_this.name, _this.dependencies);

        // Bind all configs, services, etc
        _.forEach(ngConfigs, function(c) {
            _this.module.config(c);
        });
        _.forEach(ngServices, function(s, key) {
            _this.module.service(key, s);
        });

        _this.module.run(unauthenticatedEventHandler);

        angular.bootstrap(domElement, [_this.name], {strictDi: strictDi});
    }
};
