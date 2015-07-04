'use strict';

module.exports = JwtInterceptorProvider;

// Forked from https://github.com/auth0/angular-jwt
// @ngInject
function JwtInterceptorProvider() {
    this.urlParam = null;
    this.authHeader = 'Authorization';
    this.authPrefix = 'Bearer ';
    this.tokenGetter = function() {
        return null;
    };

    var config = this;

    this.$get = /* @ngInject */ function($q, $injector, $rootScope) {
        return {
            request: function(request) {
                if (!request.useAuthorization) {
                    return request;
                }

                if (config.urlParam) {
                    request.params = request.params || {};
                    // Already has the token in the url itself
                    if (request.params[config.urlParam]) {
                        return request;
                    }
                } else {
                    request.headers = request.headers || {};
                    // Already has an Authorization header
                    if (request.headers[config.authHeader]) {
                        return request;
                    }
                }

                var tokenPromise = $q.when($injector.invoke(config.tokenGetter, this, {
                    config: request
                }));

                return tokenPromise.then(function(token) {
                    if (token) {
                        if (config.urlParam) {
                            request.params[config.urlParam] = token;
                        } else {
                            request.headers[config.authHeader] = config.authPrefix + token;
                        }
                    }
                    return request;
                });
            },
            responseError: function(response) {
                // handle the case where the user is not authenticated
                if (response.status === 401) {
                    $rootScope.$broadcast('unauthenticated');
                } else if (response.status === 403) {
                    $rootScope.$broadcast('unauthorized');
                }
                return $q.reject(response);
            }
        };
    };
}
