'use strict';

module.exports = TodoStorage;

// @ngInject
function TodoStorage($http) {
    this.get = function() {
        return $http({
            method: 'get',
            url: '/api/todos',
            useAuthorization: true
        }).then(function(result) {
            return result.data;
        });
    };

    this.put = function(todos) {
        return $http({
            method: 'post',
            url: '/api/todos',
            data: todos,
            useAuthorization: true
        }).then(function(result) {
            return result.data;
        });
    };
}

