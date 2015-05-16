'use strict';

module.exports = BaseUrlInterceptor;

// @ngInject
function BaseUrlInterceptor(config) {
    this.request = function(req) {
        // Skip full urls
        if (req.url.indexOf('http') !== 0) {
            var baseUrl = config.apiBaseUrl || '';
            req.url = baseUrl + req.url;
        }
        return req;
    };
}

