angular.module('app').controller('ModalCarouselCtrl', function ($scope, $uibModalInstance, $sce , isVideo, shotNo, assetsArray) {

    $scope.isVideo = isVideo;
    $scope.shotNo = parseInt(shotNo-1);
    $scope.assetsArray = assetsArray;
    $scope.loading = false;
    $scope.initController = function () {
        
    }();

    $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    
})

