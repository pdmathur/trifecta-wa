angular.module('app').controller('ModalCarouselCtrl', function ($scope, $uibModalInstance, $sce , isVideo, shotNo, assetsArray, animationArray) {

    $scope.isVideo = isVideo;
    $scope.shotNo = parseInt(shotNo-1);
    $scope.assetsArray = assetsArray;
    $scope.animationArray = animationArray;
    $scope.loading = false;
    $scope.isMobile = deviceIsMobile;
    $scope.videoSrc = "";
    $scope.activeVideoIndex = $scope.shotNo;
    $scope.posterSrc = "";
    $scope.initController = function () {
    	if (isVideo)
           $scope.videoSrc = $sce.trustAsResourceUrl($scope.animationArray[$scope.activeVideoIndex].asset);
    }();

    $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.nextVideo = function () {
        console.log("===next====");
        if($scope.activeVideoIndex<$scope.assetsArray.length-1){
            $scope.activeVideoIndex++;
            $scope.loadVideo();
        }
    };
    $scope.prevVideo = function () {
        console.log("===prev====");
        if($scope.activeVideoIndex>0){
            $scope.activeVideoIndex--;
            $scope.loadVideo();
        }
    };
    $scope.isPrevVideoDisabled = function(){
        return $scope.activeVideoIndex === 0;
    };
    $scope.isNextVideDisabled = function(){
        var isDisabled = $scope.activeVideoIndex === $scope.assetsArray.length;
        return isDisabled;
    };
    
    $scope.loadVideo = function(){
        console.log("=======Load video=======");
        $scope.posterSrc = $scope.trustSrc($scope.assetsArray[$scope.activeVideoIndex].asset);
        $scope.videoSrc = $scope.trustSrc($scope.animationArray[$scope.activeVideoIndex].asset);
    };
   
})

