'use strict';

var angular = require('angular');
var loggingModule = require('../logging/logging-module');
var partials = require('./partials');
var routerConfig = require('./config/router-config');
var ErrorController = require('./controller/error-controller');
var exceptionHandlerRouterDecorator = require('./config/exception-handler-router-decorator');
var ErrorToDisplay = require('./service/error-to-display');
var routeErrorsSetup = require('./run/route-errors-setup');

var moduleName = module.exports = 'error';

var dependencies = [
    loggingModule,
    partials.error.name,
    partials.error404.name
];

angular
    .module(moduleName, dependencies)
    .config(routerConfig)
    .config(exceptionHandlerRouterDecorator)
    .service('errorToDisplay', ErrorToDisplay)
    .controller('errorController', ErrorController)
    .run(routeErrorsSetup);
