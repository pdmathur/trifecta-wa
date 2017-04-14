(function () {
    'use strict';
    var app = angular
            .module('app', ['ngRoute', 'ngCookies','ngAnimate','angular-confirm',
        'anguFixedHeaderTable',
                "ngSanitize",
                "ui.bootstrap",
                "com.2fdevs.videogular",
                "com.2fdevs.videogular.plugins.controls",
                "com.2fdevs.videogular.plugins.overlayplay",
                "com.2fdevs.videogular.plugins.poster",
                "com.2fdevs.videogular.plugins.buffering"
            ])
            .factory('sessionRecoverer', ['$q', '$injector', function($q, $injector) {  
    var sessionRecoverer = {
        responseError: function(response) {
            
            // Session has expired
            if (response.status == 401){
                var SessionService = $injector.get('AuthenticationService');
                var $http = $injector.get('$http');
                var deferred = $q.defer();
                SessionService.RenewLogin().then(deferred.resolve, deferred.reject);

                // When the session recovered, make the same backend call again and chain the request
                return deferred.promise.then(function() {
                    return $http(response.config);
                });
            }
            return $q.reject(response);
        }
    };
    return sessionRecoverer;
}])
            .config(config)
            .run(run);
    config.$inject = ['$routeProvider', '$httpProvider'];
    function config($routeProvider, $httpProvider) {
        //$sceProvider.enabled(false);//Remove this..only for testing
        //$httpProvider.defaults.useXDomain = true;
       // delete $httpProvider.defaults.headers.common['X-Requested-With'];
       $httpProvider.interceptors.push('sessionRecoverer');
        $routeProvider
//                .when('/', {
//                    controller: 'HomeController',
//                    templateUrl: 'home/home.view.html',
//                    controllerAs: 'HomeCtrl'
//                })
                .when('/', {
                    controller: 'LoginController',
                    templateUrl: 'login/login.view.html',
                    controllerAs: 'vm'
                })
                .when('/login', {
                    controller: 'LoginController',
                    templateUrl: 'login/login.view.html',
                    controllerAs: 'vm'
                })
                .when('/forgotPassword', {
                    controller: 'LoginController',
                    templateUrl: 'login/forgotPassword.view.html',
                    controllerAs: 'vm'
                })
                .when('/managepassword', {
                    controller: 'LoginController',
                    templateUrl: 'login/resetPassword.view.html',
                    controllerAs: 'vm'
                })
                .when('/teamManagement', {
                    controller: 'TeamController',
                    templateUrl: 'team/teamManagement.view.html',
                    controllerAs: 'TeamCtrl'
                })
                .when('/summary/:viewType', {
                    templateUrl: 'summary/summary.view.html',
                    controller: 'SummaryController',
                    controllerAs: 'SummaryCtrl'

                })
                .when('/summary/:viewType/:teamId/:stDate/:endDate', {
                    templateUrl: 'summary/summary.view.html',
                    controller: 'SummaryController',
                    controllerAs: 'SummaryCtrl'

                })
//                .when('/summary/:eventId', {
//                    templateUrl: 'summary/summary.view.html',
//                    controller: 'SummaryController',
//                    controllerAs: 'SummaryCtrl'
//
//                })
//                .when('/analysis/:eventId/:analysisType/:roundNo', {
//                    templateUrl: 'analysis/analysis.view.html',
//                    controller: 'AnalysisController',
//                    controllerAs: 'AnalysisCtrl'

//                })
                .when('/video', {
                    templateUrl: 'summary/video.view.html',
                    controller: 'VideoController',
                    controllerAs: 'VideoCtrl'

                })
                /*.when('/summary/:eventId/:roundNo', {
                 templateUrl: 'summary/summary.view.html',
                 controller: 'SummaryController',
                 controllerAs: 'SummaryCtrl'
                 
                 })
                 .when('/animationSummary/:eventId/:animationType', {
                 templateUrl: 'summary/summary.view.html',
                 controller: 'SummaryController',
                 controllerAs: 'SummaryCtrl'
                 
                 })*/
                .when('/register', {
                    controller: 'RegisterController',
                    templateUrl: 'register/register.view.html',
                    controllerAs: 'vm'
                })

                .otherwise({redirectTo: '/login'});
        
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http'];
    function run($rootScope, $location, $cookieStore, $http) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        /*if ($rootScope.globals.currentUser) {
         $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
         }*/

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            //var restrictedPage = $.inArray($location.path(), ['/', '/login', '/register', '/summary', '/analysis']) === -1;
           var restrictedPages = ['/login', '/summary', '/analysis', "/teamManagement"];
            var isRestricted = (restrictedPages.indexOf($location.path()) !== -1)
            var loggedIn = $rootScope.globals.currentUser;
            if (isRestricted && !loggedIn) {
                $location.path('/login');
            }
        });
    }



})();


