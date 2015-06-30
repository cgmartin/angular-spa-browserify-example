'use strict';

module.exports = authHttpProvider;

/**
 * Configures the $httpProvider with a jwt interceptor
 */
// @ngInject
function authHttpProvider($httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = tokenGetter;
    $httpProvider.interceptors.push('jwtInterceptor');
}

// @ngInject
function tokenGetter(config, tokenStorage, jwtHelper, $http) {
    // Return access token if not expired
    var accessToken = tokenStorage.getAccessToken();
    if (config.isRefreshRequest || (accessToken && !jwtHelper.isTokenExpired(accessToken))) {
        return accessToken;
    }

    // Use refresh token to get new access token
    var refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) { return null; }
    return $http({
        url: '/api/authz/refresh-tokens',
        useAuthorization: true,
        isRefreshRequest: true,
        method: 'POST',
        data: {
            refreshToken: refreshToken
        }
    }).then(function(response) {
        var accessToken = response.data.token;
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(response.data.refreshToken);
        return accessToken;
    });
}
