'use strict';

module.exports = {
    compile:             require('./compile-config'),
    location:            require('./location-config'),
    router:              require('./router-config'),
    log:                 require('./log-config'),
    translate:           require('./translate-config'),
    httpProvider:        require('./http-provider'),
    serverLoggerConfig:  require('./server-logger-config'),
    notificationsConfig: require('./notifications-config')
};
