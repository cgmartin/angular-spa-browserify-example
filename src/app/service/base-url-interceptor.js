'use strict';

module.exports = BaseUrlInterceptor;

/**
 * Adds a configurable base url to http requests
 */
// @ngInject
function BaseUrlInterceptor(bootConfig) {
    this.request = function(reqCfg) {
        // Skip full urls
        if (reqCfg.url.indexOf('http') !== 0) {
            var baseUrl = bootConfig.apiBaseUrl || '';
            reqCfg.url = baseUrl + reqCfg.url;
        }
        return reqCfg;
    };
}

