'use strict';

var angular = require('angular');
var loadingIndicatorPartial = require('./loading-indicator.partial.html');

module.exports = LoadingConfigProvider;

// @ngInject
function LoadingConfigProvider() {

    var loadingConfig = {
        latencyThreshold: 250,
        dialogTemplateUrl: loadingIndicatorPartial.name,
        dialogController: null,
        dialogSize: 'sm',
    };

    this.configure = function(value) {
        angular.extend(loadingConfig, value);
    };

    this.$get = /* @ngInject */ function() {
        return loadingConfig;
    };
}
