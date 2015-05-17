'use strict';

module.exports = ErrorController;

// @ngInject
function ErrorController($scope, errorToDisplay, traceService) {
    $scope.vm = {
        error: errorToDisplay.error,
        stacktrace: traceService.print({e: errorToDisplay.error}).join('\n')
    };
}
