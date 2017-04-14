(function () {
    'use strict';

    angular
            .module('app')
            .controller('LoginController', LoginController);

    LoginController.$inject = ['$location', '$routeParams', 'AuthenticationService', 'FlashService', '$timeout'];
    function LoginController($location, $routeParams, AuthenticationService, FlashService, $timeout) {
        var vm = this;
        vm.resetPwdId = $location.search().id;
        vm.resetToken = $location.search().vt;
        vm.login = login;
        vm.forgotPassword = forgotPassword;
        vm.gotoForgotPwd = gotoForgotPwd;
        vm.resetPassword = resetPassword;
        vm.errMsg = "";

        (function initController() {
            // reset login status
            AuthenticationService.ClearCredentials();
        })();

        function login() {
            vm.dataLoading = true;
            AuthenticationService.Login(vm.username, vm.password, function (response) {
                if (response.success) {
                    AuthenticationService.SetCredentials(vm.username, vm.password, response.authToken);
                    AuthenticationService.GetRoles(function (response) {
                        AuthenticationService.SetRoles(response.roles);
                        if (AuthenticationService.IsCoach() || AuthenticationService.IsOwner() )
                        {
                            $location.path('/summary/COACH_SUMMARY');
                        } else if (AuthenticationService.IsPlayer())
                        {
                            $location.path('/summary/RS');
                        } else {
                            $location.path('/');
                        }
                    });
                } else {
                    FlashService.Error(response.message);
                    vm.dataLoading = false;
                }
            });
        }

        function gotoForgotPwd() {
            $location.path('/forgotPassword');
        }
        function forgotPassword() {
            vm.dataLoading = true;
            AuthenticationService.SendPasswordChangeEmail(vm.username, function (response) {
                vm.dataLoading = false;
                FlashService.Success("Password reset link has been sent to your registered email address. Please check your inbox.  You may close this window.");
            });

        }
        function resetPassword() {
            vm.dataLoading = true;
            if (vm.password != vm.repassword) {
                FlashService.Error("Passwords do not match");
                vm.dataLoading = false;

            } else if (vm.password.length < 6) {
                FlashService.Error("Password must be at least 6 characters long");
                vm.dataLoading = false;

            } else {
                AuthenticationService.ResetPassword(vm.resetPwdId, vm.password, vm.resetToken, function (response) {
                    vm.dataLoading = false;
                    if (response.success) {
                        FlashService.Success("Congratulations! your new password is set.  Please login ...");
                        $timeout(function () {
                            // let the user see the banner and then take them back to login
                        	$location.path('/login');
                        }, 2000);
                    } else {
                        FlashService.Error("Problem setting password.  If this repeats, please contact support.");

                    }
                });
            }
        }
    }

})();
