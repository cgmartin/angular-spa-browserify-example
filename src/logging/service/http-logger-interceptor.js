'use strict';

module.exports = HttpLoggerInterceptor;

/**
 * Provides server logging for $http request/response phases
 *
 * http://onehungrymind.com/winning-http-interceptors-angularjs/
 * http://www.webdeveasy.com/interceptors-in-angularjs-and-useful-examples/
 * http://www.codelord.net/2014/06/25/generic-error-handling-in-angularjs/
 */
// @ngInject
function HttpLoggerInterceptor($q, serverLogger) {

    var timer = Date.now.bind(Date);

    // Before request is called
    // Can return config or promise containing config
    this.request = function(reqCfg) {
        reqCfg.startTime = timer();
        return reqCfg;
    };

    // On request failure
    // Called when a previous interceptor threw an error
    // or resolved with a rejection.
    this.requestError = function(rejection) {
        return $q.reject(rejection); // Do nothing, no-op
    };

    // Upon successful response
    // Can return response or promise containing response
    this.response = function(res) {
        logServerInfo(res);
        return res;
    };

    // Upon unsuccessful response
    this.responseError = function(rejection) {
        logServerInfo(rejection);
        // Do nothing, no-op
        return $q.reject(rejection);
    };

    function logServerInfo(obj) {
        var timeDiff = timer() - obj.config.startTime;
        serverLogger.info(
            'ajax ' + obj.status + ' ' + obj.config.method + ' ' + obj.config.url, {
                type:     'ajax',
                status:   obj.status,
                method:   obj.config.method,
                reqUrl:   obj.config.url,
                timeDiff: timeDiff
            });
    }
}

