'use strict';

module.exports = httpProvider;

/**
 * Configures the $httpProvider with base url interceptor
 */
// @ngInject
function httpProvider($httpProvider) {
    $httpProvider.interceptors.push('baseUrlInterceptor');
}
