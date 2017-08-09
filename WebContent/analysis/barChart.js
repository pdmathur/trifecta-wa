function drawVelocityChart(shotAnalysisData, plotInfo) {
    try {
        var plotData = [];
        for (var k = 0; k < shotAnalysisData.length; k++) {
            var shotIndex = shotAnalysisData[k].shotNo;

            var timeData = shotAnalysisData[k].x;
            var gunSpeedData = shotAnalysisData[k].gs;
            var targetSpeedData = shotAnalysisData[k].ts;
            if (timeData != undefined) {
                for (var i = 0; i < timeData.length; i++) {
                    for (var j = 0; j < 2; j++) {
                        var dataPoint = {};
                        if (j === 0) {
                            dataPoint.type = "GS-" + shotIndex;
                            dataPoint.x = gunSpeedData[i];
                        } else {
                            dataPoint.type = "TS-" + shotIndex;
                            dataPoint.x = targetSpeedData[i];
                        }
                        dataPoint.time = timeData[i];
                        plotData.push(dataPoint);
                    }


                }
            }
        }
        drawChart(plotData, plotInfo);
    } catch (err) {
        console.log("Exception===>" + err.message);
    }
}

function drawSwingPathChart(shotAnalysisData, plotInfo) {
    try {
        var plotData = [];
        for (var k = 0; k < shotAnalysisData.length; k++) {
            var shotIndex = shotAnalysisData[k].shotNo;
            var isHit = shotAnalysisData[k].hit;

            var gunX = shotAnalysisData[k].gx;
            var gunY = shotAnalysisData[k].gy;
            var targetX = shotAnalysisData[k].tx;
            var targetY = shotAnalysisData[k].ty;
            for (var i = 0; i < gunX.length; i++) {
            	// Pack the data as one vector with Gun and Target alternating for each shot
                for (var j = 0; j < 2; j++) {
                    var dataPoint = {};
                    if (j === 0) {
                        dataPoint.type = "GS-" + shotIndex;
                        dataPoint.x = gunX[i];
                        dataPoint.y = gunY[i];
                        //console.log("GS Shot - " + shotIndex + " : " + i + "==>" + gunX[i] + ":" + gunY[i] + "===>" + dataPoint.x + ":" + dataPoint.y);

                    } else {
                        dataPoint.type = "TS-" + shotIndex;
                        dataPoint.x = targetX[i];
                        dataPoint.y = targetY[i];
//                    console.log("TS Shot - " + shotIndex + " : " + i + "==>" + gunX[i] + ":" + gunY[i] + "===>" + dataPoint.x + ":" + dataPoint.y);

                    }
                    dataPoint.hit = isHit;
                    plotData.push(dataPoint);
                }
            }
            //break;
        }
        drawChart2(plotData, plotInfo);
    } catch (err) {
        console.log("Exception===>" + err.message);
    }
}

