/*jshint -W098 */
require('angular-mocks');
var todoStubs = require('./todo/todo-stubs');

// Communicate with globally exposed app
var app = window.SPA.app;
app.addDependency('ngMockE2E');
app.addRun(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend, $log) {
    $log.debug('[Run] HTTP stubs setup...');

    // Language bundles
    $httpBackend.whenGET(/^\/lang\//).passThrough();

    // Todo module
    todoStubs($httpBackend, $log);
}
