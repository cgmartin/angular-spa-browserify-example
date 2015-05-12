'use strict';

var TodoItem = require('../model/todo-item');

module.exports = TodoController;

// @ngInject
function TodoController($scope, todoStorage, filterFilter, $log) {
    var _this = this;
    this.$scope = $scope;
    this.todoStorage = todoStorage;
    this.filterFilter = filterFilter;
    this.$log = $log;
    this.todos = $scope.todos = todoStorage.get();
    $scope.newTodoTitle = '';
    $scope.editTodo = null;
    $scope.statusFilter = null;

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;

    // watching for events/changes in scope, which are caused by view/user input
    // if you subscribe to scope or event with lifetime longer than this controller, make sure you unsubscribe.
    $scope.$watch('todos', function() {
        return _this.onTodos();
    }, true);
}

TodoController.prototype.onTodos = function() {
    this.$scope.remainingCount = this.filterFilter(this.todos, {isComplete: false}).length;
    this.$scope.doneCount = this.todos.length - this.$scope.remainingCount;
    this.$scope.allChecked = !this.$scope.remainingCount;
    this.todoStorage.put(this.todos);
};

TodoController.prototype.addNewTodo = function() {
    var newTodoTitle = this.$scope.newTodoTitle.trim();
    if (!newTodoTitle.length) {
        return;
    }
    this.todos.push(new TodoItem(newTodoTitle, false));
    this.$scope.newTodoTitle = '';
};

TodoController.prototype.removeTodo = function(todo) {
    this.todos.splice(this.todos.indexOf(todo), 1);
};

TodoController.prototype.addTodo = function(todo) {
    if (!todo.title.length) {
        return;
    }
    todo.id = new Date().getTime();
    this.todos.push(todo);
};

TodoController.prototype.beginEditTodo = function(todo) {
    this.$scope.editTodo = todo;
};

TodoController.prototype.endEditTodo = function(todo) {
    this.$scope.editTodo = null;
    todo.title = todo.title.trim();
    if (!todo.title) {
        this.removeTodo(todo);
    }
};

TodoController.prototype.toggleCompleted = function(todoItem) {
    todoItem.isComplete = !todoItem.isComplete;
};

TodoController.prototype.markAllCompleted = function(completed) {
    if (completed === undefined) {
        completed = true;
    }
    this.todos.forEach(function(todoItem) {
        todoItem.isComplete = completed;
    });
};

TodoController.prototype.clearCompleted = function() {
    this.$scope.todos = this.todos =
        this.todos.filter(function(todoItem) {
            return !todoItem.isComplete;
        });
};