function drawChart2(data, plotInfo) {

    var trapWidth = 100;
    var trapHeight = 33; 

	if (data == undefined || data.length == 0) {
        return;
    }
	
	if (!String.prototype.startsWith) {
		  String.prototype.startsWith = function(searchString, position) {
		    position = position || 0;
		    return this.indexOf(searchString, position) === position;
		  };
	}
	
	// Find the range of the data for targets that were found and all gun positions
    var minX = d3.min(data, function (d) {
    	   if (d.type.startsWith("TS-") && d.x == -plotInfo.winx/2 && d.y == -plotInfo.winy)
    		   return plotInfo.winx/2;
    	   else
    		   return d.x;});
    var maxX = d3.max(data, function (d) {
 	   if (d.type.startsWith("TS-") && d.x == -plotInfo.winx/2 && d.y == -plotInfo.winy)
		   return plotInfo.winx/2;
	   else
		   return d.x;});
    var minY = d3.min(data, function (d) {
 	   if (d.type.startsWith("TS-") && d.x == -plotInfo.winx/2 && d.y == -plotInfo.winy)
		   return plotInfo.winy;
	   else
		   return d.y;});
    var maxY = d3.max(data, function (d) {
 	   if (d.type.startsWith("TS-") && d.x == -plotInfo.winx/2 && d.y == -plotInfo.winy)
		   return plotInfo.winy;
	   else
		   return d.y;});

    // Give at least one radius worth of margin around each side
    plotInfo.radius = parseInt(plotInfo.radius);
    minX -= 2*plotInfo.radius;
    maxX += 2*plotInfo.radius;
    minY -= 2*plotInfo.radius;
    //maxY += 2*plotInfo.radius; // don't need this (targets toward the top)
    maxY += trapHeight;
    
    // We need to plot these points on a 1:1 scale.
    // The range is generally rectangular, so one of the 
    // sides will dictate the scaling ratio to the parent window
    // To make this work, pad the other side min and max
    // to be wider or taller.  Then use the scaling methods
    // provided by SVG
    
    var range_x = (maxX-minX);
    var range_y = (maxY-minY);
    var win_wd = (plotInfo.WIDTH-plotInfo.M_LEFT-plotInfo.M_RIGHT);  // width of view
    var win_ht = (plotInfo.HEIGHT-plotInfo.M_TOP-plotInfo.M_BOTTOM);  // height of view
    
    // if the image is wider than it is tall compared to the view, pad the top
    // and bottom of the image.  Otherwise, pad the left and right side of the
    // image.
    if ( range_x/range_y > win_wd/win_ht )
    {
    	var new_ry = range_x / (win_wd / win_ht);
    	minY -=  (new_ry - range_y) * 0.9;  // take the padding towards the top
    	maxY +=  (new_ry - range_y) * 0.1;
    }
    else
    {
    	var new_rx = (win_wd / win_ht) * range_y;
    	minX -=  (new_rx - range_x) * 0.5;
    	maxX +=  (new_rx - range_x) * 0.5; 
    }

    // Update the range.  Now the aspect ratio of the
    // range should exactly equal the AR of the view
    // If the window has square pixels, we are good.
    range_x = (maxX-minX);
    range_y = (maxY-minY);

    var dataGroup = d3.nest()
            .key(function (d) {
                return d.type;
            })
            .sortKeys(function (a, b) {
                return a.split("-")[1] - b.split("-")[1];
            })
            .entries(data);
    console.log(JSON.stringify(dataGroup));
    
    if (dataGroup.length == 0) {
        return;
    }

    var color = d3.scale.category10();
    var colorCodes = {};
    var legend = {};

    var vis = d3.select(plotInfo.id),
            WIDTH = plotInfo.WIDTH,
            HEIGHT = plotInfo.HEIGHT,
            MARGINS = {
                top: plotInfo.M_TOP,
                right: plotInfo.M_RIGHT,
                bottom: plotInfo.M_BOTTOM,
                left: plotInfo.M_LEFT
            },
    lSpace = WIDTH / dataGroup.length;
    cleanForRedraw(vis);
    vis.style("width", WIDTH);

    console.log("width : " + WIDTH + " Height : " + HEIGHT);
    console.log("aim : " + plotInfo.x + ":" + plotInfo.y + ":" + plotInfo.radius);
    console.log("X : " + minX + ":" + maxX + " Y : " + minY + ":" + maxY);

    xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([minX, maxX]);
    yScale = d3.scale.linear().range([MARGINS.top, HEIGHT - MARGINS.bottom]).domain([minY, maxY]);
    xAxis = d3.svg.axis().scale(xScale);
    yAxis = d3.svg.axis().scale(yScale).orient("left");
    
    var lineGen = d3.svg.line()
            .x(function (d) {
                return xScale(d.x);
            })
            .y(function (d) {
                return yScale(d.y);
            })
            .interpolate("basis");

    var pointWidth = 5;
    var radius = plotInfo.radius;
    if (plotInfo.makeSmall !== undefined) { // reduce these for smaller drawings so not to get too much ink
        radius = 5;
        pointWidth = 3;
    }
    var trapHouseX = minX;
    var trapHouseY = minY;
    var trapHouseSet = 0;

    dataGroup.forEach(function (d, i) {
        var strokeColor;
        var keySplit = d.key.split("-");
        var shotNo = keySplit[1];
        console.log("Plotting " + d.key);
        
        var pts = [];
        var nn = 0;
        if (keySplit[0] == "TS") {
        	strokeColor = "red";
        	for (var tf=0; tf<d.values.length; tf++) {
              if (d.values[tf].x != -plotInfo.winx/2 && d.values[tf].y != -plotInfo.winy) {
                 pts[nn] = {};
                 pts[nn].x = d.values[tf].x;
                 pts[nn].y = d.values[tf].y;
                 if (trapHouseSet == 0) {
                    trapHouseX = pts[nn].x;
                    trapHouseY = pts[nn].y;
                    trapHouseSet = 1;
                 }
                 nn++;
              }
           }
        } else if (keySplit[0] == "GS") {
            pts = d.values;
            strokeColor = "blue";
            var idx = d.values.length - 1; // end of trajectory
            var circle = vis.append("circle")
                    .attr("cx", xScale((d.values[idx].x)))
                    .attr("cy", yScale((d.values[idx].y)))
                    .attr("r", Math.abs(yScale(d.values[idx].y) - yScale(radius + d.values[idx].y)))
                    .attr("stroke", "hsl(60, 30%, 100%)")
                    .attr('stroke-width', 2)
                    .style("stroke-dasharray", ("2, 2"));
            if (d.values[0].hit == 1) {
                circle.style("fill", "lightgreen").attr("stroke", "green");
            } else {
                circle.attr("stroke", "red").style("fill", "hsl(12, 30%, 80%)");
            }

        }

        // Draw the '+' sign at the end of the trajectory
        vis.append("line")
                .attr("x1", xScale((d.values[d.values.length - 1].x)) - pointWidth)
                .attr("y1", yScale((d.values[d.values.length - 1].y)))
                .attr("x2", xScale((d.values[d.values.length - 1].x)) + pointWidth)
                .attr("y2", yScale((d.values[d.values.length - 1].y)))
                .style("fill", strokeColor)
                .attr("stroke", strokeColor)
                .attr('stroke-width', PLOT_LINE_WIDTH);
        vis.append("line")
                .attr("x1", xScale((d.values[d.values.length - 1].x)))
                .attr("y1", yScale((d.values[d.values.length - 1].y)) - pointWidth)
                .attr("x2", xScale((d.values[d.values.length - 1].x)))
                .attr("y2", yScale((d.values[d.values.length - 1].y)) + pointWidth)
                .style("fill", strokeColor)
                .attr("stroke", strokeColor)
                .attr('stroke-width', PLOT_LINE_WIDTH);

        // draw the actual trajectory line
        vis.append('svg:path')
                .attr('d', lineGen(pts))
                .attr('stroke', function (a, b) {
                    var colorCode;
                    if (keySplit[0] == "TS")
                        colorCode = "green"; //target is green
                    else
                    	colorCode = "red";
                    return colorCode;
                })
                .attr('stroke-width', PLOT_LINE_WIDTH)
                .attr("class", "line")
                .style("stroke-dasharray", ("10, 10"))
                .attr('id', plotInfo.id.substr(1)+'line_' + i)
                .attr("stroke-linecap", "round")
                .attr('fill', 'none');
        if (legend[shotNo] == undefined && plotInfo.legend) {
            vis.append("text")
                    .attr("x", (lSpace / 2) + i * lSpace)
                    .attr("y", HEIGHT)
                    .style("fill", "#4863A0")
                    .style("cursor", "pointer")
                    .style("font-weight", "bold")
                    .attr("class", "legend")
                    .attr('id', plotInfo.id.substr(1)+'lShotNo_' + i)
                    .on('click', function () {
                        var active = d.active ? false : true;
                        var opacity = active ? 0 : 1;
                        d3.select(plotInfo.id+"line_" + i).style("opacity", opacity);
                        d3.select(plotInfo.id+"line_" + (i + 1)).style("opacity", opacity);
                        animatelines(i, plotInfo.id);
                        d.active = active;
                    })
                    .text(function () {
                        legend[shotNo] = shotNo;
                        return  shotNo;
                    });

        }
        //d3.selectAll(".line").style("opacity", "0");
        //animatelines(0);
        //animatelines(100);
    });

    vis.append("rect")
            .attr("x", xScale(trapHouseX) - trapWidth/2)
            .attr("y", yScale(trapHouseY))
            .attr("width", trapWidth)
            .attr("height", trapHeight)
            .attr('fill', 'darkolivegreen')
            .attr('fill-opacity', '0.4');
    if (plotInfo.border) {
        drawBorder(vis, WIDTH, HEIGHT);
    }
    vis.append("text")
            .attr("x", WIDTH)
            .attr("y", 20)
            .style("fill", "#4863A0")
            .style("cursor", "pointer")
            .style("font-weight", "bold")
            .attr("class", "legend")
            .on('click', function () {

            	animatelines(100, plotInfo.id);
            })
            .text("Reset");

}

