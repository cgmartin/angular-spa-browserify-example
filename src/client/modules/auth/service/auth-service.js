'use strict';

module.exports = AuthService;

// @ngInject
function AuthService($http, tokenStorage, jwtHelper) {
    this.login = function(authData) {
        return $http({
            url: '/api/auth/access-tokens',
            skipAuthorization: true,
            method: 'POST',
            data: authData
        }).then(function(result) {
            var tokenData = result.data;
            // Store token data in session
            tokenStorage.setAccessToken(tokenData.token);
            tokenStorage.setRefreshToken(tokenData.refreshToken);
            return tokenData;
        });
    };

    this.logout = function() {
        // Delete token data from store
        tokenStorage.deleteTokens();
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
}

