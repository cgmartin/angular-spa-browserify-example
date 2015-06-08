'use strict';

module.exports = SessionService;

// @ngInject
function SessionService(conversationId) {
    this.userId = null;
    this.conversationId = conversationId;
}

