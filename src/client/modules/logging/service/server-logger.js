/*jshint -W098 */
'use strict';

var angular = require('angular');
var createXhr = require('../lib/create-xhr');

module.exports = ServerLogger;

/**
 * Server-side logging service, sends logs to server in bulk at configured interval
 */
function ServerLogger(
    loggerConfig, logLevels, interceptorFactories, traceService,
    $locale, $translate, $log, $window, $injector
) {
    var _this = this;
    var sessionStorageKey = 'ngSpa_serverLogger_log';
    var logQueue = [];
    var sendDataIntervalId = null;

    /**
     * Interceptors stored in reverse order. Inner interceptors before outer interceptors.
     * The reversal is needed so that we can build up the interception chain around the
     * log action.
     */
    var reversedInterceptors = [];
    angular.forEach(interceptorFactories, function(interceptorFactory) {
        reversedInterceptors.unshift(angular.isString(interceptorFactory) ?
            $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
    });

    // Start up the periodic flush of the log queue to server
    startInterval();

    // Load unsent logs from previous page load
    if ($window.sessionStorage) {
        try {
            logQueue = angular.fromJson($window.sessionStorage.getItem(sessionStorageKey) || '[]');
        } catch (ex) {}
        if (!Array.isArray(logQueue)) {
            logQueue = [];
        }
    }

    // Bulk send logs on interval
    this.startInterval = startInterval;
    function startInterval() {
        if (sendDataIntervalId || !loggerConfig.isLoggingEnabled) { return; }
        sendDataIntervalId = $window.setInterval(sendData, loggerConfig.loggingInterval);
    }

    this.stopInterval = function() {
        $window.clearInterval(sendDataIntervalId);
        sendDataIntervalId = null;
    };

    // Exposes this.error(), this.info(), and this.debug() functions
    angular.forEach(['error', 'info', 'debug'], function(fnName) {
        _this[fnName] = function(message, meta) {
            _this.log(message, meta, fnName);
        };
    });

    this.trackError = function(error) {
        var meta = {
            type:    error.type || 'exception',
            message: error.message,
            stack:   traceService.print({e: error}),
            name:    error.name
        };
        if (error.data) {
            meta.data = error.data;
        }
        this.error(error.message, meta);
    };

    this.trackMetric = function(name, metric) {
        this.info('metric:' + name, {
            type: 'metric',
            name: name,
            metric: metric
        });
    };

    this.trackEvent = function(name, data) {
        this.info('event:' + name, {
            type: 'event',
            name: name,
            data: data
        });
    };

    this.trackAjax = function(httpObj, timing) {
        this.info(
            'ajax ' + httpObj.status + ' ' + httpObj.config.method + ' ' + httpObj.config.url, {
                type:  'ajax',
                status: httpObj.status,
                method: httpObj.config.method,
                reqUrl: httpObj.config.url,
                timing: timing
            });
    };

    this.trackStateChange = function(level, event, toState, toParams, fromState, fromParams) {
        var toUrl = toState.url || '-none-';
        var toName = toState.name || toState.to || '';
        var message = 'route:' + event + ' -> ' + toUrl + ' (' + toName + ')';
        var nowTime = (new Date()).getTime();
        var meta = {
            type: 'route',
            event: event,
            from:  fromState.name,
            to:    toState.name
        };
        if (event === 'start') {
            fromState.startTime = nowTime;
        } else if (fromState.startTime) {
            meta.timing = nowTime - fromState.startTime;
        }
        this.log(message, meta, level);
    };

    this.log = function(message, meta, level) {
        if (!loggerConfig.isLoggingEnabled) { return; }

        meta = angular.extend({}, meta);

        // Proxy to console log
        if (loggerConfig.isConsoleLogEnabled) {
            $log[level].call($log, 'ServerLogger: ' + message, meta);
        }

        // Filter logs based on log level or excluded types
        if ((loggerConfig.loggingLevel <= logLevels[level.toUpperCase()]) &&
            (loggerConfig.excludeTypes.indexOf(meta.type || '') === -1)
        ) {
            level = validateLogLevel(level);
            var logItem = {
                time:  (new Date()).getTime(),
                loc:   $window.location.href,
                msg:   message,
                meta:  meta,
                level: level
            };

            addLogToQueue(logItem);
        }
    };

    function validateLogLevel(level) {
        if (!level || !logLevels[level.toUpperCase()]) {
            level = 'debug';
        }
        return level;
    }

    function addLogToQueue(logItem) {
        // Apply log interceptors
        angular.forEach(reversedInterceptors, function(interceptor) {
            if (interceptor.log) { interceptor.log(logItem); }
        });

        logQueue.push(logItem);
        saveLogQueue();
    }

    function saveLogQueue() {
        // Drop older items off back of stack per max buffer size
        if (logQueue.length > loggerConfig.maxBufferSize) {
            logQueue.splice(0, logQueue.length - loggerConfig.maxBufferSize);
        }

        if ($window.sessionStorage) {
            try {
                $window.sessionStorage.setItem(sessionStorageKey, angular.toJson(logQueue));
            } catch (ex) {
                if (loggerConfig.isConsoleLogEnabled) { $log.warn(ex); }
            }
        }
    }

    /**
     * Sends queue of log items to server in bulk.
     * WARNING: Do not use $http or else logger interceptor error handling
     * and request logging can wack things out.
     */
    function sendData() {
        if (logQueue.length === 0) { return; }

        var baseUrl = loggerConfig.apiBaseUrl || '';

        var logReqCfg = {};
        logReqCfg.url = baseUrl + loggerConfig.apiUrl;
        logReqCfg.headers = {
            'X-Requested-With': 'XMLHttpRequest'
        };
        logReqCfg.data = {
            device: 'browser',
            appver: loggerConfig.appVersion,
            locale: $locale.id,
            lang: $translate.use(),
            screen: $window.screen.availWidth + 'x' + $window.screen.availHeight,
            logs: logQueue.splice(0, Number.MAX_VALUE) // Send all logs in queue
        };

        // Apply sendData interceptors
        // TODO: Consider promises.
        // Current preference is to keep it simple and not introduce any async failures
        // that could interrupt the log request
        angular.forEach(reversedInterceptors, function(interceptor) {
            if (interceptor.sendData) { interceptor.sendData(logReqCfg); }
        });

        if (loggerConfig.isStubsEnabled) {
            $log.debug('%cServerLogger => ajax 200 POST ' + logReqCfg.url,
                'background:yellow; color:blue', 'reqData:', logReqCfg.data);
            saveLogQueue();

        } else {
            var request = createXhr();
            request.open('POST', logReqCfg.url, true);
            request.timeout = Math.min(loggerConfig.loggingInterval, 60000);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            angular.forEach(logReqCfg.headers, function(val, key) {
                request.setRequestHeader(key, val);
            });
            request.onreadystatechange = function xhrReadyStateChange() {
                if (this.readyState === 4) {
                    var success = (this.status >= 200 && this.status < 400);
                    if (!success && this.status !== 413) {
                        // Put logs back on the front of the queue...
                        // But not if the server is complaining the request size is too large
                        // via 413 (Request Entity Too Large) error
                        $log.debug('sendlog unsuccessful');
                        logQueue.unshift.apply(logQueue, logReqCfg.data.logs);
                    }
                    saveLogQueue();
                }
            };
            request.send(angular.toJson(logReqCfg.data));
            request = null;
        }
    }
}
