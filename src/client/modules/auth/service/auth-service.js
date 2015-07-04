// jshint -W098
'use strict';

module.exports = AuthService;

// @ngInject
function AuthService($http, tokenStorage, jwtHelper, $rootScope) {
    var _this = this;

    this.login = function(authData) {
        return $http({
            url: '/api/auth/access-tokens',
            method: 'POST',
            data: authData
        }).then(processTokenResponse);
    };

    this.extendSession = function() {
        var refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) { return null; }
        return $http({
            url: '/api/auth/refresh-tokens',
            useAuthorization: true,
            ignoreExpiredToken: true,
            method: 'POST',
            data: {
                refreshToken: refreshToken
            }
        }).then(processTokenResponse);
    };

    function processTokenResponse(response) {
        var tokenData = response.data;
        // Store token data in session
        tokenStorage.setAccessToken(tokenData.token);
        tokenStorage.setRefreshToken(tokenData.refreshToken);
        $rootScope.$broadcast('authenticated', {user: _this.getLoggedInUser()});
        return tokenData.token;
    }

    this.getAccessToken = function() {
        return tokenStorage.getAccessToken();
    };

    this.logout = function() {
        return $http({
            url: '/api/auth/refresh-tokens/' + tokenStorage.getRefreshToken(),
            useAuthorization: true,
            ignoreExpiredToken: true,
            method: 'DELETE'
        }).finally(function() {
            // Delete token data from store regardless of backend error
            tokenStorage.deleteTokens();
            $rootScope.$broadcast('deauthenticated'); // This is a different event than 'unauthenticated'
        });
    };

    this.isLoggedIn = function() {
        // Check if token is in store
        return (!!tokenStorage.getAccessToken());
    };

    this.getLoggedInUser = function() {
        var token = tokenStorage.getAccessToken();
        if (!token) { return null; }

        var jwtData = jwtHelper.decodeToken(token);
        return jwtData.user;
    };

    this.isAuthorized = function(authScope) {
        //var user = _this.getLoggedInUser();
        throw new Error('Not implemented');
    };
}

