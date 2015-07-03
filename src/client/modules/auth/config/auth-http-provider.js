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
function tokenGetter(config, authService, jwtHelper) {
    // Return access token if not expired
    var accessToken = authService.getAccessToken();
    if (config.ignoreExpiredToken || (accessToken && !jwtHelper.isTokenExpired(accessToken))) {
        return accessToken;
    }

    // Use refresh token to get new access token
    return authService.extendSession();
}
