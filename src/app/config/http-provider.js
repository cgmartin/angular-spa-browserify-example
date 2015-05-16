'use strict';

module.exports = httpProvider;

// @ngInject
function httpProvider($httpProvider) {
    $httpProvider.interceptors.push('baseUrlInterceptor');
}
