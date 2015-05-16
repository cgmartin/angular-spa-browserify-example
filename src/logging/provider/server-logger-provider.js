'use strict';

var angular = require('angular');
var $ = require('jquery');

module.exports = ServerLoggerProvider;

// @ngInject
function ServerLoggerProvider() {
    var LOG_LEVEL = this.LOG_LEVEL = {
        ERROR: 3,
        INFO:  2,
        DEBUG: 1
    };

    var serverLoggingLevel = LOG_LEVEL.ERROR;

    this.loggingLevel = function(value) {
        serverLoggingLevel = value;
    };

    this.$get = serverLoggerFactory;

    // @ngInject
    function serverLoggerFactory($log, $window, config) {
        return new ServerLogger(serverLoggingLevel, LOG_LEVEL, $log, $window, config);
    }
}

function ServerLogger(loggingLevel, logLevels, $log, $window, config) {

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
        // use AJAX (in this example jQuery) and NOT
        // an angular service such as $http
        var baseUrl = config.apiBaseUrl || '';
        var url = baseUrl + '/api/logs';
        data.url = $window.location.href;

        if (config.isStubsEnabled) {
            $log.debug('POST', url, data);
        } else {
            $.ajax({
                type:        'POST',
                url:         url,
                contentType: 'application/json',
                data:        angular.toJson(data)
            });
        }
    };
}

