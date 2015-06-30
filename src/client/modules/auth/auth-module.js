'use strict';

var angular = require('angular');
var loggingModule = require('../logging/logging-module');
var partials = require('./partials');
var routerConfig = require('./config/router-config');
var authHttpProvider = require('./config/auth-http-provider');
var jwtInterceptor = require('./provider/jwt-interceptor');
var LoginController = require('./controller/login-controller');
var AuthService = require('./service/auth-service');
var JwtHelper = require('./service/jwt-helper');
var TokenStorage = require('./service/token-storage');

var moduleName = module.exports = 'auth';

var dependencies = [
    loggingModule,
    partials.login.name
];

angular
    .module(moduleName, dependencies)
    .config(routerConfig)
    .config(authHttpProvider)
    .provider('jwtInterceptor', jwtInterceptor)
    .service('jwtHelper', JwtHelper)
    .service('authService', AuthService)
    .service('tokenStorage', TokenStorage)
    .controller('loginController', LoginController);
