'use strict';

var _ = require('lodash');
var angular = require('angular');
var uuid = require('uuid');
var httpHeadersSetup = require('./run/http-headers-setup');

module.exports = SessionModule;

function SessionModule(depModules) {
    depModules = depModules || [];
    this.name = 'session';

    var dependencies = ['bootConfig']
        .concat(_.pluck(depModules, 'name'));

    this.module = angular
        .module(this.name, dependencies)
        .constant('session', {
            conversationId: uuid.v1()
        })
        .run(httpHeadersSetup);
}

