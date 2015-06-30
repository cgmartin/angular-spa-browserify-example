'use strict';

var angular = require('angular');
var angularJwt = require('angular-jwt');
var loggingModule = require('../logging/logging-module');
var partials = require('./partials');
var routerConfig = require('./config/router-config');
var LoginController = require('./controller/login-controller');
var AuthService = require('./service/auth-service');
var TokenStorage = require('./service/token-storage');

var moduleName = module.exports = 'auth';

var dependencies = [
    loggingModule,
    partials.login.name,
    angularJwt
];

angular
    .module(moduleName, dependencies)
    .config(routerConfig)
    .service('authService', AuthService)
    .service('tokenStorage', TokenStorage)
    .controller('loginController', LoginController);
