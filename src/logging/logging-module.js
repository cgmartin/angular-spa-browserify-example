'use strict';

var angular = require('angular');
var sessionModule = require('../session/session-module');
var httpProvider = require('./config/http-provider');
var serverLoggerProvider = require('./provider/server-logger-provider');
var HttpLoggerInterceptor = require('./service/http-logger-interceptor');
var TraceService = require('./service/trace-service');
var exceptionHandlerLoggerDecorator = require('./config/exception-handler-logger-decorator');
var logPerformanceTiming = require('./run/log-performance-timing');
var routeLoggingSetup = require('./run/route-logging-setup');

var moduleName = module.exports = 'logging';

var dependencies = [sessionModule];

// TODO: Add directive to track user input (button clicks, form inputs)

angular
    .module(moduleName, dependencies)
    .config(httpProvider)
    .config(exceptionHandlerLoggerDecorator)
    .provider('serverLogger', serverLoggerProvider)
    .service('loggerInterceptor', HttpLoggerInterceptor)
    .service('traceService', TraceService)
    .run(logPerformanceTiming)
    .run(routeLoggingSetup);