function drawChart(data, plotInfo) {

    // var data = [];
    var dataGroup = d3.nest()
            .key(function (d) {
                return d.type;
            })
            .sortKeys(function (a, b) {
                return a.split("-")[1] - b.split("-")[1];
            })
            .entries(data);
    console.log(JSON.stringify(dataGroup));
    var color = d3.scale.category10();
    var colorCodes = {};
    var legend = {};
    var vis = d3.select(plotInfo.id),
            WIDTH = plotInfo.WIDTH,
            HEIGHT = plotInfo.HEIGHT,
            MARGINS = {
                top: plotInfo.M_TOP,
                right: plotInfo.M_RIGHT,
                bottom: plotInfo.M_BOTTOM,
                left: plotInfo.M_LEFT
            },
    lSpace = WIDTH / dataGroup.length;
    cleanForRedraw(vis);
    vis.style("width", WIDTH);
    console.log("width : " + WIDTH + " Height : " + HEIGHT);
    xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(data, function (d) {
            return d.time;
        }), d3.max(data, function (d) {
            return d.time;
        })]),
            yScale = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(data, function (d) {
            return d.x;
        }), d3.max(data, function (d) {
            return d.x;
        })]),
            xAxis = d3.svg.axis()
            .scale(xScale),
            yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");
    if (plotInfo.axis) {
        vis.append("svg:g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
                .call(xAxis);
        vis.append("svg:g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (MARGINS.left) + ",0)")
                .call(yAxis);
    }
    if (plotInfo.border) {
        drawBorder(vis, WIDTH, HEIGHT);
    }

    var lineGen = d3.svg.line()
            .x(function (d) {
                return xScale(d.time);
            })
            .y(function (d) {
                return yScale(d.x);
            })
            .interpolate("basis");
    dataGroup.forEach(function (d, i) {
        var shotNo = d.key.split("-")[1];

        console.log("Plotting " + d.key);
        var pts = [];
        var nn = 0;
        for (var fv=0; fv<d.values.length; fv++) {
           if (d.values[fv].x < 0)
              continue;
           else {
              pts[nn] = {};
              pts[nn].x = d.values[fv].x;
              pts[nn].time = d.values[fv].time;
              nn++;
           }
        }

        vis.append('svg:path')
                .attr('d', lineGen(pts))
                .attr('stroke', function (a, b) {
                    if (d.key.indexOf("GS") != -1) {
                        return 'red';
                    } else {
                        return 'green'
                    }
                    /*if (colorCodes[shotNo] == undefined) {
                     colorCodes[shotNo] = CSS_COLOR_NAMES[shotNo];
                     }
                     // return "hsl(" + colorCodes[shotNo] * 360 + ",100%,50%)";
                     return colorCodes[shotNo];*/
                })
                .attr('stroke-width', PLOT_LINE_WIDTH)
                .attr("class", "line")
                .attr('id', plotInfo.id.substr(1)+'line_' + i)
                .attr("stroke-linecap", "round")
                .attr('fill', 'none');
        if (legend[shotNo] == undefined && plotInfo.legend) {
            vis.append("text")
                    .attr("x", (lSpace / 2) + i * lSpace)
                    .attr("y", HEIGHT)
                    .style("fill", "#4863A0")
                    .style("cursor", "pointer")
                    .style("font-weight", "bold")
                    .attr("class", "legend")
                    .attr('id', + plotInfo.id.substr(1)+'lShotNo_' + i)
                    .on('click', function () {
                        var active = d.active ? false : true;
                        var opacity = active ? 0 : 1;
                        d3.select(plotInfo.id+"line_" + i).style("opacity", opacity);
                        d3.select(plotInfo.id+"line_" + (i + 1)).style("opacity", opacity);
                        animatelines(i, plotInfo.id);
                        d.active = active;
                    })
                    .text(function () {
                        legend[shotNo] = shotNo;
                        return shotNo;
                    });

        }
        // d3.selectAll(".line").style("opacity", "0");
        //animatelines(0);
        //animatelines(100);
    });
    vis.append("text")
            .attr("x", WIDTH)
            .attr("y", 20)
            .style("fill", "#4863A0")
            .style("cursor", "pointer")
            .style("font-weight", "bold")
            .attr("class", "legend")
            .on('click', function () {

            	animatelines(100, plotInfo.id);
            })
            .text("Reset");

}

