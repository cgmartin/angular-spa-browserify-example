'use strict';

module.exports = TodoStorage;

// @ngInject
function TodoStorage($http) {
    this.get = function() {
        return $http({
            method: 'get',
            url: '/todos',
            useBaseUrl: true,
            useAuthorization: true
        }).then(function(result) {
            return result.data;
        });
    };

    this.put = function(todos) {
        return $http({
            method: 'post',
            url: '/todos',
            data: todos,
            useBaseUrl: true,
            useAuthorization: true
        }).then(function(result) {
            return result.data;
        });
    };
}

