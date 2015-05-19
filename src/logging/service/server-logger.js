'use strict';

var angular = require('angular');
var $ = require('jquery');

module.exports = ServerLogger;

/**
 * Server-side logging service, sends logs to server in bulk at configured interval
 */
function ServerLogger(loggingLevel, logLevels, session, $log, $window, config) {
    var logQueue = [];

    function normalizeMessage(message, type) {
        var data = message;
        if (angular.isString(message)) {
            data = { message: message };
        }
        data.type = type;
        return data;
    }

    this.error = function(message) {
        var data = normalizeMessage(message, 'error');
        var args = Array.prototype.slice.call(arguments);
        args.unshift('ServerLog: ' + data.message);
        $log.error.apply($log, args);
        if (loggingLevel <= logLevels.ERROR) {
            this.logToServer(data);
        }
    };

    this.info = function(message) {
        var data = normalizeMessage(message, 'info');
        var args = Array.prototype.slice.call(arguments);
        args.unshift('ServerLog: ' + data.message);
        $log.info.apply($log, args);
        if (loggingLevel <= logLevels.INFO) {
            this.logToServer(data);
        }
    };

    this.debug = function(message) {
        var data = normalizeMessage(message, 'debug');
        var args = Array.prototype.slice.call(arguments);
        args.unshift('ServerLog: ' + data.message);
        $log.debug.apply($log, args);
        if (loggingLevel <= logLevels.DEBUG) {
            this.logToServer(data);
        }
    };

    this.logToServer = function(data) {
        var now = new Date();
        data.times = [now.getTime()];
        data.url = $window.location.href;

        // Check for adjacent dupes
        var prev = (logQueue.length > 0) ? logQueue[logQueue.length - 1] : {};
        if (angular.equals(prev.message, data.message) &&
            prev.type === data.type &&
            prev.url === data.url
        ) {
            prev.times.push(data.times[0]);
        } else {
            logQueue.push(data);
        }
    };

    // Bulk send logs on interval
    setInterval(sendLogs, config.serverLoggingInterval);

    function sendLogs() {
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
            $log.debug('AJAX success POST', url, 'headers:', headers, 'reqData:', data);
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
