'use strict';

var angular = require('angular');

module.exports = LoadingConfigProvider;

// @ngInject
function LoadingConfigProvider() {

    var loadingConfig = {
        latencyThreshold: 250,
    };

    this.configure = function(value) {
        angular.extend(loadingConfig, value);
    };

    this.$get = /* @ngInject */ function() {
        return loadingConfig;
    };
}
