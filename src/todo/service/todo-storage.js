'use strict';

module.exports = TodoStorage;

function TodoStorage() {
    this.STORAGE_ID = 'ngSPA-todos';
}
TodoStorage.prototype.get = function() {
    return JSON.parse(localStorage.getItem(this.STORAGE_ID) || '[]');
};
TodoStorage.prototype.put = function(todos) {
    localStorage.setItem(this.STORAGE_ID, JSON.stringify(todos));
};
