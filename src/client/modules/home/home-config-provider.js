'use strict';

var angular = require('angular');

module.exports = HomeConfigProvider;

// @ngInject
function HomeConfigProvider() {

    var homeConfig = {
        appVersion: '0.0.0',
    };

    this.configure = function(value) {
        angular.extend(homeConfig, value);
    };

    this.$get = /* @ngInject */ function() {
        return homeConfig;
    };
}
