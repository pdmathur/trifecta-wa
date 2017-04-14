(function () {
    'use strict';

    angular
            .module('app')
            .controller('TeamController', TeamController);

    TeamController.$inject = ['$scope', '$location', '$uibModal', '$filter', 'filterFilter', 'TeamMgmtService'];
    function TeamController($scope, $location, $uibModal, $filter, filterFilter, TeamMgmtService) {
        var TeamCtrl = this;

        TeamCtrl.dateRangeTitles = ["Current Week", "Last 4 Weeks", "Spring Season", "Fall Season", "Custom Range"];
        TeamCtrl.dateRangeObj = [];
        TeamCtrl.isCustomRange = false;
        TeamCtrl.fromDate;
        TeamCtrl.toDate;
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
                obj.selected = false;
                if (obj.title === "Custom Range") {
                    obj.type = "C";
                } else {
                    obj.type = "R";
                    if (obj.title === "Current Week") {
                        obj.selected = true;
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
        function selectRange() {
            TeamCtrl.dateRangeObj[TeamCtrl.dateRangeObj.length - 1].selected = false;
            $scope.fromDate = "";
            $scope.toDate = "";
            TeamCtrl.isCustomRange = false;
        }
        function selectCustomRange() {
            if (TeamCtrl.dateRangeObj[TeamCtrl.dateRangeObj.length - 1].selected) {
                TeamCtrl.isCustomRange = true;
                for (var i = 0; i < TeamCtrl.dateRangeObj.length - 1; i++) {
                    TeamCtrl.dateRangeObj[i].selected = false;
                }
            } else {
                TeamCtrl.isCustomRange = false;
                TeamCtrl.dateRangeObj[0].selected = true;
            }
        }

        function gotoCoachsCorner() {
            var selectedDates = filterFilter(TeamCtrl.dateRangeObj, {selected: true});
            if (TeamCtrl.isCustomRange) {
                if (TeamCtrl.fromDate === undefined || TeamCtrl.toDate === undefined) {
                    //TODO show alert
                } else {
                    var fromDate = $filter('date')(new Date(TeamCtrl.fromDate), 'yyyy-MM-dd');
                    var toDate = $filter('date')(new Date(TeamCtrl.toDate), 'yyyy-MM-dd');
                    $location.path('/summary/COACH_SUMMARY/'+TeamCtrl.currentTeam.id+"/" + fromDate + "/" + toDate);
                }
            } else if (selectedDates.length > 0) {
                var toDate = $filter('date')(new Date(selectedDates[0].toDate), 'yyyy-MM-dd');
                var fromDate = $filter('date')(new Date(selectedDates[selectedDates.length - 1].fromDate), 'yyyy-MM-dd');
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
        $scope.clear = function () {
            if ($scope.popup1.opened) {
                TeamCtrl.fromDate = null;
            } else {
                TeamCtrl.toDate = null;
            }
        };

        $scope.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: true
        };

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        // Disable weekend selection
        function disabled(data) {
//            var date = data.date,
//                    mode = data.mode;
//            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
            return false;
        }

        $scope.toggleMin = function () {
            $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
            $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
        };

        $scope.toggleMin();

        $scope.open1 = function () {
            $scope.dateOptions.minDate = new Date(2015, 1, 1);
            if (TeamCtrl.toDate !== undefined) {
                $scope.dateOptions.maxDate = TeamCtrl.toDate;
            } else {
                $scope.dateOptions.maxDate = new Date(2020, 12, 30);
            }
            $scope.popup1.opened = true;
        };

        $scope.open2 = function () {
            $scope.dateOptions.maxDate = new Date(2020, 5, 22);
            if (TeamCtrl.fromDate !== undefined) {
                $scope.dateOptions.minDate = TeamCtrl.fromDate;
            } else {
                $scope.dateOptions.minDate = null;
            }
            $scope.popup2.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            if ($scope.popup1.opened) {
                $scope.fromDate = new Date(year, month, day);
            } else {
                $scope.toDate = new Date(year, month, day);

            }
        };

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.popup1 = {
            opened: false
        };

        $scope.popup2 = {
            opened: false
        };

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events = [
            {
                date: tomorrow,
                status: 'full'
            },
            {
                date: afterTomorrow,
                status: 'partially'
            }
        ];

        function getDayClass(data) {
            var date = data.date,
                    mode = data.mode;
            if (mode === 'day') {
                var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

                for (var i = 0; i < $scope.events.length; i++) {
                    var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                    if (dayToCheck === currentDay) {
                        return $scope.events[i].status;
                    }
                }
            }

            return '';
        }

    }

})();