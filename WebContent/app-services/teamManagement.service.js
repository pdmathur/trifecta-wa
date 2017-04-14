(function () {
    'use strict';
    angular
            .module('app')
            .factory('TeamMgmtService', TeamMgmtService);
    TeamMgmtService.$inject = ['$http', '$rootScope'];
    function TeamMgmtService($http, $rootScope) {
        var service = {};
        service.createTeam = createTeam;
        service.EditPlayer = EditPlayer;
        service.GetTeams = GetTeams;
        service.GetPlayers = GetPlayers;
        service.InvitePlayers = InvitePlayers;
        service.DeleteTeam = DeleteTeam;
        service.DeletePlayer = DeletePlayer;

        return service;

        function createTeam(team) {
            var data = "";
            if (team.id == undefined) {
                data = "a=createTeam&name=" + team.name + "&at=" + $rootScope.globals.currentUser.authToken
            } else {
                data = "a=renameTeam&tid=" + team.id + "&name=" + team.name + "&at=" + $rootScope.globals.currentUser.authToken
            }
            return $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: data,
            }).then(handleTeamDetails, handleError('Error creating/editing team'));
        }

        function handleTeamDetails(response) {

            return response.data;
        }


        function EditPlayer(player, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=renamePlayer&tid=" + player.teamId + "&uid=" + player.id + "&nn=" + player.nickname + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                if (data.status.success) {
                    retValue.success = true;
                } else {
                    retValue.success = false;
                }
                callback(retValue);
            });

        }

        function GetTeams(callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=listTeams&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.teams = [];
                if (data.status.success) {
                    var teams = []
                    //handling web service error
                    if (data.status.rec.length == undefined) {
                        var team = {};
                        team.name = data.status.rec.name;
                        team.id = data.status.rec.tid;
                        teams.push(team)
                    } else {
                        for (var i = 0; i < data.status.rec.length; i++) {
                            var team = {};
                            team.name = data.status.rec[i].name;
                            team.id = data.status.rec[i].tid;
                            teams.push(team)
                        }
                    }
                    retValue.teams = teams;
                }
                callback(retValue);
            });

        }
        function GetPlayers(teamId, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=listPlayers&tid=" + teamId + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.players = [];
                if (data.status.success) {
                    var players = []
                    if (data.status.rec == undefined) {
                        //no data
                    } else {
                        //handling web service error 
                        if (data.status.rec.length == undefined) {
                            var player = {};
                            player.nickname = data.status.rec.nickname;
                            player.id = data.status.rec.id;
                            player.email = data.status.rec.email;
                            players.push(player)
                        } else {
                            for (var i = 0; i < data.status.rec.length; i++) {
                                var player = {};
                                player.nickname = data.status.rec[i].nickname;
                                player.id = data.status.rec[i].id;
                                player.email = data.status.rec[i].email;
                                players.push(player)
                            }
                        }
                    }
                    retValue.players = players;
                }
                callback(retValue);
            });

        }
        function InvitePlayers(inviteModel, callback) {
            inviteModel.nickName = "";
            var emails = inviteModel.email.split(",");
            for (var i = 0; i < emails.length; i++) {
                var id = emails[i];
                if (id === "" || id === undefined) {
                    continue;
                }
                $http({
                    method: 'POST',
                    url: host + '/japi',
                    timeout: 10000,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    data: "a=invitePlayer&tid=" + inviteModel.teamId + "&email=" + id + "&nn=" + inviteModel.nickName + "&at=" + $rootScope.globals.currentUser.authToken
                }).success(function (data) {
                    console.log(JSON.stringify(data))
                    var retValue = {};
                    if (data.status.success) {
                        //TODO if anything
                    }
                });
            }
            callback();

        }

        function DeleteTeam(teamId, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=deleteTeam&tid=" + teamId + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.success = false;
                if (data.status.success) {

                    retValue.success = true;
                }
                callback(retValue);
            });

        }

        function DeletePlayer(playerId, teamId, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 10000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=deletePlayer&uid=" + playerId + "&tid=" + teamId + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.success = false;
                if (data.status.success) {

                    retValue.success = true;
                }
                callback(retValue);
            });

        }

        function handleError(error) {
            return function () {
                return {success: false, message: error};
            };
        }
    }
})();