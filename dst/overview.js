"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewVis = void 0;
var ui_helpers_1 = require("@crossfoam/ui-helpers");
var utils_1 = require("@crossfoam/utils");
var d3 = require("d3");
var REGL = require("regl");
var vis_1 = require("./vis");
var OverviewVis = /** @class */ (function (_super) {
    __extends(OverviewVis, _super);
    function OverviewVis(stateManager) {
        var _this_1 = _super.call(this, stateManager) || this;
        _this_1.visType = "overview";
        _this_1.glNodes = [];
        _this_1.clickNodes = [];
        _this_1.time = 1;
        _this_1.scaleTarget = 1;
        _this_1.currentScale = 0;
        _this_1.lineTarget = 0;
        _this_1.frameLoop = false;
        _this_1.helpData = [
            browser.i18n.getMessage("helpOverview_1"),
            browser.i18n.getMessage("helpOverview_2"),
            browser.i18n.getMessage("helpOverview_3"),
            browser.i18n.getMessage("helpOverview_4"),
            browser.i18n.getMessage("helpOverview_5"),
            browser.i18n.getMessage("helpOverview_6"),
            browser.i18n.getMessage("helpOverview_7"),
            browser.i18n.getMessage("helpOverview_8"),
        ];
        _this_1.handleResize = utils_1.debounce(function () {
            _this_1.resize(true);
        }, 200, true);
        _this_1.asyncGetIxState();
        return _this_1;
    }
    OverviewVis.prototype.destroyTooltip = function () {
        var tooltip = this.container.selectAll("#tooltip");
        if (tooltip.size() > 0) {
            tooltip.remove();
        }
    };
    OverviewVis.prototype.destroy = function () {
        this.destroyed = true;
        this.destroyTooltip();
    };
    OverviewVis.prototype.zoom = function (_this) {
        this.destroyTooltip();
        _this.canvasTransform = d3.event.transform;
        _this.paint();
    };
    OverviewVis.prototype.circlePath = function (x, y, r, direction) {
        return "M" + x + "," + y + "      m" + -r + ", 0      a" + r + "," + r + " 0 " + ((direction) ? "0" : "1") + "," + ((direction) ? "1" : "0") + " " + r * 2 + ",0      a" + r + "," + r + " 0 " + ((direction) ? "0" : "1") + "," + ((direction) ? "1" : "0") + " " + -r * 2 + ",0Z";
    };
    OverviewVis.prototype.build = function (data, centralNode) {
        var _this_1 = this;
        var tempLeafs = data.leafs.map(function (d) {
            return [
                null,
                null,
                null,
                null,
                null,
                null,
                [[], []],
                d[0],
                d[1],
                d[2],
            ];
        });
        this.paintNodes = __spreadArrays(data.nodes, data.proxies, tempLeafs);
        this.clickNodes = __spreadArrays(data.nodes, data.proxies);
        this.paintCluster = data.cluster;
        this.resize(false);
        d3.select(window).on("resize", function () {
            _this_1.handleResize();
        });
        // canvas
        var canvas = this.container.append("div")
            .style("width", this.width + "px")
            .style("height", this.height + "px")
            .attr("id", "overview-regl-canvas");
        var svg = this.container.append("svg")
            .attr("id", "overview-svg")
            .style("z-index", 2)
            .on("click", function () {
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var hit = false;
            _this_1.clickNodes.forEach(function (node) {
                var dist = Math.sqrt(Math.pow(x - (node[8] * _this_1.scaleTarget + _this_1.width / 2), 2)
                    + Math.pow(y - (node[9] * _this_1.scaleTarget + _this_1.height / 2), 2));
                if (dist <= node[7] * _this_1.scaleTarget) {
                    var color = "#555555";
                    var params = [];
                    if (node[6][_this_1.clusterId].length > 0 &&
                        node[6][_this_1.clusterId][0] in _this_1.paintCluster[_this_1.clusterId].clusters) {
                        var rgb = d3.color(_this_1.paintCluster[_this_1.clusterId].clusters[node[6][_this_1.clusterId]].color).rgb();
                        color = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
                        params = [{
                                callback: function (d) {
                                    window.location.href = "vis.html?view=cluster&nUuid=" + _this_1.stateManager.urlState.nUuid + "&subView=level2&subViewId=" + d[0];
                                },
                                label: "Show connections to this user &raquo;",
                            }];
                    }
                    _this_1.tooltip(node, node[8] * _this_1.scaleTarget + _this_1.width / 2, node[9] * _this_1.scaleTarget + _this_1.height / 2, color, params);
                    hit = true;
                }
            });
            if (!hit) {
                _this_1.container.selectAll("#tooltip").remove();
            }
        });
        var textRadius = d3.max(data.nodes, function (d) { return Math.sqrt(Math.pow(d[8], 2) + Math.pow(d[9], 2)); });
        var defs = svg.append("defs");
        defs.append("path")
            .attr("id", "textPath")
            .attr("d", this.circlePath(0, 0, textRadius + 8, true));
        defs.append("path")
            .attr("id", "reverseTextPath")
            .attr("d", this.circlePath(0, 0, textRadius + 17, false));
        var imageSize = 48;
        defs.append("clipPath")
            .attr("id", "userClip")
            .append("circle")
            .attr("cx", imageSize / 2)
            .attr("cy", imageSize / 2)
            .attr("r", (imageSize - 4) / 2)
            .style("fill", "black");
        this.g = svg.append("g");
        this.svg = this.g.append("g")
            .classed("centerGroup", true);
        this.svg.append("text")
            .append("textPath")
            .attr("startOffset", "25%")
            .attr("xlink:href", "#textPath")
            .style("font-family", "Helvetica, Arial, sans-serif")
            .style("font-size", "12px")
            .style("text-anchor", "middle")
            .html("&darr;&nbsp;" + ui_helpers_1.formatNumber(data.nodes.length, browser.i18n.getUILanguage()) + " " + browser.i18n.getMessage("friends"));
        this.svg.append("text")
            .append("textPath")
            .attr("startOffset", "25%")
            .attr("xlink:href", "#reverseTextPath")
            .style("font-family", "Helvetica, Arial, sans-serif")
            .style("font-size", "12px")
            .style("text-anchor", "middle")
            .html("&darr;&nbsp;" + ui_helpers_1.formatNumber(data.proxies.length, browser.i18n.getUILanguage()) + " " + browser.i18n.getMessage("sharedFiendsOfFriends"));
        this.svg.append("image")
            .attr("transform", "translate(-" + imageSize / 2 + ", -" + imageSize / 2 + ")")
            .attr("xlink:href", centralNode.image)
            .style("width", imageSize)
            .style("height", imageSize)
            .attr("clip-path", "url(#userClip)");
        this.svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", imageSize / 2 + 2)
            .style("fill", "transparent")
            .style("stroke", "rgba(0,0,0,0.2)");
        var pointColors = [];
        var pointPositions = [];
        var pointSizes = [];
        var pointSizeMin = Number.MAX_VALUE;
        var pointSizeMax = 0;
        this.paintNodes.forEach(function (node) {
            var color = [85 / 255, 85 / 255, 85 / 255];
            if (node[6][_this_1.clusterId].length > 0 &&
                node[6][_this_1.clusterId][0] in _this_1.paintCluster[_this_1.clusterId].clusters) {
                var rgb = d3.color(_this_1.paintCluster[_this_1.clusterId].clusters[node[6][_this_1.clusterId]].color).rgb();
                color = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
            }
            pointColors.push(color);
            pointPositions.push([node[8], node[9]]);
            pointSizes.push(node[7] * 4);
            if (node[5] > pointSizeMax) {
                pointSizeMax = node[5];
            }
            if (node[5] < pointSizeMin) {
                pointSizeMin = node[5];
            }
        });
        // ------ VIS NAVIGATION
        var navigation = this.container.append("div")
            .attr("id", "overview-navigation")
            .append("svg");
        this.navData = [
            [data.nodes.length, "<strong>" + browser.i18n.getMessage("friends") + "</strong> " + ui_helpers_1.formatNumber(data.nodes.length, browser.i18n.getUILanguage())],
            [data.proxies.length, "<strong>" + browser.i18n.getMessage("sharedFiendsOfFriends") + "</strong> " + ui_helpers_1.formatNumber(data.proxies.length, browser.i18n.getUILanguage())],
            [tempLeafs.length, "<strong>" + browser.i18n.getMessage("otherFriends") + "</strong> " + ui_helpers_1.formatNumber(tempLeafs.length, browser.i18n.getUILanguage())],
        ];
        this.navLine = navigation.append("line")
            .attr("transform", "translate(110, 0)")
            .attr("y1", this.navData[0][2])
            .style("stroke-width", 5)
            .style("stroke", "white");
        this.navPoints = navigation.append("g").selectAll("g").data(this.navData).enter().append("g")
            .attr("class", "overview-navigation-buttons");
        var navScale = d3.scaleLinear().range([10, 35]).domain(d3.extent(this.navData, function (d) { return d[0]; }));
        this.navData.forEach(function (nd, ni) {
            nd.push(navScale(nd[0]));
            var offset = 0;
            while (ni > 0) {
                ni -= 1;
                offset += _this_1.navData[ni][2] * 2;
            }
            nd.push(offset);
        });
        this.navPoints.append("circle")
            .attr("r", function (d) { return navScale(d[0]) + 5; })
            .style("fill", "white");
        this.navPoints.append("circle")
            .attr("r", function (d) { return navScale(d[0]); })
            .style("fill", "rgba(0,0,0,0.2)");
        this.navPoints.append("circle")
            .attr("r", function (d, i) {
            if (i === 0) {
                return 0;
            }
            else {
                return navScale(_this_1.navData[i - 1][0]);
            }
        })
            .style("fill", "white");
        this.navPoints.append("line")
            .attr("x2", -14);
        this.navPoints.append("circle")
            .attr("class", "overview-navigation-indicator")
            .attr("r", 5);
        this.navPoints.append("foreignObject")
            .attr("width", "90")
            .attr("height", "45")
            .attr("transform", "translate(-108, -17)")
            .html(function (d) { return "<p>" + d[1] + "</p>"; });
        this.navActiveLine = navigation.append("line")
            .style("pointer-events", "none")
            .attr("transform", "translate(110, 15)")
            .style("stroke-width", 1)
            .style("stroke", "338498");
        var getDist = function (n) { return Math.sqrt(Math.pow(n[8], 2) + Math.pow(n[9], 2)); };
        this.navData[0].push(data.nodes.map(function (n) { return getDist(n); }).sort(function (a, b) { return b - a; })[0]);
        this.navData[1].push(getDist(data.proxies[data.proxies.length - 1]));
        this.navData[2].push(getDist(tempLeafs[tempLeafs.length - 1]));
        this.navPoints.on("click", function (d, i) {
            _this_1.container.selectAll("#tooltip").remove();
            _this_1.currentScale = i;
            _this_1.interpolation = d3.interpolate(_this_1.scaleTarget, d[5]);
            _this_1.lineInterpolation = d3.interpolate(_this_1.lineTarget, _this_1.navDist * i + d[3] + d[2] - 5);
            _this_1.time = 0;
            _this_1.update(false);
            _this_1.ixTooltipHide();
        });
        this.circleLegend(pointSizeMin, pointSizeMax);
        // ------ WebGL Object Initialization (REGL)
        this.regl = REGL(document.getElementById("overview-regl-canvas"));
        window.onbeforeunload = function () {
            _this_1.regl.destroy();
        };
        this.reglDraw = this.regl({
            attributes: {
                color: pointColors,
                position: pointPositions,
                size: pointSizes,
            },
            count: pointColors.length,
            frag: "\n        // set the precision of floating point numbers\n        precision highp float;\n        // this value is populated by the vertex shader\n        varying vec3 fragColor;\n        void main() {\n          float r = 0.0, delta = 0.0;\n          vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n          r = dot(cxy, cxy);\n          if (r > 1.0) {\n              discard;\n          }\n          // gl_FragColor is a special variable that holds the color of a pixel\n          gl_FragColor = vec4(fragColor, 1);\n        }\n      ",
            primitive: "points",
            uniforms: {
                scale: this.regl.prop("scale"),
                stageHeight: this.regl.prop("stageHeight"),
                stageWidth: this.regl.prop("stageWidth"),
            },
            vert: "\n        // per vertex attributes\n        attribute float size;\n        attribute vec2 position;\n        attribute vec3 color;\n        // variables to send to the fragment shader\n        varying vec3 fragColor;\n        // values that are the same for all vertices\n        uniform float scale;\n        uniform float stageWidth;\n        uniform float stageHeight;\n        // helper function to transform from pixel space to normalized device coordinates (NDC)\n        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n        vec2 normalizeCoords(vec2 position) {\n          // read in the positions into x and y vars\n          float x = position[0] * scale + stageWidth / 2.0;\n          float y = position[1] * scale + stageHeight / 2.0;\n          return vec2(\n            2.0 * ((x / stageWidth) - 0.5),\n            // invert y to treat [0,0] as bottom left in pixel space\n            -(2.0 * ((y / stageHeight) - 0.5))\n          );\n        }\n        void main() {\n          // update the size of a point based on the prop pointWidth\n          gl_PointSize = size * scale;\n          // send color to the fragment shader\n          fragColor = color;\n          // scale to normalized device coordinates\n          // gl_Position is a special variable that holds the position of a vertex\n          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n        }\n      ",
        });
        this.time = 1;
        this.update(false);
    };
    OverviewVis.prototype.glAnimate = function () {
        var _this_1 = this;
        if (!this.frameLoop) {
            this.frameLoop = this.regl.frame(function () {
                _this_1.regl.clear({
                    color: [255, 255, 255, 1],
                    depth: 1,
                });
                var scale = _this_1.scaleTarget;
                var lineY = _this_1.lineTarget;
                if (_this_1.time < 1) {
                    lineY = _this_1.lineInterpolation(d3.easeCubic(_this_1.time));
                    _this_1.lineTarget = lineY;
                    scale = _this_1.interpolation(d3.easeCubic(_this_1.time));
                    _this_1.scaleTarget = scale;
                }
                _this_1.navActiveLine.attr("y2", lineY);
                _this_1.navPoints.classed("active", function (d, i) {
                    if (lineY >= _this_1.navDist * i + d[3]) {
                        return true;
                    }
                    return false;
                });
                _this_1.svg.attr("transform", "translate(" + _this_1.width / 2 + "," + _this_1.height / 2 + ") scale(" + _this_1.scaleTarget + ")");
                _this_1.reglDraw({
                    scale: scale,
                    stageHeight: _this_1.height,
                    stageWidth: _this_1.width,
                });
                if (_this_1.frameLoop && _this_1.time >= 1) {
                    _this_1.frameLoop.cancel();
                    _this_1.frameLoop = false;
                }
                else {
                    _this_1.time += 0.01;
                }
            });
        }
    };
    OverviewVis.prototype.update = function (data) {
        var _this_1 = this;
        this.navDist = (this.height * 0.5 - 10 - this.navData.reduce(function (a, b) { return a + b[2] * 2; }, 0)) / 2;
        this.navPoints.attr("transform", function (d, i) { return "translate(110, " + (_this_1.navDist * i + d[3] + d[2] + 5) + ")"; });
        if (this.showIxTooltip) {
            this.ixTooltip(this.width - 50, this.height / 2 + this.navDist * 1.5);
        }
        if (this.showIxMessage) {
            this.ixMessage(browser.i18n.getMessage("visOverviewIntro"));
        }
        this.navLine.attr("y2", this.navDist * 2 +
            this.navData[this.navData.length - 1][3] +
            this.navData[this.navData.length - 1][2]);
        this.svg.attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ") scale(" + this.scaleTarget + ")");
        this.container.select("#overview-regl-canvas")
            .style("width", this.width + "px")
            .style("height", this.height + "px");
        this.container.select("#overview-regl-canvas canvas")
            .attr("width", this.width * 2)
            .attr("height", this.height * 2)
            .style("width", this.width + "px")
            .style("height", this.height + "px");
        this.navData.forEach(function (n) {
            var scaleX = (_this_1.width / 2) / (n[4] + 50);
            var scaleY = (_this_1.height / 2) / (n[4] + 50);
            var scale = 1;
            if (scaleX < scaleY && scaleX < 1) {
                scale = scaleX;
            }
            else if (scaleY < 1) {
                scale = scaleY;
            }
            n[5] = scale;
        });
        this.regl.poll();
        this.glAnimate();
    };
    return OverviewVis;
}(vis_1.Vis));
exports.OverviewVis = OverviewVis;
//# sourceMappingURL=overview.js.map