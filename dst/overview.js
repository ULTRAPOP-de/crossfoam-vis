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
var ui_helpers_1 = require("@crossfoam/ui-helpers");
var utils_1 = require("@crossfoam/utils");
var d3 = require("d3");
var REGL = require("regl");
var vis_1 = require("./vis");
var OverviewVis = /** @class */ (function (_super) {
    __extends(OverviewVis, _super);
    function OverviewVis() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.visType = "overview";
        _this_1.glNodes = [];
        _this_1.clickNodes = [];
        _this_1.nodeColors = [];
        _this_1.paintNodeCount = 0;
        _this_1.glNodeCount = 0;
        _this_1.colorSprites = {};
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
        _this_1.paint = utils_1.debounce(function () {
            // Only SVG Overlay...
            // this.g.attr("transform", `translate(${this.canvasTransform.x},${this.canvasTransform.y}) \
            //                           scale(${this.canvasTransform.k})`);
            // this.glContainer.x = this.canvasTransform.x;
            // this.glContainer.y = this.canvasTransform.y;
            // this.glContainer.scale.set(this.canvasTransform.k);
        }, 200, true);
        return _this_1;
    }
    OverviewVis.prototype.destroy = function () {
        this.destroyed = true;
        this.container.selectAll("#tooltip").remove();
        this.app.destroy(true, true);
    };
    OverviewVis.prototype.zoom = function (_this) {
        this.container.selectAll("#tooltip").remove();
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
        this.glNodes = __spreadArrays(data.proxies, tempLeafs);
        this.paintNodes = data.nodes;
        this.paintCluster = data.cluster;
        this.resize(false);
        var svg = this.container.append("svg")
            .style("pointer-events", "none")
            .style("z-index", 2);
        var textRadius = d3.max(data.nodes, function (d) { return Math.sqrt(Math.pow(d[8], 2) + Math.pow(d[9], 2)); });
        var defs = svg.append("defs");
        defs.append("path")
            .attr("id", "textPath")
            .attr("d", this.circlePath(0, 0, textRadius + 8, true));
        defs.append("path")
            .attr("id", "reverseTextPath")
            .attr("d", this.circlePath(0, 0, textRadius + 14, false));
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
            .classed("centerGroup", true)
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
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
        var canvas = this.container.append("canvas").attr("id", "overview-regl-canvas");
        this.regl = REGL(document.getElementById("overview-regl-canvas"));
        var points = this.paintNodes.map(function (node) {
            var color = [85, 85, 85];
            if (node[6][_this_1.clusterId].length > 0 &&
                node[6][_this_1.clusterId][0] in _this_1.paintCluster[_this_1.clusterId].clusters) {
                color = _this_1.paintCluster[_this_1.clusterId].clusters[node[6][_this_1.clusterId]].color;
            }
            return {
                color: color,
                size: node[7] * 2,
                x: node[8] + _this_1.width / 2,
                y: node[9] + _this_1.width / 2,
            };
        });
        // this.glContainer.x = 0;
        // this.glContainer.y = 0;
        // canvas.call(d3.zoom()
        //   .scaleExtent([0.1, 8])
        //   .on("zoom", () => { this.zoom(this); }),
        // );
        canvas.on("click", function () {
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var hit = false;
            _this_1.clickNodes.forEach(function (node) {
                var dist = Math.sqrt(Math.pow((x - _this_1.canvasTransform.x) - (node[8] + _this_1.width / 2) * _this_1.canvasTransform.k, 2)
                    + Math.pow((y - _this_1.canvasTransform.y) - (node[9] + _this_1.height / 2) * _this_1.canvasTransform.k, 2));
                if (dist <= node[7] * _this_1.canvasTransform.k) {
                    _this_1.tooltip(node, node[8], node[9]);
                    hit = true;
                }
            });
            if (!hit) {
                _this_1.container.selectAll("#tooltip").remove();
            }
        });
        this.clickNodes = __spreadArrays(data.nodes, data.proxies);
        this.container.append("div")
            .attr("id", "overview-legend")
            .html("<img src=\"../assets/images/vis--overview--legend.png\"       srcset=\"../assets/images/vis--overview--legend.png 1x,       ../assets/images/vis--overview--legend@2x.png 2x\">");
        this.reglDraw = this.regl({
            attributes: {
                color: points.map(function (d) { return d.color; }),
                position: points.map(function (d) { return [d.x, d.y]; }),
                size: points.map(function (d) { return d.size; }),
            },
            count: points.length,
            frag: "\n        // set the precision of floating point numbers\n        precision highp float;\n        // this value is populated by the vertex shader\n        varying vec3 fragColor;\n        void main() {\n          // gl_FragColor is a special variable that holds the color of a pixel\n          gl_FragColor = vec4(fragColor, 1);\n        }\n      ",
            primitive: "points",
            uniforms: {
                stageHeight: this.regl.prop("stageHeight"),
                stageWidth: this.regl.prop("stageWidth"),
            },
            vert: "\n        // per vertex attributes\n        attribute float size;\n        attribute vec2 position;\n        attribute vec3 color;\n        // variables to send to the fragment shader\n        varying vec3 fragColor;\n        // values that are the same for all vertices\n        uniform float stageWidth;\n        uniform float stageHeight;\n        // helper function to transform from pixel space to normalized device coordinates (NDC)\n        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n        vec2 normalizeCoords(vec2 position) {\n          // read in the positions into x and y vars\n          float x = position[0];\n          float y = position[1];\n          return vec2(\n            2.0 * ((x / stageWidth) - 0.5),\n            // invert y since we think [0,0] is bottom left in pixel space\n            -(2.0 * ((y / stageHeight) - 0.5)));\n        }\n        void main() {\n          // update the size of a point based on the prop pointWidth\n          gl_PointSize = size;\n          // send color to the fragment shader\n          fragColor = color;\n          // scale to normalized device coordinates\n          // gl_Position is a special variable that holds the position of a vertex\n          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n        }\n      ",
        });
        var frameLoop = this.regl.frame(function () {
            _this_1.regl.clear({
                color: [0, 0, 0, 1],
                depth: 1,
            });
            _this_1.reglDraw({
                stageHeight: _this_1.height,
                stageWidth: _this_1.width,
            });
            if (frameLoop) {
                frameLoop.cancel();
            }
        });
    };
    OverviewVis.prototype.update = function (data) {
        d3.selectAll("canvas, svg")
            .attr("width", this.width * this.hqScale)
            .attr("height", this.height * this.hqScale);
        if (data) {
            // rebuild
        }
    };
    return OverviewVis;
}(vis_1.Vis));
exports.OverviewVis = OverviewVis;
//# sourceMappingURL=overview.js.map