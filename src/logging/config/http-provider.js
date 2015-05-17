'use strict';

module.exports = httpProvider;

/**
 * Configures the $httpProvider with logging interceptor
 */
// @ngInject
function httpProvider($httpProvider) {
    $httpProvider.interceptors.push('loggerInterceptor');
}
