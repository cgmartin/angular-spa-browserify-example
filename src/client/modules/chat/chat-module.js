'use strict';

var angular = require('angular');
var ngTranslate = require('angular-translate');
var uiRouter = require('angular-ui-router');
var chatRouterConfig = require('./chat-router-config');
var chatPartial = require('./chat.partial.html');
var chatConfigProvider = require('./chat-config-provider');

var moduleName = module.exports = 'chat';

var dependencies = [
    ngTranslate,
    uiRouter,
    chatPartial.name,
];

angular
    .module(moduleName, dependencies)
    .config(chatRouterConfig)
    .provider('chatConfig', chatConfigProvider);
