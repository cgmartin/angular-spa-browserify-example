'use strict';

var angular = require('angular');
var Notifications = require('../service/notifications');
var notifyPartial = require('../partials/notify.partial.html');

module.exports = NotificationsProvider;

/**
 * Configures the notifications service
 */
// @ngInject
function NotificationsProvider() {
    var notifyConfig = {
        startTop: 10,
        verticalSpacing: 15,
        maximumOpen: 0,
        duration: 5000,
        templateUrl: notifyPartial.name,
        position: 'center',
        container: document.body,
        classes: '',
        scope: null
    };

    this.configure = function(value) {
        angular.extend(notifyConfig, value);
    };

    this.$get = notificationsFactory;

    // @ngInject
    function notificationsFactory($timeout, $http, $compile, $templateCache, $rootScope) {
        return new Notifications(notifyConfig, $timeout, $http, $compile, $templateCache, $rootScope);
    }
}
