'use strict';

module.exports = ErrorController;

// @ngInject
function ErrorController($scope, errorToDisplay, $log) {
    $log.debug('errorToDisplay', errorToDisplay);
    $scope.vm = { error: errorToDisplay.error };
}
