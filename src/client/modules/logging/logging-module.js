'use strict';

var angular = require('angular');
var httpLoggingConfig = require('./config/http-logging-config');
var exceptionHandlerLoggerDecorator = require('./config/exception-handler-logger-decorator');
var serverLoggerProvider = require('./provider/server-logger-provider');
var TraceService = require('./service/trace-service');
var trackOnDirective = require('./directive/track-on-directive');
var logPerformanceTiming = require('./run/log-performance-timing');
var routeLoggingSetup = require('./run/route-logging-setup');

var moduleName = module.exports = 'logging';

var dependencies = [];

angular
    .module(moduleName, dependencies)
    .config(httpLoggingConfig)
    .config(exceptionHandlerLoggerDecorator)
    .provider('serverLogger', serverLoggerProvider)
    .service('traceService', TraceService)
    .directive('trackOn', trackOnDirective)
    .run(logPerformanceTiming)
    .run(routeLoggingSetup);

