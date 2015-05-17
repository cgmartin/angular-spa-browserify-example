'use strict';

module.exports = spaNavDirective;

/**
 * Global Navigation Bar
 */
function spaNavDirective() {
    return {
        restrict: 'EA',
        scope: {},
        templateUrl: require('../partials/nav.partial.html').name,
        controller: spaNavController
    };

    // @ngInject
    function spaNavController($scope, $translate, config) {
        $scope.languages = config.supportedLanguages || [];

        $scope.selectLanguage = function(lang) {
            $translate.use(lang);
        };
    }
}

