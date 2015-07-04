'use strict';

module.exports = HomeController;

// @ngInject
function HomeController($scope, bootConfig) {
    this.version = bootConfig.clientVersion;

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;
}
