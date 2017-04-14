'use strict';
angular.module('app')
        .controller('VideoController',
                ["$sce", "$timeout", "$rootScope", "vgFullscreen","$uibModalInstance","assetToPlay", function ($sce, $timeout, $rootScope, vgFullscreen,$uibModalInstance,assetToPlay) {
                        var controller = this;
                        controller.state = null;
                        controller.API = null;
                        controller.currentVideo = 0;
                        controller.onPlayerReady = function (API) {
                            controller.API = API;
                            //$timeout(controller.API.toggleFullScreen(),200);
                            $timeout(controller.API.play.bind(controller.API), 100);
                            console.log("video===>" + assetToPlay);
                        };
                        /*vgFullscreen.exit = function () {
                            //history.back();
                            console.log("exit fullscreen");
                        };*/

                        controller.onCompleteVideo = function () {
                            controller.isCompleted = true;

                            controller.currentVideo++;

                            if (controller.currentVideo >= controller.videos.length) {
                                controller.currentVideo = 0;

                            } else {
                                $timeout(function () {
                                    controller.setVideo(controller.currentVideo);

                                }, 1000);
                            }
                        };

                        //controller.videos = $rootScope.assetToPlay;
controller.videos = assetToPlay;

                        controller.config = {
                            preload: "none",
                            autoHide: false,
                            autoHideTime: 3000,
                            autoPlay: false,
                            sources: controller.videos  [0].sources,
                            theme: {
                                url: "http://www.videogular.com/styles/themes/default/latest/videogular.css"
                            },
                            plugins: {
                                poster: "http://www.videogular.com/assets/images/videogular.png"
                            }
                        };

                        controller.setVideo = function (index) {
                            controller.API.stop();
                            controller.currentVideo = index;
                            controller.config.sources = controller.videos[index].sources;
                            $timeout(controller.API.play.bind(controller.API), 100);
                        };
                    }]
                );