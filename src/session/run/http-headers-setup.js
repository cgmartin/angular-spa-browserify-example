'use strict';

module.exports = httpHeadersSetup;

/**
 * Configures common http headers with session information
 */
// @ngInject
function httpHeadersSetup($http, session) {
    $http.defaults.headers.common.ConversationId = session.conversationId;
}
