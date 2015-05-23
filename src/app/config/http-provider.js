'use strict';

module.exports = httpProvider;

/**
 * Configures the $httpProvider with base url interceptor
 */
// @ngInject
function httpProvider($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.interceptors.push('baseUrlInterceptor');
}
