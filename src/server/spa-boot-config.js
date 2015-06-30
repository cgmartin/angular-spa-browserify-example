var path = require('path');
var pkg = require(path.resolve('package.json'));

module.exports = {
    clientVersion:            pkg.version,
    isDebugInfoEnabled:       (process.env.NODE_ENV !== 'production'),
    isLogDebugEnabled:        true, //(process.env.NODE_ENV !== 'production'),
    isHtml5ModeEnabled:       true,
    serverLogging: {
        isLoggingEnabled:    true,
        loggingLevel:        2,
        loggingInterval:     120000,
        maxBufferSize:       1000,
        excludeTypes:        [],
        isConsoleLogEnabled: true //(process.env.NODE_ENV !== 'production')
    },
    preferredLanguage:        'en',
    apiBaseUrl:               'http://localhost:8001',
    isStubsEnabled:           false,
    notificationsMaximumOpen: 2,
    supportedLanguages:       ['en', 'fr']
};
