'use strict';

module.exports = ServerLoggerInterceptor;

/**
 * Add extra information to server logs
 */
// @ngInject
function ServerLoggerInterceptor(session) {

    this.log = function(logItem) {
        logItem.user = session.userId;
    };

    this.sendData = function(reqCfg) {
        reqCfg.headers.ConversationId = session.conversationId;
    };
}

