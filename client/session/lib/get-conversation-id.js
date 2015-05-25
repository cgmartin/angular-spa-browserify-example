'use strict';
var uuid = require('uuid');

module.exports = getConversationId;

// Conversation ID is needed in config phase
function getConversationId() {
    var cookieName = 'ConversationId';
    var conversationId = getCookie(cookieName);

    if (!conversationId) {
        conversationId = uuid.v1();
        setCookie(cookieName, conversationId);
    }

    return conversationId;
}

function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    return (parts.length === 2) ? parts.pop().split(';').shift() : false;
}

function setCookie(name, value) {
    document.cookie = name + '=' + value + ';path=/';
}
