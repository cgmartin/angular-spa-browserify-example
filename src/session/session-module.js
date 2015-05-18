'use strict';

var angular = require('angular');
var uuid = require('uuid');
var httpHeadersSetup = require('./run/http-headers-setup');

var moduleName = module.exports = 'session';

var dependencies = [];

angular
    .module(moduleName, dependencies)
    .constant('session', {
        conversationId: uuid.v1()
    })
    .run(httpHeadersSetup);
