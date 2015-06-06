/*jshint -W030,-W117*/
// This is an example spa-boot.js JSONP response for local testing.
// It is typically served dynamically by the static server
// using runtime environment settings.
// See: https://github.com/cgmartin/spa-express-static-server
typeof main === 'function' && main({
    'clientVersion':            '?.?.?',
    'isDebugInfoEnabled':       true,
    'isLogDebugEnabled':        true,
    'isHtml5ModeEnabled':       false,
    'serverLogging': {
        'isLoggingEnabled':    true,
        'loggingLevel':        2,
        'loggingInterval':     10000,
        'maxBufferSize':       1000,
        'excludeTypes':        [],
        'isConsoleLogEnabled': true
    },
    'preferredLanguage':        'en',
    'apiBaseUrl':               '',
    'isStubsEnabled':           true,
    'notificationsMaximumOpen': 2,
    'supportedLanguages':       ['en', 'fr']
});
