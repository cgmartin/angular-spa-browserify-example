'use strict';

module.exports = BaseUrlInterceptor;

// @ngInject
function BaseUrlInterceptor(config) {
    this.request = function(reqCfg) {
        // Skip full urls
        if (reqCfg.url.indexOf('http') !== 0) {
            var baseUrl = config.apiBaseUrl || '';
            reqCfg.url = baseUrl + reqCfg.url;
        }
        return reqCfg;
    };
}

