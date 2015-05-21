'use strict';

var angular = require('angular');
var createXhr = require('../lib/create-xhr');

module.exports = ServerLogger;

/**
 * Server-side logging service, sends logs to server in bulk at configured interval
 */
function ServerLogger(loggerConfig, logLevels, session, traceService, $locale, $translate, $log, $window) {
    var sessionStorageKey = 'ngSpa_serverLogger_log';
    var logQueue = [];
    var sendDataIntervalId = null;

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
        if (sendDataIntervalId) { return; }
        sendDataIntervalId = $window.setInterval(sendData, loggerConfig.loggingInterval);
    }

    this.stopInterval = function() {
        $window.clearInterval(sendDataIntervalId);
        sendDataIntervalId = null;
    };

    this.error = function(message, meta) {
        this.log(message, meta, 'error');
    };

    this.info = function(message, meta) {
        this.log(message, meta, 'info');
    };

    this.debug = function(message, meta) {
        this.log(message, meta, 'debug');
    };

    this.trackError = function(error) {
        this.error(error.message, {
            type:    error.type || 'exception',
            message: error.message,
            stack:   traceService.print({e: error}),
            name:    error.name,
            data:    error.data
        });
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
            from:  {url: fromState.url, name: fromState.name, params: fromParams},
            to:    {url: toState.url,   name: toState.name,   params: toParams}
        };
        if (event === 'start') {
            fromState.startTime = nowTime;
        } else if (fromState.startTime) {
            meta.timing = nowTime - fromState.startTime;
        }
        this.log(message, meta, level);
    };

    this.log = function(message, meta, level) {
        meta = meta || {};
        level = validateLogLevel(level);
        var logItem = {
            time:  (new Date()).getTime(),
            loc:   $window.location.href,
            msg:   message,
            meta:  meta,
            level: level
        };
        $log[level].call($log, 'ServerLogger: ' + message, meta);

        if ((loggerConfig.loggingLevel <= logLevels[level.toUpperCase()]) &&
            (loggerConfig.excludeTypes.indexOf(meta.type || '') === -1)
        ) {
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
                $log.warn(ex);
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
        var url = baseUrl + '/api/logs';
        var headers = {
            ConversationId: session.conversationId
        };

        var data = {
            device: 'browser',
            locale: $locale.id,
            lang: $translate.use(),
            resolution: $window.screen.availWidth + 'x' + $window.screen.availHeight,
            logs: logQueue.splice(0, Number.MAX_VALUE) // Send all logs in queue
        };

        if (loggerConfig.isStubsEnabled) {
            $log.debug('%cServerLogger => ajax 200 POST ' + url,
                'background:yellow; color:blue', 'reqData:', data);
            saveLogQueue();

        } else {
            var request = createXhr();
            request.open('POST', url, true);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            angular.forEach(headers, function(val, key) {
                request.setRequestHeader(key, val);
            });
            request.onreadystatechange = function xhrReadyStateChange() {
                if (this.readyState === 4) {
                    var success = (this.status >= 200 && this.status < 400);
                    if (!success) {
                        // Put logs back on the front of the queue
                        logQueue.unshift.apply(logQueue, data.logs);
                    }
                    saveLogQueue();
                }
            };
            request.send(angular.toJson(data));
            request = null;
        }
    }
}
