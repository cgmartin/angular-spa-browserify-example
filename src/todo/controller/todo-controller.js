'use strict';

var TodoItem = require('../model/todo-item');

module.exports = TodoController;

// @ngInject
function TodoController($scope, todoStorage, filterFilter) {
    var _this = this;
    this.todos = [];
    this.newTodoTitle = '';
    this.editTodo = null;
    this.statusFilter = null;

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;

    todoStorage.get().then(function(data) {
        _this.todos.splice(0, Number.MAX_VALUE);
        _this.todos.push.apply(_this.todos, data);
        _this.onTodoChanges();
    });

    this.onTodoChanges = function(save) {
        this.remainingCount = filterFilter(this.todos, {isComplete: false}).length;
        this.doneCount = this.todos.length - this.remainingCount;
        this.allChecked = !this.remainingCount;
        if (save) { todoStorage.put(this.todos); }
    };

    this.addNewTodo = function() {
        var newTodoTitle = this.newTodoTitle.trim();
        if (!newTodoTitle.length) {
            return;
        }
        this.todos.push(new TodoItem(newTodoTitle, false));
        this.newTodoTitle = '';
        this.onTodoChanges(true);
    };

    this.removeTodo = function(todo) {
        this.todos.splice(this.todos.indexOf(todo), 1);
        this.onTodoChanges(true);
    };

    this.addTodo = function(todo) {
        if (!todo.title.length) {
            return;
        }
        todo.id = new Date().getTime();
        this.todos.push(todo);
        this.onTodoChanges(true);
    };

    this.beginEditTodo = function(todo) {
        this.editTodo = todo;
    };

    this.endEditTodo = function(todo) {
        this.editTodo = null;
        todo.title = todo.title.trim();
        if (!todo.title) {
            this.removeTodo(todo);
        } else {
            this.onTodoChanges(true);
        }
    };

    this.toggleCompleted = function(todoItem) {
        todoItem.isComplete = !todoItem.isComplete;
        this.onTodoChanges(true);
    };

    this.markAllCompleted = function(completed) {
        if (completed === undefined) {
            completed = true;
        }
        this.todos.forEach(function(todoItem) {
            todoItem.isComplete = completed;
        });
        this.onTodoChanges(true);
    };

    this.clearCompleted = function() {
        this.todos = this.todos.filter(function(todoItem) {
            return !todoItem.isComplete;
        });
        this.onTodoChanges(true);
    };
}