function animatelines(whichline, id) {
    console.log("animate whichline==>" + whichline);
    // Look at what button was clicked
    if (whichline < 99) {
        var lineNo = whichline;
        // First set all the lines to be invisible
        d3.selectAll(".line").style("opacity", "0.4").style("stroke-width", PLOT_LINE_WIDTH);
        d3.selectAll(".legend").style("text-decoration","none");
        d3.select(id+"lShotNo_"+lineNo).style("text-decoration","overline");
        // Then highlight the main line to be fully visable and give it a thicker stroke
        for (var j = lineNo; j < (lineNo + 2); j++) {
            d3.select(id+"line_" + j).style("opacity", "1").style("stroke-width", 4);
            /*// First work our the total length of the line 
            var totalLength = d3.select("#line_" + j).node().getTotalLength();

            d3.selectAll("#line_" + j)
                    // Set the line pattern to be an long line followed by an equally long gap
                    .attr("stroke-dasharray", totalLength + " " + totalLength)
                    // Set the intial starting position so that only the gap is shown by offesetting by the total length of the line
                    .attr("stroke-dashoffset", totalLength)
                    // Then the following lines transition the line so that the gap is hidden...
                    .transition()
                    .duration(1000)
                    .ease("quad") //Try linear, quad, bounce... see other examples here - http://bl.ocks.org/hunzy/9929724
                    .attr("stroke-dashoffset", 0);
            */
        }



    } else if (whichline == 100) {

        d3.selectAll(".line").style("opacity", "0.5");


        //Select All of the lines and process them one by one
        d3.selectAll(".line").each(function (d, i) {

            // Get the length of each line in turn
            var totalLength = d3.select(plotInfo.id+"line_" + i).node().getTotalLength();
            d3.selectAll(id+"line_" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(1000)
                    .delay(100 * i)
                    .ease("quad") //Try linear, quad, bounce... see other examples here - http://bl.ocks.org/hunzy/9929724
                    .attr("stroke-dashoffset", 0)
                    .style("stroke-width", 3)
        })


    }


}

function drawBorder(svgCont, width, height) {
    svgCont.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', 'none')
            .attr("stroke-linecap", "round")
            .attr("stroke", "#4863A0")
            .attr("stroke-width", 2);

}
function drawMoneyShotChart(shotAnalysisData, plotInfo) {
    try {
        var plotData = [];
        for (var k = 0; k < shotAnalysisData.length; k++) {
            var timeData = shotAnalysisData[k].timeData;
            var targetX = shotAnalysisData[k].targetXpos;
            var targetY = shotAnalysisData[k].targetYpos;
            var shotIndex = shotAnalysisData[k].shotNo;
            var isHit = shotAnalysisData[k].hit;

            //var targetPos = {};
            for (var m = 0; m < 2; m++) {
                //var tt = +(Math.round(timeData[m] + "e+2") + "e-2");
                // if (tt == -0.1 || tt == 0.0) {
                var idx = (m != 0) ? timeData.length - 1 : timeData.length - 1 - 6;
                var a = {};
                a.x = parseInt(targetX[idx]);
                a.y = parseInt(targetY[idx]);
                a.shot = "S-" + shotIndex;
                a.type = ((m != 0) ? "T" : "I");
                a.hit = isHit;
                //targetPos.trigger = a;
                plotData.push(a);
                // }

            }
            //plotData.push(targetPos);

        }
        drawChart3(plotData, plotInfo);
        console.log("plotData===>" + JSON.stringify(plotData));
    } catch (err) {
        console.log("Exception===>" + err.message);
    }

}
function cleanForRedraw(vis) {
    //clearing for re-draw
    vis.selectAll("g").remove();
    vis.selectAll("path").remove();
    vis.selectAll("text").remove();
    vis.selectAll("circle").remove();
    vis.selectAll("ellipse").remove();
    vis.selectAll("line").remove();
    vis.selectAll("rect").remove();

}
function drawChart3(data, plotInfo) {

	if (data == undefined || data.length == 0) {
        return;
    }
	
	// Find the range of the data
    var minX = d3.min(data, function (d) {return d.x;});
    var maxX = d3.max(data, function (d) {return d.x;});
    var minY = d3.min(data, function (d) {return d.y;});
    var maxY = d3.max(data, function (d) {return d.y;});


    // Give at least one radius worth of margin around each side
    var marginFactor = 1.4; // > 1 
    if (plotInfo.M_RIGHT == 0 && plotInfo.M_RIGHT == 0 && plotInfo.M_RIGHT == 0 && plotInfo.M_RIGHT == 0)
    {
    	marginFactor = 1.0; // shrink to bare bones
        minX = minX - 4; // add offset padding instead
        maxX = maxX + 4;
        minY = minY - 2;
        maxY = maxY + 2;
    }
    
    plotInfo.radius = parseInt(plotInfo.radius);
    if (+plotInfo.x - marginFactor*plotInfo.radius < minX) {
        minX = plotInfo.x - marginFactor*plotInfo.radius;
    }
    if (+plotInfo.x + marginFactor*plotInfo.radius > maxX) {
        maxX = +plotInfo.x + marginFactor*parseInt(plotInfo.radius);
    }
    if (+plotInfo.y - marginFactor*plotInfo.radius < minY) {
        minY = +plotInfo.y - marginFactor*plotInfo.radius;
    }
    if (+plotInfo.y + marginFactor*plotInfo.radius > maxY) {
        maxY = +plotInfo.y + marginFactor*plotInfo.radius;
    }
    
    // We need to plot these points on a 1:1 scale.
    // The range is generally rectangular, so one of the 
    // sides will dictate the scaling ratio to the parent window
    // To make this work, pad the other side min and max
    // to be wider or taller.  Then use the scaling methods
    // provided by SVG
    
    var range_x = (maxX-minX);
    var range_y = (maxY-minY);
    var win_wd = (plotInfo.WIDTH-plotInfo.M_LEFT-plotInfo.M_RIGHT);  // width of view
    var win_ht = (plotInfo.HEIGHT-plotInfo.M_TOP-plotInfo.M_BOTTOM);  // height of view
    
    // if the image is wider than it is tall compared to the view, pad the top
    // and bottom of the image.  Otherwise, pad the left and right side of the
    // image.
    if ( range_x/range_y > win_wd/win_ht )
    {
    	var new_ry = range_x / (win_wd / win_ht);
    	minY -=  (new_ry - range_y) * 0.5;
    	maxY +=  (new_ry - range_y) * 0.5;
    }
    else
    {
    	var new_rx = (win_wd / win_ht) * range_y;
    	minX -=  (new_rx - range_x) / 2;
    	maxX +=  (new_rx - range_x) / 2;
    }

    // Update the range.  Now the aspect ratio of the
    // range should exactly equal the AR of the view
    // If the window has square pixels, we are good.
    range_x = (maxX-minX);
    range_y = (maxY-minY);
    
    // var data = [];
    var dataGroup = d3.nest()
            .key(function (d) {
                return d.shot;
            })
            .sortKeys(function (a, b) {
                return a.split("-")[1] - b.split("-")[1];
            })
            .entries(data);
    console.log(JSON.stringify(dataGroup));
    var color = d3.scale.category10();
    var colorCodes = {};
    var legend = {};
    var vis = d3.select(plotInfo.id),
            WIDTH = plotInfo.WIDTH,
            HEIGHT = plotInfo.HEIGHT,
            MARGINS = {
                top: plotInfo.M_TOP,
                right: plotInfo.M_RIGHT,
                bottom: plotInfo.M_BOTTOM,
                left: plotInfo.M_LEFT
            },
    lSpace = WIDTH / dataGroup.length;

    cleanForRedraw(vis);
    vis.style("width", WIDTH);
    console.log("width : " + WIDTH + " Height : " + HEIGHT);
    console.log("aim : " + plotInfo.x + ":" + plotInfo.y + ":" + plotInfo.radius);
    console.log("X : " + minX + ":" + maxX + " Y : " + minY + ":" + maxY);

    xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([minX, maxX]);
    yScale = d3.scale.linear().range([MARGINS.top, HEIGHT - MARGINS.bottom]).domain([minY, maxY]);
    xAxis = d3.svg.axis().scale(xScale);
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    var lineGen = d3.svg.line()
            .x(function (d) {
                console.log("X : " + d.x + "==>" + xScale(d.x));
                return xScale(d.x);
            })
            .y(function (d) {
                console.log("Y : " + d.y + "==>" + yScale(d.y));

                return yScale(d.y);
            })
            .interpolate("basis");

    // Draw a circule of radius aimradius with a 
    // plus sign inside it.
    vis.append("circle")
            .attr("cx", xScale(plotInfo.x))
            .attr("cy", yScale(plotInfo.y))
            .attr("r", Math.abs(yScale(plotInfo.y) - yScale(plotInfo.y + plotInfo.radius)))
            .style("fill", "hsl(60, 30%, 80%)")
            .attr("stroke", "hsl(60, 30%, 100%)")
            .attr('stroke-width', 2)
            .style("stroke-dasharray", ("2, 2"));

    vis.append("line")
            .attr("x1", xScale(plotInfo.x) - 10)
            .attr("y1", yScale(plotInfo.y))
            .attr("x2", xScale(plotInfo.x) + 10)
            .attr("y2", yScale(plotInfo.y))
            .style("fill", "red")
            .attr("stroke", "red")
            .attr('stroke-width', PLOT_PLUS_LINE_WIDTH);
    vis.append("line")
            .attr("x1", xScale(plotInfo.x))
            .attr("y1", yScale(plotInfo.y) - 10)
            .attr("x2", xScale(plotInfo.x))
            .attr("y2", yScale(plotInfo.y) + 10)
            .style("fill", "red")
            .attr("stroke", "red")
            .attr('stroke-width', PLOT_PLUS_LINE_WIDTH);
    
    dataGroup.forEach(function (d, i) {
        var shotNo = d.key.split("-")[1];

        console.log("Plotting " + d.key);
        vis.append('svg:path')
                .attr('d', lineGen(d.values))
                .attr('stroke', "#000000")
                .attr('stroke-width', PLOT_LINE_WIDTH)
                .attr("class", "line")
                .attr('id', plotInfo.id.substr(1)+'line_' + i)
                .attr("stroke-linecap", "round")
                .attr('fill', 'none')
                .style('opacity', 0.2);
        for (var k = 0; k < d.values.length; k++) {
            vis.append("ellipse")
                    .attr("cx", xScale(d.values[k].x))
                    .attr("cy", yScale(d.values[k].y))
                    .attr("rx", ((WIDTH - MARGINS.right - MARGINS.left) * (3) / (maxX - minX)))
                    .attr("ry", ((WIDTH - MARGINS.right - MARGINS.left) * (1) / (maxX - minX)))
                    .attr("stroke", "black")
                    .attr('stroke-width', 2)
                    .attr('id', plotInfo.id.substr(1)+'e_' + i + "_" + k)
                    ;
            var ecl = d3.select(plotInfo.id+"e_" + i + "_" + k);
            if (d.values[k].type == "T") {
                if (d.values[k].hit == 1) {
                    ecl.style("fill", "lightgreen")
                            .attr("stroke", "green");
                } else {
                    ecl.attr("stroke", "red").style("fill", "hsl(12, 30%, 80%)");
                }
            } else {
                ecl.style("stroke-dasharray", ("5, 5"))
                        .attr("stroke", "#AB9052")
                        .style("fill", "#ffffff");
                if (plotInfo.legend || plotInfo.showShotNum !== undefined) {
                    vis.append("text")
                            .attr("x", xScale(d.values[k].x) - 2)
                            .attr("y", yScale(d.values[k].y) + 2)
                            .style("fill", "black")
                            .style("font-weight", "bold")
                            .text(shotNo);
                }
            }
        }

        if (legend[shotNo] == undefined && plotInfo.legend) {
            vis.append("text")
                    .attr("x", (lSpace / 2) + i * lSpace)
                    .attr("y", HEIGHT)
                    .style("fill", "#4863A0")
                    .style("cursor", "pointer")
                    .style("font-weight", "bold")
                    .attr("class", "legend")
                    .attr('id', plotInfo.id.substr(1)+'lShotNo_' + i)
                    .on('click', function () {
                        var active = d.active ? false : true;
                        var opacity = active ? 0 : 1;
                        d3.select(plotInfo.id+"line_" + i).style("opacity", opacity);
                        animateMoneylines(i, plotInfo.id);
                        d.active = active;
                    })
                    .text(function () {
                        legend[shotNo] = shotNo;
                        return  shotNo;
                    });

        }
        //d3.selectAll(".line").style("opacity", "0");
        //animatelines(0);
        //animatelines(100);
    });
    if (plotInfo.border) {
        drawBorder(vis, WIDTH, HEIGHT);
    }
    if (plotInfo.legend) {
        vis.append("text")
                .attr("x", WIDTH)
                .attr("y", 20)
                .style("fill", "#4863A0")
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .attr("class", "legend")
                .on('click', function () {

                    animateMoneylines(100, plotInfo.id);
                })
                .text("Reset");
    }

}
function animateMoneylines(whichline, id) {
    console.log("animate whichline==>" + whichline);
    // Look at what button was clicked
    if (whichline < 99) {
        d3.selectAll(".line").style("opacity", "0.4").style("stroke-width", PLOT_LINE_WIDTH);
        d3.selectAll(".legend").style("text-decoration","none");;
        d3.select(id+"line_" + whichline).style("opacity", "1").style("stroke-width", 2);
        d3.selectAll(".legend").style("text-decoration","none");
        d3.select(id+"lShotNo_"+whichline).style("text-decoration","overline");

        var totalLength = d3.select(id+"line_" + whichline).node().getTotalLength();

        d3.selectAll(id+"line_" + whichline)
                // Set the line pattern to be an long line followed by an equally long gap
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                // Set the intial starting position so that only the gap is shown by offesetting by the total length of the line
                .attr("stroke-dashoffset", totalLength)
                // Then the following lines transition the line so that the gap is hidden...
                .transition()
                .duration(1000)
                .ease("quad") //Try linear, quad, bounce... see other examples here - http://bl.ocks.org/hunzy/9929724
                .attr("stroke-dashoffset", 0);

    } else if (whichline == 100) {

        d3.selectAll(".line").style("opacity", "0.5");
        //Select All of the lines and process them one by one
        d3.selectAll(".line").each(function (d, i) {
            // Get the length of each line in turn
            var totalLength = d3.select(plotInfo.id+"line_" + i).node().getTotalLength();
            d3.selectAll(id+"line_" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(1000)
                    .delay(100 * i)
                    .ease("quad") //Try linear, quad, bounce... see other examples here - http://bl.ocks.org/hunzy/9929724
                    .attr("stroke-dashoffset", 0)
                    .style("stroke-width", 1)
        })


    }


}


var CSS_COLOR_NAMES = ["AliceBlue", "Blue", "Red", "Green", "Yellow", "Brown",
    "Chocolate", "Coral", "CornflowerBlue", "DarkKhaki",
    "Aqua", "Aquamarine", "Azure", "AntiqueWhite", "Beige", "Bisque", "Black",
    "BlanchedAlmond", "RoyalBlue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue",
    "Chartreuse", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RosyBrown", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"];
