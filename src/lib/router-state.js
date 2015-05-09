'use strict';

module.exports = RouterState;

function RouterState(url, templateUrl, controller, controllerAs) {
    this.url = url;
    this.templateUrl = templateUrl;
    this.controller = controller;
    this.controllerAs = controllerAs;
}
