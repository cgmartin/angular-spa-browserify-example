'use strict';

var angular = require('angular');
var ngTranslate = require('angular-translate');
var uiRouter = require('angular-ui-router');
var authModule = require('../auth/auth-module');
var notificationsModule = require('../notifications/notifications-module');
var spaNavPartial = require('./spa-nav/spa-nav.partial.html');
var spaNavDirective = require('./spa-nav/spa-nav-directive');
var navConfigProvider = require('./nav-config-provider');

var moduleName = module.exports = 'nav';

var dependencies = [
    ngTranslate,
    uiRouter,
    authModule,
    notificationsModule,
    spaNavPartial.name,
];

angular
    .module(moduleName, dependencies)
    .provider('navConfig', navConfigProvider)
    .directive('spaNav', spaNavDirective);
