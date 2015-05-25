module.exports = {
    isDebugInfoEnabled:       (process.env.NODE_ENV !== 'production'),
    isLogDebugEnabled:        (process.env.NODE_ENV !== 'production'),
    isHtml5ModeEnabled:       true,
    serverLogging: {
        isLoggingEnabled:    true,
        loggingLevel:        2,
        loggingInterval:     120000,
        maxBufferSize:       1000,
        excludeTypes:        [],
        isConsoleLogEnabled: (process.env.NODE_ENV !== 'production')
    },
    preferredLanguage:        'en',
    apiBaseUrl:               '',
    isStubsEnabled:           true,
    notificationsMaximumOpen: 2,
    supportedLanguages:       ['en', 'fr']
};
