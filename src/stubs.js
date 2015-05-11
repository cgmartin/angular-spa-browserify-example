/*jshint -W098 */
require('angular-mocks');

// Communicate with globally exposed app
var app = window.SPA.app;
app.addDependency('ngMockE2E');
app.addRun(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend, $log) {
    $log.debug('[Run] HTTP stubs setup...');

    // GET: /todos
    var todos = [{title: 'Todo1'}, {title: 'Todo2'}];
    $httpBackend.whenGET('/todos').respond(todos);

    // Language bundles
    $httpBackend.whenGET(/^\/lang\//).passThrough();
}
