'use strict';

module.exports = unauthenticatedEventHandler;

/**
 * Sets up event listeners on ui-router to log state changes and failures
 */
// @ngInject
function unauthenticatedEventHandler($rootScope, notifications) {
    $rootScope.$on('$stateChangeUnauthenticated', function() {
        notifications.notify({message: 'You must be logged in to access this page', classes: ['error']});
    });
}
