'use strict';

var taffy = require('taffydb').taffy;

module.exports = todoStubs;

function todoStubs($httpBackend, $log) {
    $log.debug('[Run] Adding todo stubs...');

    // Simulate CRUD in client with TaffyDB
    // http://www.taffydb.com/writingqueries
    var todoDb = taffy();
    todoDb.store('todos');

    // Seed empty data
    if (todoDb().count() === 0) {
        todoDb.insert([
            {title: 'Do something', isComplete: true},
            {title: 'Do something else', isComplete: false}
        ]);
    }

    // GET: /todos
    $httpBackend.whenGET('/api/todos').respond(function() {
        return [200, todoDb().get(), {}];
    });

    // POST: /todos
    $httpBackend.whenPOST('/api/todos').respond(function(method, url, data) {
        var todos = JSON.parse(data);
        todoDb().remove();
        todoDb.insert(todos);
        return [200, { status: true }, {}];
    });
}
