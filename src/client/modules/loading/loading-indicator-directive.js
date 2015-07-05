// jshint -W098
'use strict';

module.exports = loadingIndicatorDirective;

/**
 * Loading indicator
 * <loading-indicator is-loaded="boolean-expression"/>
 */
function loadingIndicatorDirective() {
    return {
        restrict: 'EA',
        scope: {
            isLoaded: '='
        },
        replace: false,
        templateUrl: require('./loading-indicator.partial.html').name,
        controller: loadingIndicatorController
    };

    // @ngInject
    function loadingIndicatorController($scope, loadingConfig, $timeout) {
        var vm = $scope.vm = {};
        vm.showLoading = false;

        // Animate the loading indicator
        $timeout(function() {
            vm.showLoading = true;
        }, loadingConfig.latencyThreshold);
    }
}
