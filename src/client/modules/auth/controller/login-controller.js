'use strict';

module.exports = LoginController;

// @ngInject
function LoginController($scope, authService, notifications, $state, $stateParams, $log) {
    //var _this = this;
    this.authData = { username: '', password: '', clientId: 'browser' };

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;

    this.login = function() {
        if (!$scope.loginForm.$valid) { return; }
        authService.login(this.authData).then(function() {
            notifications.notify({message: 'Login successful', classes: ['success']});

            if ($stateParams.toState) {
                $state.go($stateParams.toState, $stateParams.toStateParams);
            } else {
                $state.go('home');
            }
        }).catch(function(error) {
            $log.error('login error', error);
            notifications.notify({message: 'Login failed', classes: ['error']});
        });
    };
}
