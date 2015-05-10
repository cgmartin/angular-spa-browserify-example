/*jshint -W098 */
require('angular-mocks');

console.log('[Boot] Loading stubs...');
var app = window.SPA.app;
app.addDependency('ngMockE2E');
app.addRun(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend) {
    console.log('[Run] Defining http stubs...');
    // GET: /todos
    var todos = [{title: 'Todo1'}, {title: 'Todo2'}];
    $httpBackend.whenGET('/todos').respond(todos);

    //$httpBackend.whenGET(/^\/templates\//).passThrough();
}
