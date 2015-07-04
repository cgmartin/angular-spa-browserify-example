'use strict';

var angular = require('angular');

module.exports = NavConfigProvider;

// @ngInject
function NavConfigProvider() {

    var navConfig = {
        supportedLanguages: [],
    };

    this.configure = function(value) {
        angular.extend(navConfig, value);
    };

    this.$get = /* @ngInject */ function() {
        return navConfig;
    };
}
