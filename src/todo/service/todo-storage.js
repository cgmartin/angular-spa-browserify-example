'use strict';

module.exports = TodoStorage;

// @ngInject
function TodoStorage($http, $log) {
    this.STORAGE_ID = 'ngSPA-todos';

    this.get = function() {
        return $http.get('/todos').then(function(result) {
            $log.debug('GET', result);
            return result.data;
        });
    };

    this.put = function(todos) {
        return $http.post('/todos', todos).then(function(result) {
            $log.debug('POST', result);
            return result.data;
        });
    };
}

