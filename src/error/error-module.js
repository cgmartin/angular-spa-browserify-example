'use strict';

var _ = require('lodash');
var angular = require('angular');
var partials = require('./partials');
var routerConfig = require('./config/router-config');
var ErrorController = require('./controller/error-controller');
var exceptionErrorRouteHandler = require('./factory/exception-error-route-handler');
var ErrorToDisplay = require('./service/error-to-display');
var routeErrorsSetup = require('./run/route-errors-setup');

module.exports = ErrorModule;

function ErrorModule(depModules) {
    depModules = depModules || [];
    this.name = 'error';

    var dependencies = [
        'bootConfig',
        partials.error.name,
        partials.errorException.name,
        partials.error404.name
    ].concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(this.name, dependencies)
        .config(routerConfig)
        .factory('exceptionErrorRouteHandler', exceptionErrorRouteHandler)
        .service('errorToDisplay', ErrorToDisplay)
        .controller('errorController', ErrorController)
        .run(routeErrorsSetup);
}
