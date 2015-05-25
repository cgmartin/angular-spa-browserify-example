'use strict';

var angular = require('angular');
var notificationsProvider = require('./provider/notifications-provider');
var notifyPartial = require('./partials/notify.partial.html');

var moduleName = module.exports = 'notifications';

var dependencies = [
    notifyPartial.name
];

angular
    .module(moduleName, dependencies)
    .provider('notifications', notificationsProvider);
