'use strict';

var angular = require('angular');
var httpProvider = require('./config/http-provider');
var serverLoggerConfig = require('./config/server-logger-config');
var serverLoggerProvider = require('./provider/server-logger-provider');
var LoggerInterceptor = require('./service/logger-interceptor');
var TraceService = require('./service/trace-service');
var exceptionOverride = require('./factory/exception-override');
var logStartup = require('./run/log-startup');

module.exports = LoggingModule;

function LoggingModule() {
    this.name = 'logging';

    var dependencies = ['bootConfig', 'session'];

    this.module = angular
        .module(this.name, dependencies)
        .config(httpProvider)
        .config(serverLoggerConfig)
        .provider('serverLogger', serverLoggerProvider)
        .factory('$exceptionHandler', exceptionOverride)
        .service('loggerInterceptor', LoggerInterceptor)
        .service('traceService', TraceService)
        .run(logStartup);
}

LoggingModule.prototype.getName = function() {
    return this.name;
};
