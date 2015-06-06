'use strict';

module.exports = HomeController;

// @ngInject
function HomeController($scope, buildConfig) {
    this.version = buildConfig.version;

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;
}
