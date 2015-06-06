'use strict';

module.exports = BaseUrlInterceptor;

/**
 * Adds a configurable base url to http requests
 */
// @ngInject
function BaseUrlInterceptor(bootConfig) {
    this.request = function(reqCfg) {
        // Only process api prefixed urls
        if (reqCfg.url.match(/^\/api\//)) {
            var baseUrl = bootConfig.apiBaseUrl || '';
            reqCfg.url = baseUrl + reqCfg.url;
        }
        return reqCfg;
    };
}

