'use strict';

module.exports = LoggerInterceptor;

// http://onehungrymind.com/winning-http-interceptors-angularjs/
// http://www.webdeveasy.com/interceptors-in-angularjs-and-useful-examples/
// http://www.codelord.net/2014/06/25/generic-error-handling-in-angularjs/

// @ngInject
function LoggerInterceptor($q, serverLogger) {

    // use the high-res timer if available
    var timer = performance ?
        performance.now.bind(performance) :
        Date.now.bind(Date);

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
        var timeDiff = timer() - res.config.startTime;
        serverLogger.info(
            'Response success ' + res.config.method + ' ' +
            res.config.url + ' ' + timeDiff
        );
        return res;
    };

    // Upon unsuccessful response
    this.responseError = function(rejection) {
        var timeDiff = timer() - rejection.config.startTime;
        serverLogger.info(
            'Response failure ' + rejection.config.method + ' ' +
            rejection.config.url + ' ' + rejection.status + ' ' + timeDiff
        );

        // Do nothing, no-op
        return $q.reject(rejection);
    };
}

