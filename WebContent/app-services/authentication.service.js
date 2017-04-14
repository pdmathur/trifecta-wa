(function () {
    'use strict';
    angular
            .module('app')
            .factory('AuthenticationService', AuthenticationService);

    AuthenticationService.$inject = ['$http', '$cookieStore', '$rootScope', '$timeout'];
    function AuthenticationService($http, $cookieStore, $rootScope, $timeout) {
        var service = {};

        service.Login = Login;
        service.RenewLogin = RenewLogin;
        service.Logout = Logout;
        service.SetCredentials = SetCredentials;
        service.ClearCredentials = ClearCredentials;
        service.GetRoles = GetRoles;
        service.SendPasswordChangeEmail = SendPasswordChangeEmail;
        service.ResetPassword = ResetPassword;
        service.SetRoles = SetRoles;
        service.IsPlayer = IsPlayer;
        service.IsCoach = IsCoach;
        service.IsOwner = IsOwner;

        return service;

        function Login(username, password, callback) {


            var response;
            //$http.get(host+'/api', {params: { "a":"auth","un" : username,"pw" : password }})
            $http({
                method: 'GET',
                url: host + '/api',
                timeout: 10000,
                params: {"a": "auth", "un": username, "pw": password}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    return $.parseXML(data);
                }
            })
                    .success(function (response) {
                        var xmlDoc = response;
                        var retValue = {};
                        var x = xmlDoc.getElementsByTagName("success");
                        if (x[0].childNodes[0].nodeValue === "false") {
                            retValue.success = false;
                            retValue.message = "Login failed.  Please verify credentials.";
                        } else {
                            retValue.success = true;
                            var t = xmlDoc.getElementsByTagName("token");
                            //setCookie("at", t[0].childNodes[0].nodeValue, 30);
                            retValue.authToken = t[0].childNodes[0].nodeValue;
                        }
                        callback(retValue);
                    });

        }

        function GetRoles(callback) {
            //TODO roles are not returned as array
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=getUserRoles&at=" + $rootScope.globals.currentUser.authToken
            })
                    .success(function (data) {
                        console.log(JSON.stringify(data))
                        var retValue = {};
                        retValue.roles = [];
                        if (data.status.success) {
                            var roles = []
                            //handling web service error
                            if (data.status.rec.length == undefined) {
                                roles.push(data.status.rec.roles)
                            } else {
                                for (var i = 0; i < data.status.rec.length; i++) {
                                    roles.push(data.status.rec[i].roles)
                                }
                            }
                            retValue.roles = roles;
                        }
                        callback(retValue);
                    });

        }

        function SendPasswordChangeEmail(email, callback) {
            //TODO roles are not returned as array
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=sendPasswordChangeEmail&email=" + email
            })
                    .success(function (data) {
                        console.log(JSON.stringify(data))
                        var retValue = {};
                        retValue.success = data.status.success;
                        callback(retValue);
                    });

        }

        function ResetPassword(email, pwd, token, callback) {
            //TODO roles are not returned as array
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=verify&un=" + email + "&vt=" + token + "&pw=" + pwd
            })
                    .success(function (data) {
                        console.log(JSON.stringify(data))
                        var retValue = {};
                        retValue.success = data.status.success;
                        callback(retValue);
                    });

        }
        function IsCoach() {
            if ($rootScope.globals.currentUser.roles.indexOf("coach") !== -1)
                return true;
            else
                return false;
        }
        function IsOwner() {
            if ($rootScope.globals.currentUser.roles.indexOf("owner") !== -1)
                return true;
            else
                return false;
        }
        function IsPlayer() {
            if ($rootScope.globals.currentUser.roles.indexOf("player") !== -1)
                return true;
            else
                return false;
        }


        function RenewLogin(callback) {


            var response;
            //$http.get(host+'/api', {params: { "a":"auth","un" : username,"pw" : password }})
            $http({
                method: 'GET',
                url: host + '/api',
                timeout: 10000,
                params: {"a": "reauth", "at": $rootScope.globals.currentUser.authToken},
                transformResponse: function (data, headersGetter, status) {
                    return $.parseXML(data);
                }
            })
                    .success(function (response) {
                        var xmlDoc = response;
                        var retValue = {};
                        var x = xmlDoc.getElementsByTagName("success");
                        if (x[0].childNodes[0].nodeValue === "false") {
                            retValue.success = false;
                            retValue.message = "Login failed.  Please try again.";
                            ClearCredentials();//As server didnot give the token..lets ask the user to re-login
                        } else {
                            retValue.success = true;
                            var t = xmlDoc.getElementsByTagName("token");
                            var token = t[0].childNodes[0].nodeValue;

                            SetCredentials($rootScope.globals.currentUser.username, "Naveen:)", token);
                            //callback(retValue);
                        }
                    });

        }

        function Logout() {
            var response;
            var token = $rootScope.globals.currentUser.authToken;
            ClearCredentials();
            //$http.get(host+'/api', {params: { "a":"auth","un" : username,"pw" : password }})
            $http({
                method: 'GET',
                url: host + '/api',
                timeout: 10000,
                params: {"a": "deauth", "at": token},
                transformResponse: function (data, headersGetter, status) {
                    return $.parseXML(data);
                }
            })
                    .success(function (response) {
                        var xmlDoc = response;
                        return "";//TODO decide what is needed

                    });

        }

        function SetRoles(roles) {
            $rootScope.globals.currentUser.roles = roles;
            $rootScope.globals.currentUser.isCoach = IsCoach();
            $rootScope.globals.currentUser.isOwner = IsOwner();

            $cookieStore.put('globals', $rootScope.globals);
        }

        function SetCredentials(username, password, authToken) {
            var authdata = Base64.encode(username + ':' + password);
            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata,
                    authToken: authToken
                }
            };

            //$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
            $cookieStore.put('globals', $rootScope.globals);
        }

        function ClearCredentials() {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic';
        }
    }

    // Base64 encoding service used by AuthenticationService
    var Base64 = {
        keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                        this.keyStr.charAt(enc1) +
                        this.keyStr.charAt(enc2) +
                        this.keyStr.charAt(enc3) +
                        this.keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = this.keyStr.indexOf(input.charAt(i++));
                enc2 = this.keyStr.indexOf(input.charAt(i++));
                enc3 = this.keyStr.indexOf(input.charAt(i++));
                enc4 = this.keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

})();