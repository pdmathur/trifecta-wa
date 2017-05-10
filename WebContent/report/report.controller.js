(function () {
    'use strict';

    angular
            .module('app')
            .controller('ReportController', ReportController);

    ReportController.$inject = ['$scope', '$location', '$routeParams', '$cookieStore','EventService', '$rootScope', '$sce', '$timeout', '$filter', 'filterFilter', 'TeamMgmtService'];
    function ReportController($scope, $location, $routeParams, $cookieStore, EventService, $rootScope, $sce, $timeout, $filter, filterFilter, TeamMgmtService) {
        var ctrl = this;
        ctrl.teamData = [];
        ctrl.threads = 0;
        ctrl.stDate = $routeParams.stDate || "";
        ctrl.endDate = $routeParams.endDate || "";
        ctrl.teamId = $routeParams.teamId || -1;
        ctrl.gotoCoach = gotoCoach;
        
        initController();
        $timeout(checkLoading, 500);
        
        function initController() {
        	console.log("Report init");
        	ctrl.threads = 0;
        	try {
        		getFullSummaryData();
        	} catch (e) { // some error on first call.  Send back to login screen
        		$location.path("/login");
        	}
        }
        
        function checkLoading() {
        	$scope.isLoading = (ctrl.threads == 0)? false : true;
        	$timeout(checkLoading, 500);
        }
        
        function gotoCoach() {
        	if (ctrl.stDate == null || ctrl.stDate === "" || ctrl.endDate == null || ctrl.endDate === "")
        		$location.path("/summary/COACH_SUMMARY/"+ctrl.teamId);
        	else
        	   $location.path("/summary/COACH_SUMMARY/"+ctrl.teamId+"/"+ctrl.stDate+"/"+ctrl.endDate);
        }
        


        function getFullSummaryData() {
        	ctrl.teamData = [];
        	ctrl.threads++;
            TeamMgmtService.GetTeams(function (response) {
            	ctrl.threads--;
            	console.log(response);
            	ctrl.teamData = response.teams;
            	getCoachSummaries();
            });
        }
        
        function getCoachSummaries() {
        	for (var i=0; i<ctrl.teamData.length; i++) {
        		if (ctrl.teamId == -1 || ctrl.teamId == ctrl.teamData[i].id) {
                	ctrl.threads++;
            		EventService.GetCoachSummary(ctrl.teamData[i].id, ctrl.stDate, ctrl.endDate, (function (teamIdx) {
            			return function (perfData) {
            	        	ctrl.threads--;
                    		if (perfData.success) { // if data ...
                    			ctrl.teamData[teamIdx].ps = organizeByUser(perfData.result);
                    			getEventData(teamIdx);
                    			getEventAssets(teamIdx);
                    		}
                    		else
                    			ctrl.teamData[teamIdx].ps = [];
            			}
            		}(i)))
            	}
        	}
        }

        function getEventData(teamIdx) {
        	for (var i=0; i<ctrl.teamData[teamIdx].ps.length; i++) {
            	ctrl.threads++;
        		var eid = ctrl.teamData[teamIdx].ps[i].maxEventId;
            	EventService.GetEventDetails(eid).then((function (eid, teamIdx, i) {
            		return function (eventDet) {
                    	ctrl.threads--;
            			ctrl.teamData[teamIdx].ps[i].eventDet = eventDet;
            		};
            	}(eid, teamIdx, i)));
        	}
        }

        function getEventAssets(teamIdx) {
        	for (var i=0; i<ctrl.teamData[teamIdx].ps.length; i++) {
            	ctrl.threads++;
        		var eid = ctrl.teamData[teamIdx].ps[i].maxEventId;
        		EventService.GetEventAssets(eid, 'summary').then((function (eid, teamIdx, i) {
            		return function (eventAssets) {
                    	ctrl.threads--;
                    	ctrl.teamData[teamIdx].ps[i].eventAssets = eventAssets.results;
            			getTgtGunPos(teamIdx, i);
            			getSwingVelocities(teamIdx, i);
            			getSwingPath(teamIdx, i);
            		};
            	}(eid, teamIdx, i)));
        	}
        }

        function getTgtGunPos(teamIdx, pIdx)
        {
        	var round = 1; // TODO ... hard code round 1
        	if (ctrl.teamData[teamIdx].ps[pIdx].eventAssets.length < round + 1)
        		return;
        	
        	ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].countDL = 0;
        	for (var i=0; i<ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length; i++) // i == shot index
        	{
        		var esid = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].id;
                var shotNo = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shot;
                var hit = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].hit;
        		var evDet = ctrl.teamData[teamIdx].ps[pIdx].eventDet;

            	ctrl.threads++;
            	EventService.GetTargetNGunPositions(esid, evDet).then((function (esid, shotNo, round, hit) {
                    return function (result) {
                    	ctrl.threads--;
                    	ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].countDL++;
                    	
                        console.log("round : " + round + " : shotNo - " + shotNo);
                        var response = result.data;
                        var shotDetails = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][shotNo - 1];
                        shotDetails.shotNo = shotNo;					// to paginate
                        if (response !== undefined) {
                            //shotDetails.id = esid;					// to track which ones to DL
                            shotDetails.angle = response.angle;				// for filtering
                            //shotDetails.hit = hit;							// for filtering
                            //velocity chart data
                            shotDetails.timeData = response.tt; 			// needed for money shot
                            shotDetails.targetXpos = response.tx;			// needed for money shot
                            shotDetails.targetYpos = response.ty;			// needed for money shot
                            ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][shotNo - 1] = shotDetails;
                            
                            if (ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].countDL == ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length) {
                            	// do plots
                            	var plotName = '#vis-rpt-'+ctrl.teamData[teamIdx].id+'-'+ctrl.teamData[teamIdx].ps[pIdx].recs[0].userId;
                            	plotAnalysisChart(plotName+'-money', ctrl.teamData[teamIdx].ps[pIdx], 'MONEY');
                            }
                        }
                    }
                })(esid, shotNo, round, hit));
        	}
        }

        function getSwingVelocities(teamIdx, pIdx)
        {
        	var round = 1; // TODO ... hard code round 1
        	
        	if (ctrl.teamData[teamIdx].ps[pIdx].eventAssets.length < round + 1)
        		return;

        	// construct a vector of ids to download
        	var evIds = "";
        	for (var i=0; i<ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length; i++)  {// i == shot index
        		evIds = evIds + ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].id +
        		   ((i < ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length - 1)? "," : "");
        	}
        	
        	ctrl.threads++;
            EventService.GetSwingVelocityData(evIds).then((function (teamIdx, pIdx) {
            	return function (velocityData) {
            		ctrl.threads--;
            		var data = velocityData.results;
            		for (var i = 0; i < ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length; i++) {
            			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shotNo = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shotNo = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shot;
                		if (data !== undefined) {// trajectories were loaded
                			var id = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].id;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].x = data[id].x;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].gs = data[id].g;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].ts = data[id].t;
                		}
            		}
            		var plotName = '#vis-rpt-'+ctrl.teamData[teamIdx].id+'-'+ctrl.teamData[teamIdx].ps[pIdx].recs[0].userId;
            		plotAnalysisChart(plotName+'-vel', ctrl.teamData[teamIdx].ps[pIdx], 'VEL');
            	};
            }(teamIdx, pIdx)));
        }

        function getSwingPath(teamIdx, pIdx)
        {
        	var round = 1; // TODO ... hard code round 1
        	
        	if (ctrl.teamData[teamIdx].ps[pIdx].eventAssets.length < round + 1)
        		return;

        	// construct a vector of ids to download
        	var evIds = "";
        	for (var i=0; i<ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length; i++)  {// i == shot index
        		evIds = evIds + ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].id +
        		   ((i < ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length - 1)? "," : "");
        	}
        	
        	ctrl.threads++;
            EventService.GetSwingPathData(evIds).then((function (teamIdx, pIdx) {
            	return function (pathData) {
            		ctrl.threads--;
            		var data = pathData.results;
            		for (var i = 0; i < ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round].length; i++) {
            			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shotNo = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].shot;
                		if (data !== undefined) { // if trajectories available
                			var id = ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].id;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].gx = data[id].gx;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].gy = data[id].gy;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].tx = data[id].tx;
                			ctrl.teamData[teamIdx].ps[pIdx].eventAssets[round][i].ty = data[id].ty;
                		}
            		}
            		var plotName = '#vis-rpt-'+ctrl.teamData[teamIdx].id+'-'+ctrl.teamData[teamIdx].ps[pIdx].recs[0].userId;
            		plotAnalysisChart(plotName+'-swg', ctrl.teamData[teamIdx].ps[pIdx], 'SWG');
            	};
            }(teamIdx, pIdx)));
        }
        
        function organizeByUser(rawData)
        {
        	var fps = [];
        	for (var i=0; i<rawData.length; i++) {
        		var found = false;
        		for (var j=0; j<fps.length; j++) { // add to existing group
        			if (fps[j].userId == rawData[i].userId) {
        				var n = fps[j].recs.length;
        				fps[j].recs[n] = rawData[i];
        				fps[j].totalHits += rawData[i].totalHits;
        				fps[j].totalShots += rawData[i].totalShots;
        				for (var k=1; k<=rawData[i].stHits.length; k++)
        					fps[j].stHits[k] += rawData[i].stHits[k];
        				fps[j].aimShots = 0;
            			for (var k=0; k<rawData[i].angleHits.length; k++) {
            				fps[j].angleHits[k] += parseInt(rawData[i].angleHits[k].split('/')[0]);
            				fps[j].angleShots[k] += parseInt(rawData[i].angleHits[k].split('/')[1]);
            				fps[j].aimShots += fps[j].angleShots[k];
            			}
        				for (var k=0; k<rawData[i].aimHits.length; k++)
        					fps[j].aimHits[k] += rawData[i].aimHits[k];
        				if (fps[j].maxDate < rawData[i].date || (fps[j].maxDate == rawData[i].date && fps[j].maxEventId < rawData[i].eventId)) {
        					fps[j].maxDate = rawData[i].date;
        					fps[j].maxEventId = rawData[i].eventId;
        				}
        				found = true;
        				break;
        			}
        		}
        		if (found == false) { // add new group
        			var n = fps.length;
        			fps[n] = {};
        			fps[n].userId = rawData[i].userId;
        			fps[n].recs = [];
        			fps[n].recs[0] = rawData[i];
        			
        			fps[n].totalHits = rawData[i].totalHits;
        			fps[n].totalShots = rawData[i].totalShots;
        			fps[n].stHits = [];
        			for (var k=0; k<rawData[i].stHits.length; k++)
        				fps[n].stHits[k] = rawData[i].stHits[k];
        			fps[n].angleHits = [];
        			fps[n].angleShots = [];
        			fps[n].aimShots = 0;
        			for (var k=0; k<rawData[i].angleHits.length; k++) {
        				fps[n].angleHits[k] = parseInt(rawData[i].angleHits[k].split('/')[0]);
        				fps[n].angleShots[k] = parseInt(rawData[i].angleHits[k].split('/')[1]);
        				fps[n].aimShots += fps[n].angleShots[k]; 
        			}
        			fps[n].aimHits = [];
        			for (var k=0; k<rawData[i].aimHits.length; k++)
        				fps[n].aimHits[k] = rawData[i].aimHits[k];
        			fps[n].maxDate = rawData[i].date;
        			fps[n].maxEventId = rawData[i].eventId;
        		}
        	}
        	return fps;
        }
        
        function plotAnalysisChart(id, ps, viewType) {
            var plotInfo = {};
            plotInfo.WIDTH = 800;
            plotInfo.HEIGHT = 505;
            plotInfo.M_TOP = 50;
            plotInfo.M_BOTTOM = 50;
            plotInfo.M_LEFT = 50;
            plotInfo.M_RIGHT = 50;
            plotInfo.id = id;
            plotInfo.legend = false;
            plotInfo.showShotNum = true;
            plotInfo.axis = true;
            plotInfo.x = ps.eventDet.aimx;
            plotInfo.y = ps.eventDet.aimy;
            plotInfo.radius = ps.eventDet.aimradius;
            plotInfo.winx = ps.eventDet.winx;
            plotInfo.winy = ps.eventDet.winy;
            $timeout(function () {
                if (viewType == "VEL") {
                    drawVelocityChart(ps.eventAssets[1], plotInfo);
                } else if (viewType == "SWG") {
                	drawSwingPathChart(ps.eventAssets[1], plotInfo);
                } else if (viewType == "MONEY") {
                    plotInfo.WIDTH = plotInfo.HEIGHT; // make square
                    drawMoneyShotChart(ps.eventAssets[1], plotInfo);
                }
            });
        }

    }
})();