(function () {
    'use strict';

    angular
            .module('app')
            .controller('TeamController', TeamController);

    TeamController.$inject = ['$scope', '$location', '$cookieStore', '$uibModal', '$filter', 'filterFilter', 'TeamMgmtService'];
    function TeamController($scope, $location, $cookieStore, $uibModal, $filter, filterFilter, TeamMgmtService) {
        var TeamCtrl = this;

        TeamCtrl.dateRangeTitles = ["Current Week", "Last 4 Weeks", "Custom Range"];
        TeamCtrl.savedTitle = $cookieStore.get('rangeTitle') || TeamCtrl.dateRangeTitles[0];
        TeamCtrl.dateRangeObj = [];
        TeamCtrl.isCustomRange = false;
        TeamCtrl.fromDate = ($cookieStore.get('fromDate') == null)? null : new Date($cookieStore.get('fromDate'));
        TeamCtrl.toDate = ($cookieStore.get('toDate') == null)? null : new Date($cookieStore.get('toDate'));
        TeamCtrl.currentTeam = {};
        TeamCtrl.teamsList = [];
        TeamCtrl.playersList = [];
        TeamCtrl.actionMsg = "";

        TeamCtrl.selectTeam = selectTeam;
        TeamCtrl.selectRange = selectRange;
        TeamCtrl.selectCustomRange = selectCustomRange;
        TeamCtrl.gotoCoachsCorner = gotoCoachsCorner;
        TeamCtrl.invite = invite;
        TeamCtrl.launchInviteView = launchInviteView;
        TeamCtrl.launchTeamView = launchTeamView;
        TeamCtrl.launchPlayerView = launchPlayerView;
        TeamCtrl.deletePlayer = deletePlayer;
        TeamCtrl.deleteTeam = deleteTeam;

        TeamCtrl.invitation = {};
        initController();
        function initController() {
            buildDateRanges();
            getTeams();

        }

        function buildDateRanges() {
            TeamCtrl.dateRangeObj = [];
            for (var i = 0; i < TeamCtrl.dateRangeTitles.length; i++) {
                var obj = {};
                obj.title = TeamCtrl.dateRangeTitles[i];
                obj.selected = (TeamCtrl.savedTitle === obj.title)? true : false;
                if (obj.title === "Custom Range") {
                    obj.type = "C";
                    TeamCtrl.isCustomRange = obj.selected;
                } else {
                    obj.type = "R";
                    if (obj.title === "Current Week") {
                        var curr = new Date;
                        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
                        var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
                        obj.fromDate = firstday;
                        obj.toDate = lastday;
                    } else if (obj.title === "Last 4 Weeks") {
                        var curr = new Date;
                        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay() - 21));
                        var lastday = new Date(curr.setDate(curr.getDate() + 27));
                        obj.fromDate = firstday;
                        obj.toDate = lastday;
                    }
                }
                TeamCtrl.dateRangeObj.push(obj);
            }
        }
        function selectRange(title) {
            for (var i=0; i<TeamCtrl.dateRangeObj.length; i++) // uncheck others
            	TeamCtrl.dateRangeObj[i].selected = (TeamCtrl.dateRangeObj[i].title != title)? false : true;
            TeamCtrl.isCustomRange = false;
        }
        function selectCustomRange(title) {
            for (var i=0; i<TeamCtrl.dateRangeObj.length; i++) // uncheck others
            	TeamCtrl.dateRangeObj[i].selected = (TeamCtrl.dateRangeObj[i].title != title)? false : true;
            TeamCtrl.isCustomRange = true;
        }

        function gotoCoachsCorner() {
            var selectedDates = filterFilter(TeamCtrl.dateRangeObj, {selected: true});

            if (selectedDates.length > 0) {
               $cookieStore.put('rangeTitle', selectedDates[0].title);
               $cookieStore.put('fromDate', TeamCtrl.fromDate);
               $cookieStore.put('toDate', TeamCtrl.toDate);
            }

            if (TeamCtrl.isCustomRange) {
            	var fromDate = "";
                if (TeamCtrl.fromDate === undefined)
                	fromDate = $filter('date')($scope.dateOptions1.minDate, 'yyyy-MM-dd');
                else
                	fromDate = $filter('date')(new Date(TeamCtrl.fromDate), 'yyyy-MM-dd');

                var toDate = "";
                if (TeamCtrl.toDate === undefined)
                	toDate = $filter('date')($scope.dateOptions2.maxDate, 'yyyy-MM-dd');
                else
                	toDate = $filter('date')(new Date(TeamCtrl.toDate), 'yyyy-MM-dd');
                $location.path('/summary/COACH_SUMMARY/'+TeamCtrl.currentTeam.id+"/" + fromDate + "/" + toDate);
            } else if (selectedDates.length > 0) {
                var toDate = $filter('date')(new Date(selectedDates[0].toDate), 'yyyy-MM-dd');
                var fromDate = $filter('date')(new Date(selectedDates[0].fromDate), 'yyyy-MM-dd');
                $location.path('/summary/COACH_SUMMARY/'+TeamCtrl.currentTeam.id+"/" + fromDate + "/" + toDate);
            } else {
                //TODO show alert
            }
        }

        function getTeams() {
            TeamMgmtService.GetTeams(function (response) {
                console.log(response);
                TeamCtrl.teamsList = response.teams;
                if (TeamCtrl.teamsList.length > 0) {
                    TeamCtrl.currentTeam = TeamCtrl.teamsList[0];
                    getPlayers();
                }
            });
        }

        function getPlayers() {
            TeamMgmtService.GetPlayers(TeamCtrl.currentTeam.id, function (response) {
                console.log(response);
                TeamCtrl.playersList = response.players;
            });
        }

        function selectTeam(team) {
            TeamCtrl.actionMsg = "";
            if (TeamCtrl.currentTeam.id !== team.id) {
                TeamCtrl.currentTeam = team;
                getPlayers();

            }
        }
        function deletePlayer(playerId) {
            console.log("delete player : " + playerId);
            TeamMgmtService.DeletePlayer(playerId, TeamCtrl.currentTeam.id, function (response) {
                if (response.success) {
                    TeamCtrl.actionMsg = "Deleted player successfully !!";
                    console.log(response);
                    getPlayers();
                } else {
                    TeamCtrl.actionMsg = "Error deleting player. Please try again.";

                }
            });
        }
        function deleteTeam(teamId) {
            console.log("delete team : " + teamId);
            TeamMgmtService.DeleteTeam(teamId, function (response) {
                console.log(response);
                if (response.success) {
                    TeamCtrl.actionMsg = "Deleted team successfully !!";
                    getTeams();
                } else {
                    TeamCtrl.actionMsg = "Error deleting team. Please try agin.";

                }
            });
        }
        function launchInviteView() {
            TeamCtrl.actionMsg = "";
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'invitePlayer.html',
                controller: 'ModalInviteCtrl',
                size: "",
                resolve: {
                    TeamMgmtService: function () {
                        return TeamMgmtService;
                    },
                    teams: function () {
                        return TeamCtrl.teamsList;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                //$scope.selected = selectedItem;
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
        }

        function launchTeamView(team) {
            TeamCtrl.actionMsg = "";
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'createTeam.html',
                controller: 'ModalTeamCtrl',
                size: "",
                resolve: {
                    TeamMgmtService: function () {
                        return TeamMgmtService;
                    },
                    teamToEdit: function () {
                        return team;
                    }
                }
            });

            modalInstance.result.then(function () {
                //$scope.selected = selectedItem;
                console.log("=======")
                if (team !== undefined) {
                    TeamCtrl.actionMsg = "Updated team successfully !!";
                } else {
                    TeamCtrl.actionMsg = "Created team successfully !!";
                }
                getTeams();
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        }
        function launchPlayerView(player) {
            TeamCtrl.actionMsg = "";
            player.teamId = TeamCtrl.currentTeam.id;
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'createPlayer.html',
                controller: 'ModalPlayerCtrl',
                size: "",
                resolve: {
                    TeamMgmtService: function () {
                        return TeamMgmtService;
                    },
                    playerToEdit: function () {
                        return player;
                    }
                }
            });

            modalInstance.result.then(function () {
                //$scope.selected = selectedItem;
                console.log("=======")
                if (player !== undefined) {
                    TeamCtrl.actionMsg = "Updated player successfully !!";
                }
                getPlayers();
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        }
        function invite() {

        }

        //DatePicker code...Should move to separate file and use it from that controller..
        $scope.popup1 = {
        		opened: false
        }

        $scope.popup2 = {
        		opened: false
        }

        $scope.addDays = function (date, days) {
            var result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }
        
        $scope.dateOptions1 = {
            formatYear: 'yy',
            maxDate: $scope.addDays(new Date(), 1 * 365),
            minDate: $scope.addDays(new Date(), -2 * 365),
            startingDay: 1
        };

        $scope.dateOptions2 = {
                formatYear: 'yy',
                maxDate: $scope.addDays(new Date(), 1 * 365),
                minDate: $scope.addDays(new Date(), -2 * 365),
                startingDay: 1
            };

        $scope.dateBlur = function () { 
        	// Clear the end date if it does not make sense wrt start date or global bounds
        	if (TeamCtrl.toDate == null || TeamCtrl.toDate > $scope.dateOptions2.maxDate || TeamCtrl.toDate < $scope.dateOptions2.minDate || (TeamCtrl.fromDate != null && TeamCtrl.toDate < TeamCtrl.fromDate))
        		TeamCtrl.toDate = null;
        	// Clear start date if out of global bounds
        	if (TeamCtrl.fromDate == null || TeamCtrl.fromDate > $scope.dateOptions1.maxDate || TeamCtrl.fromDate < $scope.dateOptions1.minDate)
        	{
        		TeamCtrl.fromDate = null;
        		$scope.dateOptions2.minDate = $scope.addDays(new Date(), -2 * 365);
        	}
        }
        
        $scope.open1 = function () {
        	// allow start date to be anything
            $scope.popup1.opened = true;
        };

        $scope.open2 = function () {
        	// limit end date or base on start date
            if (TeamCtrl.fromDate !== undefined && TeamCtrl.fromDate != null ) {
                $scope.dateOptions2.minDate = TeamCtrl.fromDate;
            } else {
                $scope.dateOptions2.minDate = $scope.addDays(new Date(), -2 * 365);
            }
            $scope.popup2.opened = true;
        };

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

    }

})();