'use strict';

var angular = require('angular');
var ngTranslate = require('angular-translate');
var uiRouter = require('angular-ui-router');
var homeRouterConfig = require('./home-router-config');
var homePartial = require('./home.partial.html');
var homeConfigProvider = require('./home-config-provider');

var moduleName = module.exports = 'home';

var dependencies = [
    ngTranslate,
    uiRouter,
    homePartial.name,
];

angular
    .module(moduleName, dependencies)
    .config(homeRouterConfig)
    .provider('homeConfig', homeConfigProvider);
