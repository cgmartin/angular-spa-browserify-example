'use strict';

module.exports = configHttpLogging;

/**
 * Configures the $httpProvider with logging interceptor
 */
// @ngInject
function configHttpLogging($httpProvider) {
    $httpProvider.interceptors.push(httpLoggerInterceptor);
}

/**
 * Provides server logging for $http request/response phases
 *
 * http://onehungrymind.com/winning-http-interceptors-angularjs/
 * http://www.webdeveasy.com/interceptors-in-angularjs-and-useful-examples/
 * http://www.codelord.net/2014/06/25/generic-error-handling-in-angularjs/
 */
// @ngInject
function httpLoggerInterceptor($q, serverLogger) {

    var timer = Date.now.bind(Date);

    return {
        // Before request is called
        // Can return config or promise containing config
        request: function(reqCfg) {
            if (!reqCfg || reqCfg.skipLogging) {
                return reqCfg;
            }
            reqCfg.startTime = timer();
            return reqCfg;
        },

        // On request failure
        // Called when a previous interceptor threw an error
        // or resolved with a rejection.
        requestError: function(rejection) {
            return $q.reject(rejection); // Do nothing, no-op
        },

        // Upon successful response
        // Can return response or promise containing response
        response: function(res) {
            logServerInfo(res);
            return res;
        },

        // Upon unsuccessful response
        responseError: function(rejection) {
            logServerInfo(rejection);
            // Do nothing, no-op
            return $q.reject(rejection);
        }
    };

    function logServerInfo(obj) {
        // Don't log requests that were retrieved from cache
        if (!obj.config || obj.config.cache || obj.config.skipLogging) { return; }

        var timeDiff = timer() - obj.config.startTime;
        serverLogger.trackAjax(obj, timeDiff);
    }
}
