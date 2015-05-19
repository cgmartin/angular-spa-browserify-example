'use strict';

var angular = require('angular');
var $ = require('jquery');

module.exports = ServerLogger;

/**
 * Server-side logging service, sends logs to server in bulk at configured interval
 */
function ServerLogger(loggerConfig, logLevels, session, traceService, $log, $window, config) {
    var logQueue = [];

    this.log = function(message, meta, level) {
        level = level || 'debug';
        var logItem = {
            times: [(new Date()).getTime()],
            loc:   $window.location.href,
            msg:   message,
            meta:  meta,
            level: level
        };
        $log[level].call($log, 'ServerLogger: ' + message, meta);
        if (loggerConfig.loggingLevel <= logLevels[level.toUpperCase()]) {
            // TODO: consider other filters (regex, ip, user agents, etc.)
            addLogToQueue(logItem);
        }
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
            type:    'exception',
            message: error.message,
            stack:   traceService.print({e: error}),
            name:    error.name,
            data:    error.data
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
            to:    {url: fromState.url, name: fromState.name, params: fromParams}
        };
        if (fromState.startTime) {
            meta.timing = nowTime - fromState.startTime;
        } else {
            fromState.startTime = nowTime;
        }
        this[level](message, meta);
    };

    function addLogToQueue(logItem) {
        // Check for adjacent dupes
        var prev = (logQueue.length > 0) ? logQueue[logQueue.length - 1] : {};
        if (angular.equals(prev.message, logItem.message) &&
            angular.equals(prev.level, logItem.level) &&
            angular.equals(prev.loc, logItem.loc) &&
            angular.equals(prev.meta, logItem.meta)
        ) {
            prev.times.push(logItem.times[0]);
        } else {
            logQueue.push(logItem);
        }

        // TODO: consider dropping items off bottom of stack per max buffer size
    }

    // Bulk send logs on interval
    setInterval(sendData, config.serverLoggingInterval);

    function sendData() {
        // TODO: consider sending logs when reaching queue size threshold
        // or if queue contains an error
        if (logQueue.length === 0) { return; }

        // use AJAX (in this example jQuery) and NOT
        // an angular service such as $http
        var baseUrl = config.apiBaseUrl || '';
        var url = baseUrl + '/api/logs';
        var headers = {
            ConversationId: session.conversationId
        };

        var data = logQueue.splice(0, Number.MAX_VALUE);

        if (config.isStubsEnabled) {
            $log.debug('ServerLogger [sendData]: ajax 200 POST', url, 'headers:', headers, 'reqData:', data);
        } else {
            // TODO: Implement exponential back off with failures
            $.ajax({
                type:        'POST',
                url:         url,
                contentType: 'application/json',
                data:        angular.toJson(data),
                headers:     headers
            })
            .fail(function ajaxFailed(jqXHR, textStatus, error) {
                $log.warn('ServerLogger failure', error);
                // Put logs back on the front of the queue
                logQueue.unshift.apply(logQueue, data);
            });
        }
    }
}
