'use strict';

module.exports = httpLoadingConfig;

/**
 * Configures the $httpProvider with additional interceptors
 */
// @ngInject
function httpLoadingConfig($httpProvider) {
    $httpProvider.interceptors.push(httpLoadingInterceptor);
}

/**
 * Intercepts lengthy http calls to show a loading indicator
 */
// @ngInject
function httpLoadingInterceptor($q, loadingConfig, $injector, $timeout, $rootScope, $log) {

    var requestsInProgress = 0;
    var startTimeout;

    return {
        // Before request is called
        // Can return config or promise containing config
        request: function(reqCfg) {
            if (!shouldHandleRequest(reqCfg)) {
                return reqCfg;
            }

            $log.debug('Request: ', reqCfg.url);
            $rootScope.$broadcast('loadingIndicator:loading', {url: reqCfg.url});
            if (!requestsInProgress) {
                $log.debug('Starting loading indicator');
                var loadingIndicator = $injector.get('loadingIndicator');
                startTimeout = $timeout(function() {
                    loadingIndicator.show();
                }, loadingConfig.latencyThreshold);
            }
            reqCfg.loadingIndicator = true;
            requestsInProgress++;
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
            if (!res.config || !res.config.loadingIndicator) {
                return res;
            }

            requestsInProgress--;
            $rootScope.$broadcast('loadingIndicator:loaded', {url: res.config.url, result: res});
            if (requestsInProgress <= 0) {
                $log.debug('END Request: ', res.config.url);
                setLoadingComplete();
            }

            return res;
        },

        // Upon unsuccessful response
        responseError: function(rejection) {
            if (!rejection.config || !rejection.config.loadingIndicator) {
                return $q.reject(rejection); // Do nothing, no-op
            }

            $log.debug('ERROR Request: ', rejection.config.url);
            requestsInProgress--;
            $rootScope.$broadcast('loadingIndicator:loaded', {url: rejection.config.url, result: rejection});
            if (requestsInProgress <= 0) {
                setLoadingComplete();
            }

            return $q.reject(rejection);
        }
    };

    function shouldHandleRequest(reqCfg) {
        return (
            reqCfg &&
            !reqCfg.skipLoadingIndicator &&
            reqCfg.url !== loadingConfig.dialogTemplateUrl
        );
    }

    function setLoadingComplete() {
        $timeout.cancel(startTimeout);
        $injector.get('loadingIndicator').hide();
        requestsInProgress = 0;
        $log.debug('Loading Indicator Complete');
    }
}
