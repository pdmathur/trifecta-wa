angular.module('app').controller('ModalPlayerCtrl', function ($scope, $uibModalInstance, TeamMgmtService,playerToEdit) {

    $scope.TeamMgmtService = TeamMgmtService;
    $scope.player = playerToEdit;
    $scope.create = function () {
        console.log("==edit player===");
        $scope.TeamMgmtService.EditPlayer($scope.player,function (response) {
            console.log(response);
        });
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}); 