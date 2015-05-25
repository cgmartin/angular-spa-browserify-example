'use strict';

var angular = require('angular');
var sessionService = require('./service/session-service');
var httpHeadersSetup = require('./run/http-headers-setup');
var getConversationId = require('./lib/get-conversation-id');

var moduleName = module.exports = 'session';

var dependencies = [];

angular
    .module(moduleName, dependencies)
    .constant('conversationId', getConversationId())
    .service('session', sessionService)
    .run(httpHeadersSetup);

