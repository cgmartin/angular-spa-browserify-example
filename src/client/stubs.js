/*jshint -W098,-W089 */
var angular = require('angular');
require('angular-mocks');
var authStubs = require('./modules/auth/auth-stubs');
var todoStubs = require('./modules/todo/todo-stubs');

// Communicate with globally exposed app
var app = window.SPA.app;
app.dependencies.unshift('appStubs'); // Run first

angular.module('appStubs', ['ngMockE2E'])
    .config(simulateNetworkLatency)
    .run(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend, $log, bootConfig) {
    $log.debug('[Run] HTTP stubs setup...');

    // Language bundles
    $httpBackend.whenGET(/^\/lang\//).passThrough();

    // Run module stubs
    authStubs($httpBackend, bootConfig, $log);
    todoStubs($httpBackend, bootConfig, $log);
}

// @ngInject
function simulateNetworkLatency($provide) {
    // delay mock backend responses by 1 second
    var DELAY_MS = 700;
    $provide.decorator('$httpBackend', function($delegate) {
        var proxy = function(method, url, data, callback, headers) {
            var interceptor = function() {
                var _this = this;
                var _arguments = arguments;
                setTimeout(function() {
                    // return result to the client AFTER delay
                    callback.apply(_this, _arguments);
                }, DELAY_MS);
            };
            return $delegate.call(this, method, url, data, interceptor, headers);
        };
        for (var key in $delegate) {
            proxy[key] = $delegate[key];
        }
        return proxy;
    });
}
