'use strict';

module.exports = httpSessionHeaders;

// @ngInject
function httpSessionHeaders($http, session) {
    $http.defaults.headers.common.ConversationId = session.conversationId;
}
