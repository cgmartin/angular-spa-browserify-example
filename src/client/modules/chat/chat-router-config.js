'use strict';

var chatPartial = require('./chat.partial.html');

module.exports = chatRouterConfig;

/**
 * Set up the chat route(s)
 */
// @ngInject
function chatRouterConfig($stateProvider) {
    $stateProvider
        // Example views
        .state('chat', {
            url: '/chat',
            templateUrl: chatPartial.name,
        });
}

