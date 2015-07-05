'use strict';

var angular = require('angular');
var ngTranslate = require('angular-translate');
var loadingConfigProvider = require('./loading-config-provider');
var loadingIndicatorDirective = require('./loading-indicator-directive');
var loadingIndicatorPartial = require('./loading-indicator.partial.html');

var moduleName = module.exports = 'loading';

var dependencies = [
    ngTranslate,
    loadingIndicatorPartial.name,
];

angular
    .module(moduleName, dependencies)
    .provider('loadingConfig', loadingConfigProvider)
    .directive('loadingIndicator', loadingIndicatorDirective);
