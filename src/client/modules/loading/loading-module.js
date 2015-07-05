'use strict';

var angular = require('angular');
var ngTranslate = require('angular-translate');
var uiBootstrap = require('../../vendor/ui-bootstrap-custom');
var httpLoadingConfig = require('./http-loading-config');
var loadingConfigProvider = require('./loading-config-provider');
var LoadingIndicator = require('./loading-indicator');
var loadingIndicatorPartial = require('./loading-indicator.partial.html');

var moduleName = module.exports = 'loading';

var dependencies = [
    ngTranslate,
    uiBootstrap,
    loadingIndicatorPartial.name,
];

angular
    .module(moduleName, dependencies)
    .config(httpLoadingConfig)
    .provider('loadingConfig', loadingConfigProvider)
    .service('loadingIndicator', LoadingIndicator);
