'use strict';

module.exports = TodoStorage;

// @ngInject
function TodoStorage($http) {
    this.get = function() {
        return $http.get('/api/todos').then(function(result) {
            return result.data;
        });
    };

    this.put = function(todos) {
        return $http.post('/api/todos', todos).then(function(result) {
            return result.data;
        });
    };
}

