'use strict';

module.exports = spaNavDirective;

/**
 * Global Navigation Bar
 */
function spaNavDirective() {
    return {
        restrict: 'EA',
        scope: {},
        templateUrl: require('./spa-nav.partial.html').name,
        controller: spaNavController
    };

    // @ngInject
    function spaNavController($scope, $translate, navConfig, authService, $state, notifications, $location) {
        var vm = $scope.vm = {};
        vm.languages = navConfig.supportedLanguages || [];
        vm.missingUrl = ($location.$$html5) ? '/missing-url' : '#/missing-url';

        vm.logout = function() {
            authService.logout();
            notifications.notify({message: 'You have been logged out'});
            $state.go('home');
        };

        $scope.selectLanguage = function(lang) {
            $translate.use(lang);
        };
    }
}

