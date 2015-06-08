/*jshint -W098 */
var angular = require('angular');
require('angular-mocks');
var todoStubs = require('./modules/todo/todo-stubs');

// Communicate with globally exposed app
var app = window.SPA.app;
app.dependencies.unshift('appStubs'); // Run first

angular.module('appStubs', ['ngMockE2E']).run(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend, $log) {
    $log.debug('[Run] HTTP stubs setup...');

    // Language bundles
    $httpBackend.whenGET(/^\/lang\//).passThrough();

    // Todo module
    todoStubs($httpBackend, $log);
}
