'use strict';

module.exports = todoStubs;

function todoStubs($httpBackend, $log) {
    $log.debug('[Run] Adding todo stubs...');

    // Example using localStorage as proxy data store
    var STORAGE_ID = 'ngSPA-todos';
    var todos = JSON.parse(localStorage.getItem(STORAGE_ID) || 'false');
    todos = todos || [
        {title: 'Do something', isComplete: true},
        {title: 'Do something else', isComplete: false}
    ];

    // GET: /todos
    $httpBackend.whenGET('/todos').respond(todos);

    // POST: /todos
    $httpBackend.whenPOST('/todos').respond(function(method, url, data) {
        var newTodos = JSON.parse(data);
        todos.splice(0, Number.MAX_VALUE); // remove elements
        todos.push.apply(todos, newTodos);
        localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
        return [200, todos, {}];
    });
}
