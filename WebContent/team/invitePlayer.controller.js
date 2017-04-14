angular.module('app').controller('ModalInviteCtrl', function ($scope, $uibModalInstance, TeamMgmtService, teams) {

    $scope.TeamMgmtService = TeamMgmtService;
    $scope.teams = teams;
    $scope.selectedTeam;
    $scope.inviteModel;
    $scope.loading = false;
    $scope.initController = function () {
        if ($scope.teams !== undefined && $scope.teams.length > 0) {
            $scope.selectedTeam = $scope.teams[0];
        }
    }();

    $scope.selectTeam = function (t) {
        $scope.selectedTeam = t;
    };
    $scope.invite = function () {
         $scope.loading = true;
        $scope.inviteModel.teamId = $scope.selectedTeam.id;
        
        $scope.TeamMgmtService.InvitePlayers($scope.inviteModel, function (response) {
            console.log(response);
             $scope.loading = false;
            $uibModalInstance.close();

        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
     
}).directive('multipleEmails', function () {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ctrl ) {
        var emailsRegex = /^[\W]*([\w+\-.%]+@[\w\-.]+\.[A-Za-z]{2,4}[\W]*,{1}[\W]*)*([\w+\-.%]+@[\w\-.]+\.[A-Za-z]{2,4})[\W]*$/;
        ctrl.$parsers.unshift(function(viewValue) {
          if (emailsRegex.test(viewValue)) {
            ctrl.$setValidity('multipleEmails', true);
            return viewValue;
          } else {
            ctrl.$setValidity('multipleEmails', false);
            return undefined;
          }
        });
      }
    };
  });

angular.module('app').controller('ModalTeamCtrl', function ($scope, $uibModalInstance, TeamMgmtService,teamToEdit) {

    $scope.TeamMgmtService = TeamMgmtService;
    $scope.team = teamToEdit;
    $scope.create = function () {
        console.log("==create team===");
        $scope.TeamMgmtService.createTeam($scope.team).then(function (teamId) {
            console.log(teamId);
        });
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});