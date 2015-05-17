'use strict';

var _ = require('lodash');
var angular = require('angular');
var httpProvider = require('./config/http-provider');
var serverLoggerConfig = require('./config/server-logger-config');
var serverLoggerProvider = require('./provider/server-logger-provider');
var HttpLoggerInterceptor = require('./service/http-logger-interceptor');
var TraceService = require('./service/trace-service');
var loggerExceptionHandler = require('./factory/logger-exception-handler');
var routeLoggingSetup = require('./run/route-logging-setup');

module.exports = LoggingModule;

function LoggingModule(depModules) {
    depModules = depModules || [];
    this.name = 'logging';

    var dependencies = ['bootConfig', 'session']
        .concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(this.name, dependencies)
        .config(httpProvider)
        .config(serverLoggerConfig)
        .provider('serverLogger', serverLoggerProvider)
        .factory('loggerExceptionHandler', loggerExceptionHandler)
        .service('loggerInterceptor', HttpLoggerInterceptor)
        .service('traceService', TraceService)
        .run(routeLoggingSetup);
}

