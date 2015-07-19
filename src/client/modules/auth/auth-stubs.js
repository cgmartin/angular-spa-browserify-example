'use strict';

var angular = require('angular');

module.exports = todoStubs;

function todoStubs($httpBackend, bootConfig, $log) {
    $log.debug('[Run] Adding auth stubs...');

    var tokenData = {
        token:        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImJkZWQzNjczLWUyMzUtNDA5ZC1hOGI0LWI0YzIzMDUxMTh' +
                      'iYiIsIm9yaWdpbmFsX2lhdCI6bnVsbCwidXNlciI6eyJpZCI6ImM2ODExNDg0LWNkMmEtNDI5Yi1hZGZjLTYyNzdlZjU' +
                      'yNzFjYiIsIm5hbWUiOiJDaHJpcyIsInNjb3BlIjpbInJlYWQiLCJ3cml0ZSJdfSwiaWF0IjoxNDM2NjQyOTYxLCJleHA' +
                      'iOjE0MzY2NDMyNjF9.r4dgPatorZ6XJdFnoB8rYsjE3u7QMwwNAvvDYnWs3To',
        refreshToken: 'fb8808ca-0b90-4c2c-8215-c08857bfae7a',
        expires:      300000
    };

    $httpBackend.whenPOST(bootConfig.apiBaseUrl + '/auth/access-tokens')
        .respond(function(method, url, data) {
            var creds = angular.fromJson(data);
            if (creds.username === 'test@email.com' && creds.password === 'password') {
                return [200, tokenData, {}];
            } else {
                return [400, {message: 'Authentication failed'}, {}];
            }
        });

    $httpBackend.whenPOST(bootConfig.apiBaseUrl + '/auth/refresh-tokens')
        .respond(function() {
            return [200, tokenData, {}];
        });

    $httpBackend.whenDELETE(bootConfig.apiBaseUrl + '/auth/refresh-tokens/fb8808ca-0b90-4c2c-8215-c08857bfae7a')
        .respond(function() {
            return [204, null, {}];
        });
}
