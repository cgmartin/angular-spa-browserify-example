'use strict';

var _ = require('lodash');
var angular = require('angular');
var serverLoggerConfig = require('./config/server-logger-config');
var serverLoggerProvider = require('./provider/server-logger-provider');
var TraceService = require('./service/trace-service');
var exceptionOverride = require('./factory/exception-override');
var logStartup = require('./run/log-startup');

module.exports = LoggingModule;

function LoggingModule(depModules, options) {
    depModules = depModules || [];
    options = options || {};
    this.name = options.name || 'logging';

    var dependencies = ['bootConfig'].concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(this.name, dependencies)
        .config(serverLoggerConfig)
        .provider('serverLogger', serverLoggerProvider)
        .factory('$exceptionHandler', exceptionOverride)
        .service('traceService', TraceService)
        .run(logStartup);
}

LoggingModule.prototype.getName = function() {
    return this.name;
};
