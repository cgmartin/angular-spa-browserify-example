'use strict';

var angular = require('angular');

module.exports = todoStubs;

function todoStubs($httpBackend, $log) {
    $log.debug('[Run] Adding auth stubs...');

    var tokenData = {
        token:        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjM5MGQ3NzBhLTA3YTctNGFlMi1hNGI4LTE1N' +
                      'WExODAwYmJiNSIsIm9yaWdpbmFsX2lhdCI6bnVsbCwidXNlciI6eyJpZCI6ImM2ODExNDg0LWNkMmEtNDI' +
                      '5Yi1hZGZjLTYyNzdlZjUyNzFjYiIsIm5hbWUiOiJDaHJpcyIsInJvbGVzIjpbImFkbWluIl19LCJpYXQiO' +
                      'jE0MzYxMjg4MzYsImV4cCI6MTQzNjEyOTEzNn0.Gkl-6h33-lZDWcfst1ZLHqstJeRY47nrixWP6PFQiE0',
        refreshToken: '984bb0e7-8cf6-44c5-bd28-fe50e8393c13',
        expires:      300000
    };

    $httpBackend.whenPOST('/api/auth/access-tokens').respond(function(method, url, data) {
        var creds = angular.fromJson(data);
        if (creds.username === 'test@email.com' && creds.password === 'password') {
            return [200, tokenData, {}];
        } else {
            return [400, {message: 'Authentication failed'}, {}];
        }
    });

    $httpBackend.whenPOST('/api/auth/refresh-tokens').respond(function() {
        return [200, tokenData, {}];
    });

    $httpBackend.whenDELETE('/api/auth/refresh-tokens/984bb0e7-8cf6-44c5-bd28-fe50e8393c13').respond(function() {
        return [204, null, {}];
    });
}
