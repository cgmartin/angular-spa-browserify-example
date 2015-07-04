'use strict';

var angular = require('angular');

module.exports = ChatConfigProvider;

// @ngInject
function ChatConfigProvider() {

    var chatConfig = {};

    this.configure = function(value) {
        angular.extend(chatConfig, value);
    };

    this.$get = /* @ngInject */ function() {
        return chatConfig;
    };
}
