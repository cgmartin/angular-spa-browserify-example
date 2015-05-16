'use strict';

var angular = require('angular');
var uuid = require('uuid');
var httpSessionHeaders = require('./run/http-session-headers');

module.exports = SessionModule;

function SessionModule() {
    this.name = 'session';

    var dependencies = ['bootConfig'];

    this.module = angular
        .module(this.name, dependencies)
        .constant('session', {
            conversationId: uuid.v1()
        })
        .run(httpSessionHeaders);
}

SessionModule.prototype.getName = function() {
    return this.name;
};
