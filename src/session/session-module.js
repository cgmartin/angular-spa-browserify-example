'use strict';

var angular = require('angular');
var uuid = require('uuid');
var sessionService = require('./service/session-service');
var httpHeadersSetup = require('./run/http-headers-setup');

var moduleName = module.exports = 'session';

var dependencies = [];

angular
    .module(moduleName, dependencies)
    .constant('conversationId', uuid.v1())
    .service('session', sessionService)
    .run(httpHeadersSetup);

// TODO: Consider a "sessionId" based on inactivity timeout
