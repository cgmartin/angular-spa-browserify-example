'use strict';

module.exports = TokenStorage;

// @ngInject
function TokenStorage() {
    this.getAccessToken = function() {
        return localStorage.getItem('access_token');
    };

    this.setAccessToken = function(token) {
        localStorage.setItem('access_token', token);
    };

    this.deleteAccessToken = function() {
        localStorage.removeItem('access_token');
    };

    this.getRefreshToken = function() {
        return localStorage.getItem('refresh_token');
    };

    this.setRefreshToken = function(token) {
        localStorage.setItem('refresh_token', token);
    };

    this.deleteRefreshToken = function() {
        localStorage.removeItem('refresh_token');
    };

    this.deleteTokens = function() {
        this.deleteAccessToken();
        this.deleteRefreshToken();
    };
}

