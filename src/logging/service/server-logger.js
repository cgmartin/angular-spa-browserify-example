'use strict';

var angular = require('angular');
var $ = require('jquery');

module.exports = ServerLogger;

/**
 * Server-side logging service, sends logs to server in bulk at configured interval
 */
function ServerLogger(loggingLevel, logLevels, session, $log, $window, config) {
    var logQueue = [];

    this.error = function(message) {
        $log.error.apply($log, arguments);
        if (loggingLevel <= logLevels.ERROR) {
            this.logToServer({message: message, type: 'error'});
        }
    };

    this.info = function(message) {
        $log.info.apply($log, arguments);
        if (loggingLevel <= logLevels.INFO) {
            this.logToServer({message: message, type: 'info'});
        }
    };

    this.debug = function(message) {
        $log.debug.apply($log, arguments);
        if (loggingLevel <= logLevels.DEBUG) {
            this.logToServer({message: message, type: 'debug'});
        }
    };

    this.logToServer = function(data) {
        var now = new Date();
        data.time = now.toUTCString();
        data.url = $window.location.href;

        // Check for adjacent dupes
        var prev = (logQueue.length > 0) ? logQueue[logQueue.length - 1] : {};
        if (prev.message === data.message &&
            prev.type === data.type &&
            prev.url === data.url
        ) {
            prev.count = (prev.count) ? prev.count + 1 : 2;
        } else {
            logQueue.push(data);
        }
    };

    // Bulk send logs on interval
    setInterval(sendLogs, config.serverLoggingInterval);

    function sendLogs() {
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
