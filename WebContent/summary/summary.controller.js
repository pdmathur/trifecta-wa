(function () {
    'use strict';

    angular
            .module('app')
            .controller('SummaryController', SummaryController);

    SummaryController.$inject = ['$scope', '$location', '$routeParams', '$cookieStore','EventService', '$rootScope', '$sce', '$timeout', '$filter', 'filterFilter', '$uibModal', 'TeamMgmtService'];
    function SummaryController($scope, $location, $routeParams, $cookieStore, EventService, $rootScope, $sce, $timeout, $filter, filterFilter, $uibModal, TeamMgmtService) {
        var ctrl = this;
        ctrl.viewType = $routeParams.viewType;
        ctrl.teamId = $routeParams.teamId;
        ctrl.stDate;
        ctrl.endDate;
        ctrl.eventId = $routeParams.eventId;
        ctrl.selectedRound = $routeParams.roundNo;
        ctrl.animationType = $routeParams.animationType;
        console.log("SummaryView ViewType : " + ctrl.viewType + "  EventId : " + ctrl.eventId + "selectedRound : " + ctrl.selectedRound + " animationType : " + ctrl.animationType);
        console.log("SummaryView teamId : " + ctrl.teamId + "stDate : " + ctrl.stDate + " endDate : " + ctrl.endDate);
        
        ctrl.isMobile = deviceIsMobile;
        
        //coach summary 
        ctrl.coachTeams = [];
        ctrl.currentTeam = {};
        ctrl.coachSummData;
        ctrl.coachSummAvg;

        //ctrl.viewType = "S";
        ctrl.viewConfig = {}
        ctrl.eventDet = {};
        ctrl.summaryView = [];
        ctrl.stPov = [];
        ctrl.gnPov = [];
        ctrl.summaryVids = {};
        ctrl.totalRounds = 1;
        ctrl.assetsArray = [];
        ctrl.thumbnails = [];
        ctrl.roundScore = "0/0";
        ctrl.gunTgtPos = [];
        ctrl.templateURL;
        ctrl.title = "";
        ctrl.totalShotCnt = 0;
        ctrl.runningCnt = 0;
        ctrl.perfSumm;
        ctrl.perfData = [];
        ctrl.initialLoad = true;
        ctrl.shotsPerRoundCnt = 25;


        //analysis related
        ctrl.selectedStation = 1;
        ctrl.shotType = "all";
        ctrl.angleType = "all";
        ctrl.stations = [1, 2, 3, 4, 5, 99];
        //ctrl.analysisType = "";
        ctrl.plotData = [];
        ctrl.velocityData = {};
        ctrl.swingPathData = {};

        ctrl.reloadCoachSummary = reloadCoachSummary;
        ctrl.selectTeam = selectTeam;
        ctrl.selectEvent = selectEvent;
        ctrl.deleteEvent = deleteEvent;
        ctrl.selectUserId = -1;

        ctrl.selectStation = selectStation;
        ctrl.selectShot = selectShot;
        ctrl.selectAngle = selectAngle;
        // ctrl.selectAnalysis = selectAnalysis;

        ctrl.getTemplate = getTemplate;
        ctrl.showThumbnail = showThumbnail;
        ctrl.changeRound = changeRound;
        ctrl.loadAnimationAnalysis = loadAnimationAnalysis;
        ctrl.loadAnalysis = loadAnalysis;
        ctrl.play = play;

        ctrl.goToAnalysisFPAO = goToAnalysisFPAO;
        ctrl.goToAnalysisSTAO = goToAnalysisSTAO;

        ctrl.gotoReport = gotoReport;
        ctrl.goToTeamMgmt = goToTeamMgmt;
        ctrl.buildDateRanges = buildDateRanges;
        ctrl.fullDate = fullDate;

        initController();
        function initController() {
            $scope.isLoading = true;
            buildDateRanges(); // read cookies, if available
            if ($routeParams.stDate != undefined) // override
            	ctrl.stDate = fullDate($routeParams.stDate);
            if ($routeParams.endDate != undefined)
            	ctrl.endDate = fullDate($routeParams.endDate);
            	
            ctrl.animationType = $rootScope.animationType;
        	try {
                getTemplate();
        	} catch (e) { // some error on first call.  Send back to login screen
        		$location.path("/login");
        	}
        }
        ctrl.getNumber = function (num) {
            return new Array(num);
        }

        function getTemplate() {
        	if (ctrl.viewType == "RS") {
                ctrl.templateURL = "summary/performanceSummary.html";
                getPerformanceSummaryData();
            } else if (ctrl.viewType == "SWG" || ctrl.viewType == "VEL" || ctrl.viewType == "MONEY") {
                ctrl.templateURL = "summary/analysisCharts.view.html";
            } else if (ctrl.viewType == 'COACH_SUMMARY') {
                ctrl.templateURL = "summary/coachSummary.view.html";
                getCoachSummaryData()
            } else {
                ctrl.title = "Summary";
                ctrl.templateURL = "summary/gridSummary.htm";
            }
        }

        // Called by the Round Summary view. 
        function getPerformanceSummaryData() {
        	// Do not cache previous data ...
            if (ctrl.perfSumm !== undefined && ctrl.selectUserId === ctrl.perfSumm.userId) {
                return;
            }
            ctrl.perfSumm = {};
            EventService.GetPerformanceSummaryAvg(-1, ctrl.selectUserId).then(function (perfSumm) {
                ctrl.perfSumm = perfSumm.results;
                ctrl.perfSumm.userId = ctrl.selectUserId;
                console.log(ctrl.perfSumm);
            });

            EventService.GetPerformanceSummary(-1, ctrl.selectUserId).then(function (perfData) {
                ctrl.perfData = perfData.results;
                console.log(ctrl.perfData);
                if(ctrl.perfData.length >0 ){
                    selectEvent(ctrl.perfData[0].eventId);
                }
                else
                	$scope.isLoading = false;
            });

        }
        //Coach summary data
        function getCoachSummaryData() {
            if (ctrl.coachSummData !== undefined) {
                return;
            }
            TeamMgmtService.GetTeams(function (response) {
                console.log(response);
                ctrl.coachTeams = response.teams;
                var t = {};
                t.id = -1;
                t.name = "All Teams";
                ctrl.coachTeams.unshift(t);
                if (ctrl.coachTeams.length > 0) {
                    if (ctrl.teamId == undefined) {
                        ctrl.currentTeam = ctrl.coachTeams[0];
                    } else {
                        ctrl.currentTeam = filterFilter(ctrl.coachTeams, {id: ctrl.teamId})[0];
                    }
                    getCoachSummary();

                }
            });

        }
        function getCoachSummary() {
        	// Declare string formated dates for WS call ...
        	var fromDate = "";
        	var toDate = "";
        	if (ctrl.stDate != undefined && !isNaN(ctrl.stDate.getTime()))
        		fromDate = $filter('date')(new Date(ctrl.stDate), 'yyyy-MM-dd');
        	else
        		ctrl.stDate = null; // reset it
        	if (ctrl.endDate != undefined && !isNaN(ctrl.endDate.getTime()))
        		toDate = $filter('date')(new Date(ctrl.endDate), 'yyyy-MM-dd');
        	else
        		ctrl.endDate = null;
        	
            EventService.GetCoachSummaryAvg(ctrl.currentTeam.id, fromDate, toDate, function (response) {
                console.log(response);
                if (response.success) {
                    ctrl.coachSummAvg = response.result;
                } else {
                    console.log("No data GetCoachSummaryAvg");
                }

            });
            EventService.GetCoachSummary(ctrl.currentTeam.id, fromDate, toDate, function (response) {
                console.log(response);
                if (response.success) {
                    ctrl.coachSummData = response.result; 
                    if (ctrl.coachSummData.length > 0) {
                        selectEvent(ctrl.coachSummData[0].eventId, ctrl.coachSummData[0].userId);
                    }
                } else {
                	$scope.isLoading = false; // stop progress here
                    console.log("No data GetCoachSummary");
                }
            });
        }

        function selectTeam(team) {
            ctrl.currentTeam = team;
        }
        function reloadCoachSummary() {
            $scope.isLoading = true;

            ctrl.coachSummData = [];
            ctrl.coachSummAvg = {};
            getCoachSummary();
        }
        function selectEvent(eventId, userId) {
            ctrl.eventId = eventId;
            if (userId !== undefined)
            	ctrl.selectUserId = userId;
            
            $scope.isLoading = true;    

            ctrl.summaryView = [];
            ctrl.stPov = [];
            ctrl.gnPov = [];
            ctrl.summaryVids = {};
            ctrl.totalRounds = 1;
            ctrl.assetsArray = [];
            ctrl.thumbnails = [];
            ctrl.roundScore = "0/0";
            ctrl.gunTgtPos = [];
            ctrl.title = "";
            ctrl.totalShotCnt = 0;
            ctrl.runningCnt = 0;

            getEventAssets();
        }
        function deleteEvent() {
        	if (ctrl.eventId != null) {
                EventService.DeleteEvent(ctrl.eventId, function (retData) {
                	reloadCoachSummary();
                });
        	}
        }
        function getEventAssets() {
            /* if (ctrl.animationType === undefined) {
             ctrl.animationType = 'summary';
             }*/
            EventService.GetEventDetails(ctrl.eventId).then(function (eventDet) {
                ctrl.eventDet = eventDet;
                console.log("ctrl.eventDet==>" + JSON.stringify(ctrl.eventDet));
                ctrl.totalRounds = ctrl.eventDet.shots / 25;

                // getTargetGunPositions requires eventDet ... so this call is nested here
                //Had to do this because an & sl was not returning thumbnails..so fetching everything :(
                EventService.GetEventAssets(ctrl.eventId, 'summary').then(function (eventAssets) {
                    ctrl.summaryView = eventAssets.results;
                    if (ctrl.summaryView === undefined)
                    	ctrl.summaryView = [];
                    console.log("event Assets===>" + ctrl.summaryView.length);
                    ctrl.totalShotCnt = 0;
                    for (var j = 1; j < ctrl.summaryView.length; j++) {
                        ctrl.totalShotCnt += ctrl.summaryView[j].length;
                    }
                    fillAssetsArray();
                    ctrl.beginShot = 0;
                    ctrl.endShot = ctrl.assetsArray.length;
                    ctrl.gunTgtPos = [];
                    ctrl.runningCnt = 0; // reset
                    getTargetGunPositions();
                });

            });

            //remove this if we get the assetImage from API later
            EventService.GetEventAssets(ctrl.eventId, 'stpov').then(function (eventAssets) {
                ctrl.stPov = eventAssets.results;
                if (ctrl.stPov === undefined)
                	ctrl.stPov = [];
                console.log(ctrl.stPov.length);
                fillAssetsArray();

            });

            EventService.GetEventAssets(ctrl.eventId, 'gnpov').then(function (eventAssets) {
                ctrl.gnPov = eventAssets.results;
                if (ctrl.gnPov === undefined)
                	ctrl.gnPov = [];
                console.log(ctrl.gnPov.length);
                fillAssetsArray();

            });

            EventService.GetEventSummaryVideoAssets(ctrl.eventId).then(function (eventSummaryVideoAssets) {
                ctrl.summaryVids = eventSummaryVideoAssets.results;
                console.log(ctrl.summaryVids);
            });
        }
        function fillAssetsArray() {
            if (ctrl.selectedRound <= 0 || ctrl.selectedRound === undefined) {
                ctrl.selectedRound = 1;
            }
            getTemplate();
            ctrl.assetsArray = ctrl.summaryView[ctrl.selectedRound];
            if (ctrl.animationType == 'stpov') {
                ctrl.animationArray = ctrl.stPov[ctrl.selectedRound];
            } else if (ctrl.animationType == 'gnpov') {
                ctrl.animationArray = ctrl.gnPov[ctrl.selectedRound];
            }
            if (ctrl.assetsArray !== undefined)
            {
                ctrl.roundScore = calculateScore() + "/" + ctrl.assetsArray.length;
                ctrl.shotsPerRoundCnt = 25;
                console.log("SummaryCtrl.assetsArray==>" + ctrl.assetsArray.length);
            }

            buildAnalysisView();
            selectStation("All");
        }
        function calculateScore() {
            var count = 0;
            for (var i = 0; i < ctrl.assetsArray.length; i++) {
                if (ctrl.assetsArray[i] !== undefined && ctrl.assetsArray[i].hit == 1) {
                    count++;
                }
            }
            return count;
        }
        function changeRound(roundNo) {
            // $location.path('/summary/' + ctrl.eventId + '/' + roundNo);
            $scope.isLoading = true;
            ctrl.selectedRound = roundNo;
            fillAssetsArray();
        }
        function loadAnimationAnalysis(animationType) {
            // $location.path('/animationSummary/' + ctrl.eventId + '/' + animationType)
            ctrl.animationType = animationType;
            ctrl.viewType = "S";
            $timeout(function () {
                //to give the user an effect that something has loaded ;)
                fillAssetsArray();
                ctrl.beginShot = 0;
                if (ctrl.assetsArray == undefined)
                	ctrl.endShot = 0;
                else
                	ctrl.endShot = ctrl.assetsArray.length;
            }, 500);

            hideExpandedMenu();
        }

        // When the user clicks on the Round Summary, or the Coach
        // Summary, this is the entry point of the function.
        function loadAnalysis(analysisType) {
            ctrl.beginShot = 0;
            if (ctrl.assetsArray == undefined)
            	ctrl.endShot = 0;
            else
            	ctrl.endShot = ctrl.assetsArray.length;
            if (analysisType == "STOA" || analysisType == "FPOA") {
                ctrl.viewType = analysisType;
                ctrl.animationType = "";
                hideExpandedMenu();
                getTemplate();
                $timeout(function () {
                    buildAnalysisView();
                }, 200);
            } else if (analysisType == "RS") {
                ctrl.viewType = analysisType;
                ctrl.animationType = "";
                hideExpandedMenu();
                getTemplate();

            } else if (analysisType == "COACH_SUMMARY") {
                ctrl.viewType = analysisType;
                ctrl.animationType = "";
                ctrl.selectUserId = -1; // do no restrict any user
                hideExpandedMenu();
                getTemplate();

            } else {
                // $location.path('/analysis/' + ctrl.eventId + '/' + analysisType + "/" + ctrl.selectedRound);
                ctrl.viewType = analysisType;
                ctrl.animationType = "";
                ctrl.angleType = "all";
                getTemplate();
                selectStation("All");
                //filterShots();

            }
        }
        function getType(at) {
            var type = "";
            if (at == 1) {
                type = "SWG";
            } else if (at == 2) {
                type = "VEL";
            } else if (at == 3) {
                type = "MONEY";
            }
            return type;
        }
        function goToAnalysisFPAO(angle, at) {
            loadAnalysis(getType(at));
            if (angle == "L/R") {
                ctrl.angleType = "lr";
            } else if (angle == "Ctr") {
                ctrl.angleType = "c";
            } else if (angle == "R/L") {
                ctrl.angleType = "rl";
            }
            selectStation("All");
            showExpandedMenu(ctrl.viewType);
        }
        function goToAnalysisSTAO(station, at) {
            loadAnalysis(getType(at));
            selectStation(station);
            showExpandedMenu(ctrl.viewType);
        }
        function showThumbnail(assetURL, shotNo) {
            var isVideo = 0;
            if (ctrl.animationType == "summary") {
                
//                //Should go with anguar modal approach..do later
//                var fs = document.getElementById("fsdiv");
//                var html = '<img id="fsImg" src=' + assetURL + ' class="fsImg" onclick="hidefs()">';
//                html += "<div class='snumdiv1'>" + shotNo + "</div>";
//                fs.innerHTML = html;
//
//                fs.style.display = "block";
            } else {
                /*if(deviceIsMobile){
                    play("single", shotNo);
                    return;
                }else{*/
                    isVideo = 1;
                    if (ctrl.animationArray == undefined) {
                        ctrl.animationArray = ctrl.stPov[ctrl.selectedRound];
                    }
                //}
            }
             var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'carousel.html',
                controller: 'ModalCarouselCtrl',
                size: "",
                resolve: {
                    isVideo: function(){
                        return isVideo;
                    },
                    shotNo: function () {
                        return shotNo;
                    },
                    assetsArray: function () {
                         return ctrl.assetsArray;
                    },
                    animationArray: function () {
                          return ctrl.animationArray;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                //$scope.selected = selectedItem;
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
            
        }
        function getVideoURLS(){
            if (ctrl.animationArray == undefined) {
                ctrl.animationArray = ctrl.stPov[ctrl.selectedRound];
            }
        }
        function play(type, shotNo) {
            var srcObj = [];
            var k = 0;
            if (ctrl.animationArray == undefined) {
                ctrl.animationArray = ctrl.stPov[ctrl.selectedRound];
            }
            var endLen = ctrl.animationArray.length;
            if (type == "single") {
                k = shotNo - 1;
                endLen = shotNo;
            }

            if ((type == "all" && ctrl.summaryVids.vall != '') ||
                    (type == "miss" && ctrl.summaryVids.vmisses != '') ||
                    (type == "hits" && ctrl.summaryVids.vhits != '')) {
                var videoSrc = "";
                if (type == "all")
                    videoSrc = $sce.trustAsResourceUrl(ctrl.summaryVids.vall);
                else if (type == "hits")
                    videoSrc = $sce.trustAsResourceUrl(ctrl.summaryVids.vhits);
                else if (type == "miss")
                    videoSrc = $sce.trustAsResourceUrl(ctrl.summaryVids.vmisses);

                var fs = document.getElementById("fsdiv");
                fs.innerHTML = '<video class="fs" id="fsplayer" src="' + videoSrc + '" controls autoplay></video>';
                fs.style.display = "block";
                goFullscreen("fsplayer");
                return;


            } else {
                //Remove all the videogular code as we are not using it anymore... :(
                for (; k < endLen; k++) {
                    if ((type == "hits" && ctrl.animationArray[k].hit != 1) || (type == "miss" && ctrl.animationArray[k].hit == 1)) {
                        continue;
                    }
                    var video = {};
                    video.src = $sce.trustAsResourceUrl(ctrl.animationArray[k].asset);
                    video.type = "video/mp4";
                    var urlsToPlay = [];
                    urlsToPlay.push(video);
                    var list = {};
                    list.sources = urlsToPlay;
                    srcObj.push(list);
                }
            }
            if (srcObj.length == 0) {
                alert('No shots found');
            } else {
                $rootScope.animationType = ctrl.animationType;
                // $rootScope.assetToPlay = srcObj;
                var modalInstance = $uibModal.open({
                    animation: 'true',
                    templateUrl: 'myModalContent.html',
                    controller: 'VideoController',
                    controllerAs: 'VideoCtrl',
                    size: 'lg',
                    resolve: {
                        assetToPlay: function () {
                            return srcObj;
                        }
                    }
                });

                modalInstance.result.then(function (selectedItem) {
                    $scope.selected = selectedItem;
                }, function () {
                    //$log.info('Modal dismissed at: ' + new Date());
                });
                //$location.path("/video");
            }
        }

        function getTargetGunPositions() {
            //var round = ctrl.selectedRound;
            var round = Math.floor(ctrl.runningCnt / 25) + 1;
            var shotNum = ctrl.runningCnt % 25;
            //for (var j = 0; j <= ctrl.totalRounds; j++) {
            //var round = j + 1;
            var tmpAssets = ctrl.summaryView[round];
            console.log("Round : " + round + " ==>" + shotNum);

            //  for (var i = 0; i < tmpAssets.length; i++) {
            if (tmpAssets[shotNum] === undefined) { 
                ctrl.initialLoad = false; // abort
                $scope.isLoading = false;
            }
            var eventAssetId = tmpAssets[shotNum].id;
            var shotNo = tmpAssets[shotNum].shot;
            var hit = tmpAssets[shotNum].hit;
            EventService.GetTargetNGunPositions(eventAssetId, ctrl.eventDet).then((function (eventAssetId, shotNo, round, hit) {
                return function (result) {
                    console.log("round : " + round + " : shotNo - " + shotNo);
                    var response = result.data;
                    var shotDetails = {};
                    shotDetails.id = eventAssetId;					// to track which ones to DL
                    shotDetails.shotNo = shotNo;					// to paginate
                    //shotDetails.plotStartIndex = response.ft;
                    shotDetails.angle = response.angle;				// for filtering
                    shotDetails.hit = hit;							// for filtering
                    //velocity chart data
                    shotDetails.timeData = response.tt; 			// needed for money shot
                    //shotDetails.gunSpeedData = response.gs;
                    //shotDetails.targetSpeedData = response.ts;
                    //swing path chart data
                    //shotDetails.gunXpos = response.gx;
                    //shotDetails.gunYpos = response.gy;
                    shotDetails.targetXpos = response.tx;			// needed for money shot
                    shotDetails.targetYpos = response.ty;			// needed for money shot

                    //ctrl.gunTgtPos[shotNo - 1] = shotDetails;

                    var roundRecArray = ctrl.gunTgtPos[round];
                    if (roundRecArray === undefined) {
                        roundRecArray = [];
                    }
                    roundRecArray[shotNo - 1] = shotDetails;
                    ctrl.gunTgtPos[round] = roundRecArray;
                    // console.log("ctrl.gunTgtPos==>"+JSON.stringify(ctrl.gunTgtPos));
                    ctrl.runningCnt++;
                    // console.log("ctrl.runningCnt : " + ctrl.runningCnt + " ctrl.totalShotCnt : " + ctrl.totalShotCnt);
                    if (ctrl.runningCnt >= ctrl.totalShotCnt) {
                        //calcuatePerFormanceAvg();
                        ctrl.initialLoad = false;
                        $scope.isLoading = false;
                    } else {
                        getTargetGunPositions();
                    }
                }
            })(eventAssetId, shotNo, round, hit));
        }

        function buildAnalysisView() {
            var roundData = ctrl.gunTgtPos[ctrl.selectedRound];
            if (ctrl.viewType == "STOA") {
                for (var station = 0; station < 5; station++) {
                    var plotData = [];
                    var beginShot = station * 5;//+ (ctrl.selectedRound-1) * 25;
                    var endShot = beginShot + 5;
                    if (endShot >= roundData.length) {
                        endShot = roundData.length;
                    }
                    for (var shot = beginShot; shot < endShot; shot++) {
                        //velocity overview
                        plotData.push(roundData[shot]);
                    }
                    paintAnalysis(station + 1, plotData);
                }
            } else if (ctrl.viewType == "FPOA") {
                var plotDataLR = [];
                var plotDataRL = [];
                var plotDataCTR = [];

                angular.forEach(roundData, function (item) {
                    if (Math.abs(item.angle) <= 60) {
                        plotDataLR.push(item);
                    } else if (Math.abs(item.angle) >= 120) {
                        plotDataRL.push(item);
                    } else {
                        plotDataCTR.push(item);
                    }

                });
                $timeout(function () {
                    paintAnalysis(0, plotDataLR);
                }, 200);
                $timeout(function () {
                    paintAnalysis(1, plotDataCTR);
                }, 200);
                $timeout(function () {
                    paintAnalysis(2, plotDataRL);
                }, 200);

            }
        }
        function getChartInfo() {
            var chartInfo = {};
            chartInfo.WIDTH = 160;
            chartInfo.HEIGHT = 90;
            chartInfo.M_TOP = 10;
            chartInfo.M_BOTTOM = 10;
            chartInfo.M_LEFT = 10;
            chartInfo.M_RIGHT = 10;
            chartInfo.legend = false;
            chartInfo.axis = true;
            chartInfo.border = true;
            chartInfo.x = ctrl.eventDet.aimx;
            chartInfo.y = ctrl.eventDet.aimy;
            chartInfo.radius = ctrl.eventDet.aimradius;
            chartInfo.winx = ctrl.eventDet.winx;
            chartInfo.winy = ctrl.eventDet.winy;
            return chartInfo;
        }
        function paintAnalysis(id, plotData) {
            var chartInfo = getChartInfo();
            chartInfo.id = "#c_" + (id) + "_" + 1;
            drawSwingPathAnalysisChart(plotData, chartInfo);
            var chartInfo1 = getChartInfo();
            chartInfo1.id = "#c_" + (id) + "_" + 2;

            drawSwingVelocityChart(plotData, chartInfo1);
            var chartInfo2 = getChartInfo();

            chartInfo2.id = "#c_" + (id) + "_" + 3;
            chartInfo2.HEIGHT = chartInfo2.WIDTH = 90;
            chartInfo2.M_BOTTOM = chartInfo2.M_LEFT = chartInfo2.M_RIGHT = chartInfo2.M_TOP = 0;
            chartInfo2.border = false;
            drawMoneyShotChart(plotData, chartInfo2);
        }
        function checkAngleHit(index, param, item) {
            if (item.hit == 1) {
                param[index] = param[index] + 1;
            }
        }



        //analysis related
        function selectStation(stationNo) {
            var roundData = ctrl.gunTgtPos[ctrl.selectedRound];
            if (roundData == undefined) {
                return;
            }
            ctrl.selectedStation = stationNo;
            ctrl.stations = [1, 2, 3, 4, 5, "All"];

            if (ctrl.selectedStation == "All") {
                ctrl.beginShot = 1;
                ctrl.endShot = 25;
            } else {
                ctrl.beginShot = 1 + (stationNo - 1) * 5;
                ctrl.endShot = stationNo * 5;
            }

            ctrl.plotData = [];
            ctrl.shotType = "all";
            //buildTitle();
            // getTargetGunPositions(ctrl.beginShot);


            if (ctrl.endShot >= roundData.length) {
                ctrl.endShot = roundData.length;
            }
            for (var i = ctrl.beginShot; i <= ctrl.endShot; i++) {
                ctrl.plotData.push(roundData[i - 1]);
            }
            $timeout(function () {
                // plotAnalysisChart(ctrl.plotData);
                filterShots();
            }, 200);


        }
        function selectShot(shotType)
        {
            ctrl.shotType = shotType;
            filterShots();
            //selectStation(ctrl.selectedStation);
        }

        function selectAngle(angleType) {
            ctrl.angleType = angleType;
            filterShots();
        }
        function filterShots() {
            ctrl.shotsToDisplay = [];
            if (ctrl.angleType == "all" && ctrl.shotType == "all") {
                plotAnalysisChart(ctrl.plotData);
            } else {
                fillAngleShots();
                fillByShotTypes();
                var resultsArr = sortAndFindDuplicates(ctrl.shotsToDisplay);
                var anglePlotData = [];
                for (var i = 0; i < resultsArr.length; i++) {
                    anglePlotData.push(ctrl.plotData[resultsArr[i]]);
                }
                // plotAnalysisChart(anglePlotData);
                $timeout(function () {
                    plotAnalysisChart(anglePlotData);
                }, 100);
            }
        }
        function fillByShotTypes() {
            if (ctrl.shotType == "all") {
                for (var i = 0; i < ctrl.plotData.length; i++) {
                    ctrl.shotsToDisplay.push(i);
                }
            } else {
                var tmpArr = ctrl.plotData;

                for (var k = 0; k < tmpArr.length; k++) {
                    if ((ctrl.shotType == "hits" && tmpArr[k].hit == 1) || (ctrl.shotType == "miss" && tmpArr[k].hit != 1)) {
                        ctrl.shotsToDisplay.push(k);
                    }
                }
            }
        }
        function fillAngleShots() {
            if (ctrl.angleType == "all") {
                for (var i = 0; i < ctrl.plotData.length; i++) {
                    ctrl.shotsToDisplay.push(i);
                }
            } else {
                for (var k = 0; k < ctrl.plotData.length; k++) {
                    var aa = Math.abs(ctrl.plotData[k].angle);
                    console.log("Angle==>" + aa);
                    if (ctrl.angleType == "lr" && aa <= 60) {
                        ctrl.shotsToDisplay.push(k);
                    } else if (ctrl.angleType == "rl" && aa >= 120) {
                        ctrl.shotsToDisplay.push(k);
                    } else if (ctrl.angleType == "c" && aa > 60 && aa < 120) {
                        ctrl.shotsToDisplay.push(k);
                    }
                }
            }
        }
        function sortAndFindDuplicates(arr) {


            var results = [];
            var sorted_arr = arr.slice().sort();
            for (var i = 0; i < arr.length - 1; i++) {
                if (sorted_arr[i + 1] == sorted_arr[i]) {
                    results.push(sorted_arr[i]);
                }
            }
            return results;
        }

        function plotAnalysisChart(plotData) {
            buildTitle();
            console.log(JSON.stringify(plotData));
            var plotInfo = {};
            plotInfo.WIDTH = 800;
            plotInfo.HEIGHT = 505;
            plotInfo.M_TOP = 50;
            plotInfo.M_BOTTOM = 50;
            plotInfo.M_LEFT = 50;
            plotInfo.M_RIGHT = 50;
            plotInfo.id = "#visualisation";
            plotInfo.legend = true;
            plotInfo.axis = true;
            plotInfo.x = ctrl.eventDet.aimx;
            plotInfo.y = ctrl.eventDet.aimy;
            plotInfo.radius = ctrl.eventDet.aimradius;
            plotInfo.winx = ctrl.eventDet.winx;
            plotInfo.winy = ctrl.eventDet.winy;
            $timeout(function () {
                if (ctrl.viewType == "VEL") {
                    // drawVelocityChart(plotData);
                    drawSwingVelocityChart(plotData, plotInfo);
                } else if (ctrl.viewType == "SWG") {
                    drawSwingPathAnalysisChart(plotData, plotInfo);
                } else if (ctrl.viewType == "MONEY") {
                    plotInfo.WIDTH = plotInfo.HEIGHT;
                    drawMoneyShotChart(plotData, plotInfo);
                }
            });
        }
        function drawSwingVelocityChart(plotData, plotInfo) {
            var eventAssetIds = getEventAssetIDsToFetch(plotData, ctrl.velocityData);
            console.log("eventAssetIds===>" + eventAssetIds);
            if (eventAssetIds == "") {
                drawVelocityChart(plotData, plotInfo);
            } else {
                eventAssetIds = eventAssetIds.substr(0, eventAssetIds.length - 1);
                //EventService.GetSwingPathData(eventAssetIds).then(function (velocityData) {
                EventService.GetSwingVelocityData(eventAssetIds).then(function (velocityData) {
                    var data = velocityData.results;
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            ctrl.velocityData[key] = data[key];
                        }
                    }
                    //fillData
                    for (var i = 0; i < plotData.length; i++) {
                        if (ctrl.velocityData[plotData[i].id] != undefined) {
                            var dataRec = ctrl.velocityData[plotData[i].id];
                            plotData[i].x = dataRec.x;
                            plotData[i].gs = dataRec.g;
                            plotData[i].ts = dataRec.t;
                        } else {
                            console.log("CRITICAL ERROR : This should not happen");
                        }
                    }
                    drawVelocityChart(plotData, plotInfo);
                });
            }
        }
        function getEventAssetIDsToFetch(plotData, data) {
            var eventAssetIds = "";
            for (var i = 0; i < plotData.length; i++) {
                if (data[plotData[i].id] == undefined) {
                    eventAssetIds += plotData[i].id + ",";
                }
            }
            return eventAssetIds;
        }
        function drawSwingPathAnalysisChart(plotData, plotInfo) {
            var eventAssetIds = getEventAssetIDsToFetch(plotData, ctrl.swingPathData);

            console.log("eventAssetIds===>" + eventAssetIds);
            if (eventAssetIds == "") {
                //fillData
                for (var i = 0; i < plotData.length; i++) {
                    if (ctrl.swingPathData[plotData[i].id] != undefined) {
                        var dataRec = ctrl.swingPathData[plotData[i].id];
                        plotData[i].gx = dataRec.gx;
                        plotData[i].gy = dataRec.gy;
                        plotData[i].tx = dataRec.tx;
                        plotData[i].ty = dataRec.ty;
                    } else {
                        console.log("CRITICAL ERROR : This should not happen");
                    }
                }
                drawSwingPathChart(plotData, plotInfo);
            } else {
                eventAssetIds = eventAssetIds.substr(0, eventAssetIds.length - 1);
                EventService.GetSwingPathData(eventAssetIds).then(function (pathData) {
                    var data = pathData.results;
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            ctrl.swingPathData[key] = data[key];
                        }
                    }
                    //fillData
                    for (var i = 0; i < plotData.length; i++) {
                        if (ctrl.swingPathData[plotData[i].id] != undefined) {
                            var dataRec = ctrl.swingPathData[plotData[i].id];
                            plotData[i].gx = dataRec.gx;
                            plotData[i].gy = dataRec.gy;
                            plotData[i].tx = dataRec.tx;
                            plotData[i].ty = dataRec.ty;
                        } else {
                            console.log("CRITICAL ERROR : This should not happen");
                        }
                    }
                    drawSwingPathChart(plotData, plotInfo);
                });
            }
        }
        function buildTitle() {
            if (ctrl.viewType == "S") {
                return;
            }
            var tmp = "";
            if (ctrl.viewType == "VEL") {
                tmp += "Swing Velocities";
            } else if (ctrl.viewType == "SWG") {
                tmp += "Swing Paths";
            } else if (ctrl.viewType == "MONEY") {
                tmp += "Money Shot";
            }
            tmp += " - ";
            if (ctrl.shotType == "all") {
                tmp += "All Shots";
            } else if (ctrl.shotType == "hits") {
                tmp += "Hits";
            } else if (ctrl.shotType == "miss") {
                tmp += "Misses";
            }
            ctrl.title = "" + tmp + ", Station " + ctrl.selectedStation;
        }
        
        //Coach
        function goToTeamMgmt() {
            $location.path("/teamManagement/"+ctrl.currentTeam.id)
        }

        //Report
        function gotoReport() {
        	var fromDate = "";
        	var toDate = "";
        	if (ctrl.stDate != undefined && !isNaN(ctrl.stDate.getTime()))
        		fromDate = $filter('date')(new Date(ctrl.stDate), 'yyyy-MM-dd');
        	else
        		ctrl.stDate = null; // reset it
        	if (ctrl.endDate != undefined && !isNaN(ctrl.endDate.getTime()))
        		toDate = $filter('date')(new Date(ctrl.endDate), 'yyyy-MM-dd');
        	else
        		ctrl.endDate = null;

        	if (fromDate == "" || toDate == "")
        		$location.path("/report/"+ctrl.currentTeam.id);
        	else
        		$location.path("/report/"+ctrl.currentTeam.id+"/"+fromDate+"/"+toDate);
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
        	if (ctrl.endDate == null || ctrl.endDate > $scope.dateOptions2.maxDate || ctrl.endDate < $scope.dateOptions2.minDate || (ctrl.stDate != null && ctrl.endDate < ctrl.stDate))
        		ctrl.endDate = null;
        	// Clear start date if out of global bounds
        	if (ctrl.stDate == null || ctrl.stDate > $scope.dateOptions1.maxDate || ctrl.stDate < $scope.dateOptions1.minDate)
        	{
        		ctrl.stDate = null;
        		$scope.dateOptions2.minDate = $scope.addDays(new Date(), -2 * 365);
        	}
        }
        
        $scope.open1 = function () {
        	// allow start date to be anything
            $scope.popup1.opened = true;
        };

        $scope.open2 = function () {
        	// limit end date or base on start date
            if (ctrl.stDate !== undefined && ctrl.stDate != null ) {
                $scope.dateOptions2.minDate = ctrl.stDate;
            } else {
                $scope.dateOptions2.minDate = $scope.addDays(new Date(), -2 * 365);
            }
            $scope.popup2.opened = true;
        };

        // see that this matches logic in TeamManagementController
        function buildDateRanges() {
        	var title = $cookieStore.get('rangeTitle');
        	if (title == null)
        		return;
            var curr = new Date;
            if (title === "Current Week") {
                ctrl.stDate = new Date(curr.setDate(curr.getDate() - curr.getDay()));
                ctrl.endDate = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
            } else if (title === "Last 4 Weeks") {
            	ctrl.stDate = new Date(curr.setDate(curr.getDate() - curr.getDay() - 21));
            	ctrl.endDate = new Date(curr.setDate(curr.getDate() + 27));
            } else if (title === "Custom Range") {
            	ctrl.stDate = ($cookieStore.get('fromDate') != null)? new Date($cookieStore.get('fromDate')) : null;
            	ctrl.endDate = ($cookieStore.get('toDate') != null)? new Date($cookieStore.get('toDate')) : null;
            }
        }

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

    }
    
    function fullDate(str)
    {
    	var d = new Date();
    	var ymd = str.split('-');
    	if (ymd.length == 3) {
    		d.setFullYear(ymd[0],parseInt(ymd[1])-1,ymd[2]);
    		return d;
    	}
    	return null;
    }
})();