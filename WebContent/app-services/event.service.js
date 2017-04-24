(function () {
    'use strict';

    angular
            .module('app')
            .factory('EventService', EventService);

    EventService.$inject = ['$http', '$rootScope', '$filter'];
    function EventService($http, $rootScope, $filter) {
        var service = {};

        var assetRequestType = 'sm';

        service.GetEvents = GetEvents;
        service.GetEventDetails = GetEventDetails;
        service.GetEventAssets = GetEventAssets;
        service.GetEventSummaryVideoAssets = GetEventSummaryVideoAssets;
        service.GetTargetNGunPositions = GetTargetNGunPositions;
        service.GetSwingVelocityData = GetSwingVelocityData;
        service.GetSwingPathData = GetSwingPathData;
        service.GetEventVideos = GetEventVideos;
        service.GetPerformanceSummaryAvg = GetPerformanceSummaryAvg;
        service.GetPerformanceSummary = GetPerformanceSummary;
        service.GetCoachSummary = GetCoachSummary;
        service.GetCoachSummaryAvg = GetCoachSummaryAvg;
        service.DeleteEvent = DeleteEvent;
        return service;

        function GetEvents() {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "lse", "max": -1, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetEvents, handleError('Error fetching events'));
        }
        function GetEventDetails(eventId) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "ged", "eid": eventId, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetEventDetails, handleError('Error fetching events'));
        }

        function handleGetEventDetails(response) {
            var xmlDoc = response.data;
            var retValue = {};
            var x = xmlDoc.getElementsByTagName("success");

            if (x[0].childNodes[0].nodeValue == "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch event details";
            } else {
                retValue.description = xmlDoc.getElementsByTagName("description")[0].childNodes[0].nodeValue;
                retValue.name = xmlDoc.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                retValue.field = xmlDoc.getElementsByTagName("field")[0].childNodes[0].nodeValue;
                retValue.shots = xmlDoc.getElementsByTagName("shots")[0].childNodes[0].nodeValue;
                retValue.hits = xmlDoc.getElementsByTagName("hits")[0].childNodes[0].nodeValue;
                retValue.aimx = parseFloat(xmlDoc.getElementsByTagName("aimx")[0].childNodes[0].nodeValue);
                retValue.aimy = parseFloat(xmlDoc.getElementsByTagName("aimy")[0].childNodes[0].nodeValue);
                retValue.aimradius = parseFloat(xmlDoc.getElementsByTagName("aimradius")[0].childNodes[0].nodeValue);
                retValue.winx = parseFloat(xmlDoc.getElementsByTagName("winx")[0].childNodes[0].nodeValue);
                retValue.winy = parseFloat(xmlDoc.getElementsByTagName("winy")[0].childNodes[0].nodeValue);

            }
            return retValue;
        }
        function GetEventAssets(eventId, type) {
            if (type === "stpov") {
                assetRequestType = "an";
            } else if (type === "gnpov") {
                assetRequestType = "sl";

            } else {
                assetRequestType = "sm";

            }
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gea", "eid": eventId, "t": assetRequestType, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetEventAssets, handleError('Error fetching events'));
        }
        function GetEventSummaryVideoAssets(eventId) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gea2", "eid": eventId, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetEventSummaryVideoAssets, handleError('Error fetching events'));
        }
        function GetTargetNGunPositions(eventShotId, eventDet) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gesgtp", "esid": eventShotId, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(function(data) { return handleGetTargetNGunPositions(data, eventDet) }, handleError('Error fetching positions'));
        }
        function handleGetTargetNGunPositions(response, eventDet) {
            var xmlDoc = response.data;
            var retValue = {};
            var x = xmlDoc.getElementsByTagName("success");
            
            if (eventDet === undefined || eventDet.winx === undefined) // setup defaults
            {
            	eventDet = {};
            	eventDet.winx = 640;
            	eventDet.winy = 480;
            	eventDet.aimradius = 20;
            }

            if (x[0].childNodes[0].nodeValue == "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch events";
            } else {
                var t1 = xmlDoc.getElementsByTagName("stype");
                var t2 = xmlDoc.getElementsByTagName("x");
                var t3 = xmlDoc.getElementsByTagName("y");
                var t4 = xmlDoc.getElementsByTagName("t");
                var a = {};
                var stype;
                //a.stype = [];
                a.gx = [];
                a.gy = [];
                //a.gt = [];
                a.tx = [];
                a.ty = [];
                a.tt = [];
                //a.gs = [];
                //a.ts = [];
                //a.maxgs = 0;
                //a.maxts = 0;
                a.ft = 0;
                //var alpha = 0.2;
                var i;
                var firstTgtIdx = -1;
                var gi = 0; // index of gun aim point sample
                var ti = 0; // index of target sample
                for (i = 0; i < t1.length; i++) {
                    stype = t1[i].childNodes[0].nodeValue;
                    if (stype == "t") {
                        a.tx[ti] = parseInt(t2[i].childNodes[0].nodeValue);
                        a.ty[ti] = parseInt(t3[i].childNodes[0].nodeValue);
                        a.tt[ti] = parseFloat(t4[i].childNodes[0].nodeValue);
                        //if (ti > 0) {  
                        //    a.ts[ti] = Math.sqrt(Math.pow(a.tx[ti] - a.tx[ti - 1], 2) + Math.pow(a.ty[ti] - a.ty[ti - 1], 2)) * alpha + (1 - alpha) * a.ts[ti - 1];

                        //} else {
                        //    a.ts[0] = 0;
                        //}
                        
                        // record the maximum target speed
                        //if (a.maxts < a.ts[ti])
                        //    a.maxts = a.ts[ti];
                        
                        // record the index where target was first seen (actually, its last value will be the sample just prior)
                        if (a.tx[ti] == -eventDet.winx/2 && a.ty[ti] == -eventDet.winy/2 && a.tt[ti] < -0.1)
                            firstTgtIdx = ti;

                        ti++;
                    } else {
                        a.gx[gi] = parseInt(t2[i].childNodes[0].nodeValue);
                        a.gy[gi] = parseInt(t3[i].childNodes[0].nodeValue);
                        //a.gt[gi] = parseInt(t4[i].childNodes[0].nodeValue); // no need for this
                        //if (gi > 0)
                        //    a.gs[gi] = Math.sqrt(Math.pow(a.gx[gi] - a.gx[gi - 1], 2) + Math.pow(a.gy[gi] - a.gy[gi - 1], 2)) * alpha + (1 - alpha) * a.gs[gi - 1];
                        //else
                        //    a.gs[0] = 0;
                        
                        // record the maximum gun speed
                        //if (a.maxgs < a.gs[gi])
                        //    a.maxgs = a.gs[gi];
                        gi++;
                    }
                }
                a.ft = firstTgtIdx + 1;
                a.angle = 180 / Math.PI * Math.atan2(a.ty[a.ft] - a.ty[ti - 1],
                        a.tx[ti - 1] - a.tx[a.ft]);

                retValue.data = a;
            }
            return retValue;
        }
        function handleGetEvents(response) {
            var xmlDoc = response.data;
            var retValue = {};
            var x = xmlDoc.getElementsByTagName("success");

            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch events";
            } else {
                var events = [];
                var t1 = xmlDoc.getElementsByTagName("id");
                var t2 = xmlDoc.getElementsByTagName("description");
                var t3 = xmlDoc.getElementsByTagName("date");


                for (var i = 0; i < t1.length; i++) {
                    var event = {};
                    event.id = t1[i].childNodes[0].nodeValue;
                    event.date = t3[i].childNodes[0].nodeValue;
                    if (t2[i].childNodes.length > 0)
                        event.desc = t2[i].childNodes[0].nodeValue;
                    else
                        event.desc = '<i>No description</i>';
                    events.push(event);
                }
                retValue.events = events;
            }
            return retValue;
        }

        function handleGetEventAssets(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch event assets";
            } else {
                retValue.results = scanassets(xmlDoc);
                /*if (assetRequestType === 'sm')
                 retValue.a_sm = scanassets(xmlDoc);
                 else if (assetRequestType === 'sl')
                 retValue.a_sl = scanassets(xmlDoc);
                 else if (assetRequestType === 'an')
                 retValue.a_an = scanassets(xmlDoc);*/
            }
            return retValue;
        }

        function handleGetEventSummaryVideoAssets(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch event summary video assets";
            } else {
                retValue.results = {};
                retValue.results.vall = '';
                retValue.results.vhits = '';
                retValue.results.vmisses = '';
                var records = xmlDoc.getElementsByTagName("rec");
                for (var i = 0; i < records.length; i++) {
                    var atype = records[i].getElementsByTagName("type")[0].childNodes[0].nodeValue;
                    var aasset = records[i].getElementsByTagName("asset")[0].childNodes[0].nodeValue;
                    if (atype == "vall")
                        retValue.results.vall = S3bucket + aasset;
                    else if (atype == "vhits")
                        retValue.results.vhits = S3bucket + aasset;
                    else if (atype == "vmisses")
                        retValue.results.vmisses = S3bucket + aasset;
                }
            }
            return retValue;
        }

        function scanassets(xmlDoc) {
            var records = xmlDoc.getElementsByTagName("rec");

            var roundDetailsArray = [];

            for (var i = 0; i < records.length; i++) {
                var shotRec = {};
                shotRec.id = records[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
                shotRec.round = records[i].getElementsByTagName("round")[0].childNodes[0].nodeValue;
                shotRec.shot = records[i].getElementsByTagName("shot")[0].childNodes[0].nodeValue;
                shotRec.hit = records[i].getElementsByTagName("hit")[0].childNodes[0].nodeValue;
                shotRec.asset = S3bucket + records[i].getElementsByTagName("asset")[0].childNodes[0].nodeValue;

                var roundRecArray = roundDetailsArray[shotRec.round];
                if (roundRecArray === undefined) {
                    roundRecArray = [];
                }
                roundRecArray[shotRec.shot - 1] = shotRec;
                roundDetailsArray[shotRec.round] = roundRecArray;

            }
            ;

            //console.log("round 1 ===>" + JSON.stringify(roundDetailsArray[1]));
            console.log("roundDetailsArray===>" + roundDetailsArray.length);
            return roundDetailsArray;
        }
        function GetSwingPathData(eventAssetIds) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gsp", "esid": eventAssetIds, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetSwingPathData, handleError('Error fetching Swing Path Data'));
        }
        function handleGetSwingPathData(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch Swing Path Data";
            } else {
                var records = xmlDoc.getElementsByTagName("rec");
                var recordsArray = {};
                for (var i = 0; i < records.length; i++) {
                    var dataRec = {};
                    dataRec.id = records[i].getElementsByTagName("esid")[0].childNodes[0].nodeValue;
                    var s = records[i].getElementsByTagName("s");
                    var gx = [];
                    var gy = [];
                    var tx = [];
                    var ty = [];
                    var tt = [];
                    for (var k = 0; k < s.length; k++) {
                        gx[k] = parseFloat(s[k].getElementsByTagName("gx")[0].childNodes[0].nodeValue);
                        gy[k] = parseFloat(s[k].getElementsByTagName("gy")[0].childNodes[0].nodeValue);
                        tx[k] = parseFloat(s[k].getElementsByTagName("tx")[0].childNodes[0].nodeValue);
                        ty[k] = parseFloat(s[k].getElementsByTagName("ty")[0].childNodes[0].nodeValue);
                        tt[k] = parseFloat(s[k].getElementsByTagName("t")[0].childNodes[0].nodeValue);
                    }
                    dataRec.gx = gx;
                    dataRec.gy = gy;
                    dataRec.tx = tx;
                    dataRec.ty = ty;
                    dataRec.t = tt;
                    recordsArray[dataRec.id] = dataRec;
                }
                ;

                retValue.results = recordsArray;
            }
            return retValue;
        }
        function GetSwingVelocityData(eventAssetIds) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gss", "esid": eventAssetIds, "at": $rootScope.globals.currentUser.authToken}, // Query Parameters (GET)
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetSwingVelocityData, handleError('Error fetching Swing Velocity Data'));
        }
        function handleGetSwingVelocityData(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch Swing Velocity Data";
            } else {
                var records = xmlDoc.getElementsByTagName("rec");
                var recordsArray = {};
                for (var i = 0; i < records.length; i++) {
                    var dataRec = {};
                    dataRec.x = [];
                    dataRec.g = [];
                    dataRec.t = [];
                    dataRec.id = records[i].getElementsByTagName("esid")[0].childNodes[0].nodeValue;
                    var v = records[i].getElementsByTagName("v");
                    var x = [];
                    var g = [];
                    var t = [];

                    for (var k = 0; k < v.length; k++) {
                        x[k] = parseFloat(v[k].getElementsByTagName("x")[0].childNodes[0].nodeValue);
                        g[k] = parseFloat(v[k].getElementsByTagName("g")[0].childNodes[0].nodeValue);
                        t[k] = parseFloat(v[k].getElementsByTagName("t")[0].childNodes[0].nodeValue);
                    }
                    dataRec.x = x;
                    dataRec.g = g;
                    dataRec.t = t;
                    recordsArray[dataRec.id] = dataRec;
                }
                ;

                console.log("recordsArray===>" + recordsArray.length);
                retValue.results = recordsArray;
            }
            return retValue;
        }

        function GetEventVideos(eventId) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gea2", "eid": eventId, "at": $rootScope.globals.currentUser.authToken},
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetEventVideosData, handleError('Error fetching Event Video Data'));
        }
        function handleGetEventVideosData(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch Event Video Data";
            } else {
                var records = xmlDoc.getElementsByTagName("rec");
                var recordsArray = {};
                for (var i = 0; i < records.length; i++) {
                    var dataRec = {};
                    dataRec.id = parseInt(records[i].getElementsByTagName("id")[0].childNodes[0].nodeValue);
                    dataRec.asset = records[i].getElementsByTagName("asset")[0].childNodes[0].nodeValue;
                    dataRec.type = records[i].getElementsByTagName("type")[0].childNodes[0].nodeValue;
                    recordsArray[dataRec.type] = dataRec;
                }
                ;

                console.log("recordsArray===>" + recordsArray.length);
                retValue.results = recordsArray;
            }
            return retValue;
        }

        function GetPerformanceSummaryAvg(eventId, altId) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gpsa", "eid": eventId, "altid": altId, "at": $rootScope.globals.currentUser.authToken},
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetPerformanceSummaryAvg, handleError('Error fetching Performance Summary Avg Data'));
        }
        function handleGetPerformanceSummaryAvg(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch Performance Summary Avg Data";
            } else {
                var records = xmlDoc.getElementsByTagName("rec");
                var dataRec = {};
                for (var i = 0; i < records.length; i++) {
                    dataRec.stHits = [];
                    dataRec.stShots = [];
                    dataRec.totalRnds = parseInt(records[i].getElementsByTagName("records")[0].childNodes[0].nodeValue);
                    dataRec.totalHits = parseInt(records[i].getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                    dataRec.totalShots = parseInt(records[i].getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                    var stationRec = records[i].getElementsByTagName("station");
                    for (var j = 0; j < stationRec.length; j++) {
                        var stNo = parseInt(stationRec[j].getElementsByTagName("id")[0].childNodes[0].nodeValue);
                        var hits = parseInt(stationRec[j].getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var shots = parseInt(stationRec[j].getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.stHits[stNo] = hits;
                        dataRec.stShots[stNo] = shots;
                    }
                    dataRec.angleHits = [];
                    dataRec.angleShots = [];
                    var angleArr = ["l2r", "ctr", "r2l"];
                    for (var k = 0; k < angleArr.length; k++) {
                        var angleRec = records[i].getElementsByTagName(angleArr[k])[0];
                        var angleHits = parseInt(angleRec.getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var angleShots = parseInt(angleRec.getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.angleHits[k] = angleHits;
                        dataRec.angleShots[k] = angleShots;
                    }
                    dataRec.aimHits = [];
                    dataRec.aimShots = [];
                    var aimPoints = ["aimon", "aimleft", "aimright", "aimahead", "aimbehind", "aimover", "aimunder"];
                    for (var k = 0; k < aimPoints.length; k++) {
                        var aimRec = records[i].getElementsByTagName(aimPoints[k])[0];
                        var aimHits = parseInt(aimRec.getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var aimShots = parseInt(aimRec.getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.aimHits[k] = aimHits;
                        dataRec.aimShots[k] = aimShots;
                    }
                }
                ;

                console.log("dataRec===>" + dataRec);
                retValue.results = dataRec;
            }
            return retValue;
        }

        function GetPerformanceSummary(eventId, altId) {
            return $http({
                method: 'POST',
                url: host + '/api',
                timeout: 60000,
                params: {"a": "gpsd", "eid": eventId, "altid": altId, "at": $rootScope.globals.currentUser.authToken},
                transformResponse: function (data, headersGetter, status) {
                    if (status != 401) {
                        return $.parseXML(data);
                    }
                }
            }).then(handleGetPerformanceSummary, handleError('Error fetching Performance Summary Data'));
        }
        function handleGetPerformanceSummary(response) {
            var xmlDoc = response.data;
            var x = xmlDoc.getElementsByTagName("success");
            var retValue = {};
            if (x[0].childNodes[0].nodeValue === "false") {
                retValue.success = false;
                retValue.message = "Failed to fetch Performance Summary Data";
            } else {
                var records = xmlDoc.getElementsByTagName("rec");
                var resultsArray = [];
                for (var i = 0; i < records.length; i++) {
                    var dataRec = {};
                    dataRec.stHits = [];
                    dataRec.date = Date.parse(records[i].getElementsByTagName("date")[0].childNodes[0].nodeValue.replace(' ', 'T'));
                    dataRec.title = (records[i].getElementsByTagName("title")[0].childNodes[0].nodeValue);
                    dataRec.nname = (records[i].getElementsByTagName("nname")[0].childNodes[0].nodeValue);
                    dataRec.eventId = parseInt(records[i].getElementsByTagName("eid")[0].childNodes[0].nodeValue);
                    dataRec.totalHits = parseInt(records[i].getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                    dataRec.totalShots = parseInt(records[i].getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                    var stationRec = records[i].getElementsByTagName("station");
                    for (var j = 0; j < stationRec.length; j++) {
                        var stNo = parseInt(stationRec[j].getElementsByTagName("id")[0].childNodes[0].nodeValue);
                        var hits = parseInt(stationRec[j].getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var shots = parseInt(stationRec[j].getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.stHits[stNo] = hits;
                    }
                    dataRec.angleHits = [];
                    var angleArr = ["l2r", "ctr", "r2l"];
                    for (var k = 0; k < angleArr.length; k++) {
                        var angleRec = records[i].getElementsByTagName(angleArr[k])[0];
                        var angleHits = parseInt(angleRec.getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var angleShots = parseInt(angleRec.getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.angleHits[k] = angleHits + "/" + angleShots;
                    }
                    dataRec.aimHits = [];
                    var aimPoints = ["aimon", "aimleft", "aimright", "aimahead", "aimbehind", "aimover", "aimunder"];
                    for (var k = 0; k < aimPoints.length; k++) {
                        var aimRec = records[i].getElementsByTagName(aimPoints[k])[0];
                        var aimHits = parseInt(aimRec.getElementsByTagName("hits")[0].childNodes[0].nodeValue);
                        var aimShots = parseInt(aimRec.getElementsByTagName("shots")[0].childNodes[0].nodeValue);
                        dataRec.aimHits[k] = aimHits;
                    }
                    resultsArray.push(dataRec);
                }
                ;

                console.log("resultsArray===>" + resultsArray.length);
                retValue.results = resultsArray;
            }
            return retValue;
        }


        function GetCoachSummary(teamId, fromDate, toDate, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 60000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=gpsdtd&tid=" + teamId + "&startdate=" + fromDate + "&enddate=" + toDate + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.success = true;
                retValue.teams = [];
                if (data.status.success) {
                    var resultsArray = []; 
                    //handling web service error 
                    if (data.status.rec === undefined) { 
                        //No data returned
                        retValue.success = false;
                    } else {
                    	// hack for JSON not being an array if only 1 record
                    	var nrecs = 0;
                    	if (data.status.rec != undefined && data.status.rec.length == undefined)
                    		nrecs = 1;
                    	else
                    		nrecs = data.status.rec.length;
                        for (var i = 0; i < nrecs; i++) {
                            var rec;
                            if (nrecs == 1)
                            	rec = data.status.rec;
                            else
                            	rec = data.status.rec[i];
                            
                            var dataRec = {};

                            dataRec.stHits = [];
                            dataRec.date = Date.parse(rec.date.replace(' ', 'T'));
                            dataRec.title = rec.title;
                            dataRec.nname = rec.nname;
                            dataRec.userId = rec.altid;
                            dataRec.eventId = parseInt(rec.eid);
                            dataRec.totalHits = parseInt(rec.hits);
                            dataRec.totalShots = parseInt(rec.shots);

                            var stationRec = rec.station;
                            for (var j = 0; j < stationRec.length; j++) {
                                var stNo = parseInt(stationRec[j].id);
                                var hits = parseInt(stationRec[j].hits);
                                var shots = parseInt(stationRec[j].shots);
                                dataRec.stHits[stNo] = hits;
                            }

                            dataRec.angleHits = [];
                            var angleArr = ["l2r", "ctr", "r2l"];
                            for (var k = 0; k < angleArr.length; k++) {
                                var angleRec = rec[angleArr[k]];
                                var angleHits = parseInt(angleRec.hits);
                                var angleShots = parseInt(angleRec.shots);
                                dataRec.angleHits[k] = angleHits + "/" + angleShots;
                            }
                            dataRec.aimHits = [];
                            var aimPoints = ["aimon", "aimleft", "aimright", "aimahead", "aimbehind", "aimover", "aimunder"];
                            for (var k = 0; k < aimPoints.length; k++) {
                                var aimRec = rec[aimPoints[k]];
                                var aimHits = parseInt(aimRec.hits);
                                var aimShots = parseInt(aimRec.shots);
                                dataRec.aimHits[k] = aimHits;
                            }
                            resultsArray.push(dataRec);
                        }

                        retValue.result = resultsArray;
                    }
                }
                callback(retValue);
            });

        }


        function GetCoachSummaryAvg(teamId, fromDate, toDate, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 60000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=gpsatd&tid=" + teamId + "&startdate=" + fromDate + "&enddate=" + toDate + "&at=" + $rootScope.globals.currentUser.authToken
            }).success(function (data) {
                console.log(JSON.stringify(data))
                var retValue = {};
                retValue.success = true;
                if (data.status.success) {
                    if (data.status.rec === undefined) {
                        //No data returned
                        retValue.success = false;
                    } else {
                        var rec = data.status.rec;
                        var dataRec = {};

                        dataRec.stHits = [];
                        dataRec.stShots = [];
                        dataRec.totalRnds = parseInt(rec.records);
                        dataRec.totalHits = parseInt(rec.hits);
                        dataRec.totalShots = parseInt(rec.shots);
                        var stationRec = rec.station;
                        for (var j = 0; j < stationRec.length; j++) {
                            var stNo = parseInt(stationRec[j].id);
                            var hits = parseInt(stationRec[j].hits);
                            var shots = parseInt(stationRec[j].shots);
                            dataRec.stHits[stNo] = hits;
                            dataRec.stShots[stNo] = shots;
                        }
                        dataRec.angleHits = [];
                        dataRec.angleShots = [];
                        var angleArr = ["l2r", "ctr", "r2l"];
                        for (var k = 0; k < angleArr.length; k++) {
                            var angleRec = rec[angleArr[k]];
                            var angleHits = parseInt(angleRec.hits);
                            var angleShots = parseInt(angleRec.shots);
                            dataRec.angleHits[k] = angleHits;
                            dataRec.angleShots[k] = angleShots;
                        }
                        dataRec.aimHits = [];
                        dataRec.aimShots = [];
                        var aimPoints = ["aimon", "aimleft", "aimright", "aimahead", "aimbehind", "aimover", "aimunder"];
                        for (var k = 0; k < aimPoints.length; k++) {
                            var aimRec = rec[aimPoints[k]];
                            var aimHits = parseInt(aimRec.hits);
                            var aimShots = parseInt(aimRec.shots);
                            dataRec.aimHits[k] = aimHits;
                            dataRec.aimShots[k] = aimShots;
                        }


                        retValue.result = dataRec;
                    }
                }
                callback(retValue);
            });

        }

        function handleError(error) {
            return function () {
                return {success: false, message: error};
            };
        }
        
        function DeleteEvent(evId, callback) {
            $http({
                method: 'POST',
                url: host + '/japi',
                timeout: 60000,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: "a=rme&eid=" + evId + "&at=" + $rootScope.globals.currentUser.authToken
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


    }


})();
