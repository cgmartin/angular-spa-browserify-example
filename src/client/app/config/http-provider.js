'use strict';

module.exports = httpProvider;

/**
 * Configures the $httpProvider with base url interceptor
 */
// @ngInject
function httpProvider($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.interceptors.push(baseUrlInterceptor);
}

/**
 * Adds a configurable base url to http requests
 */
// @ngInject
function baseUrlInterceptor(bootConfig) {
    return {
        request: function(reqCfg) {
            // Only process api prefixed urls
            if (reqCfg.url.match(/^\/api\//)) {
                var baseUrl = bootConfig.apiBaseUrl || '';
                reqCfg.url = baseUrl + reqCfg.url;
            }
            return reqCfg;
        }
    };
}
