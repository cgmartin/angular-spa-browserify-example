'use strict';

var angular = require('angular');
var sessionModule = require('../session/session-module');
var httpProvider = require('./config/http-provider');
var serverLoggerProvider = require('./provider/server-logger-provider');
var HttpLoggerInterceptor = require('./service/http-logger-interceptor');
var TraceService = require('./service/trace-service');
var loggerExceptionHandler = require('./factory/logger-exception-handler');
var routeLoggingSetup = require('./run/route-logging-setup');

var moduleName = module.exports = 'logging';

var dependencies = [sessionModule];

angular
    .module(moduleName, dependencies)
    .config(httpProvider)
    .provider('serverLogger', serverLoggerProvider)
    .factory('loggerExceptionHandler', loggerExceptionHandler)
    .service('loggerInterceptor', HttpLoggerInterceptor)
    .service('traceService', TraceService)
    .run(routeLoggingSetup);

