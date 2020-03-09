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
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@crossfoam/utils");
var d3 = require("d3");
var REGL = require("regl");
var vis_1 = require("./vis");
var NetworkVis = /** @class */ (function (_super) {
    __extends(NetworkVis, _super);
    function NetworkVis() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.visType = "network";
        _this_1.pointMode = "single";
        _this_1.time = 0;
        _this_1.frameLoop = false;
        _this_1.handleResize = utils_1.debounce(function () {
            _this_1.resize(true);
        }, 200, true);
        return _this_1;
    }
    NetworkVis.prototype.destroy = function () {
        this.destroyed = true;
        this.container.selectAll("#tooltip").remove();
        this.app.destroy(true, true);
    };
    NetworkVis.prototype.zoom = function (_this) {
        this.container.selectAll("#tooltip").remove();
        _this.canvasTransform = d3.event.transform;
        this.glAnimate();
    };
    NetworkVis.prototype.build = function (data, centralNode) {
        var _this_1 = this;
        this.paintCluster = data.cluster;
        var pointColors = [];
        var pointPositions = [];
        var pointSizes = [];
        var pointMultiColors = [];
        var pointMultiPositions = [];
        var pointMultiSizes = [];
        data.nodes.forEach(function (node) {
            var color = [85 / 255, 85 / 255, 85 / 255];
            if (node[6][_this_1.clusterId].length > 0 &&
                node[6][_this_1.clusterId][0] in _this_1.paintCluster[_this_1.clusterId].clusters) {
                var rgb = d3.color(_this_1.paintCluster[_this_1.clusterId].clusters[node[6][_this_1.clusterId]].color).rgb();
                color = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
            }
            pointColors.push(color);
            pointPositions.push([node[11] + _this_1.width / 2, node[12] + _this_1.height / 2]);
            pointSizes.push(node[10] * 4);
            var fullCount = 0;
            Object.keys(node[13][_this_1.clusterId]).forEach(function (clusterKey) {
                fullCount += node[13][_this_1.clusterId][clusterKey];
            });
            var assignLinks = function (cNode, clusterKey, size) {
                var friendColor = [85 / 255, 85 / 255, 85 / 255];
                if (clusterKey in _this_1.paintCluster[_this_1.clusterId].clusters) {
                    var rgb = d3.color(_this_1.paintCluster[_this_1.clusterId].clusters[clusterKey].color).rgb();
                    friendColor = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
                }
                pointMultiColors.push(friendColor);
                pointMultiPositions.push([cNode[11] + _this_1.width / 2, cNode[12] + _this_1.height / 2]);
                size += cNode[13][_this_1.clusterId][clusterKey];
                pointMultiSizes.push(Math.sqrt(((Math.PI * Math.pow(cNode[10] * 4, 2)) / fullCount * size) / Math.PI));
                return size;
            };
            // the assigned cluster color should be in the center
            if (node[6][_this_1.clusterId].length > 0 &&
                node[6][_this_1.clusterId][0] in _this_1.paintCluster[_this_1.clusterId].clusters) {
                var sumSize_1 = assignLinks(node, node[6][_this_1.clusterId], 0);
                Object.keys(node[13][_this_1.clusterId]).forEach(function (clusterKey) {
                    if (clusterKey !== node[6][_this_1.clusterId][0]) {
                        sumSize_1 = assignLinks(node, clusterKey, sumSize_1);
                    }
                });
            }
            else {
                // unclustered / unconnected nodes
                pointMultiColors.push([85 / 255, 85 / 255, 85 / 255]);
                pointMultiPositions.push([node[11] + _this_1.width / 2, node[12] + _this_1.height / 2]);
                pointMultiSizes.push(node[10] * 4);
            }
        });
        this.paintEdges = data.edges.filter(function (d) { return (d[3] < 2) ? true : false; });
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
            pointPositions.forEach(function (node, ni) {
                var dist = Math.sqrt(Math.pow(x - (node[0] * _this_1.canvasTransform.k + _this_1.canvasTransform.x), 2)
                    + Math.pow(y - (node[1] * _this_1.canvasTransform.k + _this_1.canvasTransform.y), 2));
                if (dist <= pointSizes[ni] / 4 * _this_1.canvasTransform.k) {
                    _this_1.tooltip(data.nodes[ni], node[0] * _this_1.canvasTransform.k + _this_1.canvasTransform.x, node[1] * _this_1.canvasTransform.k + _this_1.canvasTransform.y);
                    hit = true;
                }
            });
            if (!hit) {
                _this_1.container.selectAll("#tooltip").remove();
            }
        }).call(d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", function () { _this_1.zoom(_this_1); }));
        this.visNav = svg.append("g")
            .attr("id", "network-nav");
        [22, 17, 14, 11, 2].forEach(function (r, ri) {
            _this_1.visNav.append("circle")
                .attr("class", "network-nav-circle network-nav-circle-" + (ri + 1))
                .attr("r", r);
        });
        this.visNav.append("line")
            .attr("x1", -40);
        this.visNav.append("text")
            .attr("transform", "translate(-44, 5)")
            .attr("text-anchor", "end")
            .html(browser.i18n.getMessage("visNetworkToggleOff"));
        this.visNav.on("click", function () {
            if (_this_1.pointMode === "single") {
                _this_1.pointMode = "cluster";
                _this_1.visNav.classed("active", true);
                _this_1.visNav.select("text")
                    .html(browser.i18n.getMessage("visNetworkToggleOn"));
            }
            else {
                _this_1.pointMode = "single";
                _this_1.visNav.classed("active", false);
                _this_1.visNav.select("text")
                    .html(browser.i18n.getMessage("visNetworkToggleOff"));
            }
            _this_1.glAnimate();
        });
        this.canvasTransform = d3.zoomIdentity;
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
            // TODO: for reusability move the frag and vertex shader into their own module
            frag: "\n        // set the precision of floating point numbers\n        precision highp float;\n        // this value is populated by the vertex shader\n        varying vec3 fragColor;\n        void main() {\n          float r = 0.0, delta = 0.0;\n          vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n          r = dot(cxy, cxy);\n          if (r > 1.0) {\n              discard;\n          }\n          // gl_FragColor is a special variable that holds the color of a pixel\n          gl_FragColor = vec4(fragColor, 1);\n        }\n      ",
            primitive: "points",
            uniforms: {
                offsetX: this.regl.prop("offsetX"),
                offsetY: this.regl.prop("offsetY"),
                scale: this.regl.prop("scale"),
                stageHeight: this.regl.prop("stageHeight"),
                stageWidth: this.regl.prop("stageWidth"),
            },
            vert: "\n        // per vertex attributes\n        attribute float size;\n        attribute vec2 position;\n        attribute vec3 color;\n        // variables to send to the fragment shader\n        varying vec3 fragColor;\n        // values that are the same for all vertices\n        uniform float scale;\n        uniform float offsetX;\n        uniform float offsetY;\n        uniform float stageWidth;\n        uniform float stageHeight;\n        // helper function to transform from pixel space to normalized device coordinates (NDC)\n        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n        vec2 normalizeCoords(vec2 position) {\n          // read in the positions into x and y vars\n          float x = position[0] * scale + offsetX;\n          float y = position[1] * scale + offsetY;\n          return vec2(\n            2.0 * ((x / stageWidth) - 0.5),\n            // invert y to treat [0,0] as bottom left in pixel space\n            -(2.0 * ((y / stageHeight) - 0.5))\n          );\n        }\n        void main() {\n          // update the size of a point based on the prop pointWidth\n          gl_PointSize = size * scale;\n          // send color to the fragment shader\n          fragColor = color;\n          // scale to normalized device coordinates\n          // gl_Position is a special variable that holds the position of a vertex\n          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n        }\n      ",
        });
        this.reglDrawMultiPoint = this.regl({
            attributes: {
                color: pointMultiColors,
                position: pointMultiPositions,
                size: pointMultiSizes,
            },
            count: pointMultiColors.length,
            frag: "\n        // set the precision of floating point numbers\n        precision highp float;\n        // this value is populated by the vertex shader\n        varying vec3 fragColor;\n        void main() {\n          float r = 0.0, delta = 0.0;\n          vec2 cxy = 2.0 * gl_PointCoord - 1.0;\n          r = dot(cxy, cxy);\n          if (r > 1.0) {\n              discard;\n          }\n          // gl_FragColor is a special variable that holds the color of a pixel\n          gl_FragColor = vec4(fragColor, 1);\n        }\n      ",
            primitive: "points",
            uniforms: {
                offsetX: this.regl.prop("offsetX"),
                offsetY: this.regl.prop("offsetY"),
                scale: this.regl.prop("scale"),
                stageHeight: this.regl.prop("stageHeight"),
                stageWidth: this.regl.prop("stageWidth"),
            },
            vert: "\n        // per vertex attributes\n        attribute float size;\n        attribute vec2 position;\n        attribute vec3 color;\n        // variables to send to the fragment shader\n        varying vec3 fragColor;\n        varying float tscale;\n        // values that are the same for all vertices\n        uniform float scale;\n        uniform float offsetX;\n        uniform float offsetY;\n        uniform float stageWidth;\n        uniform float stageHeight;\n        // helper function to transform from pixel space to normalized device coordinates (NDC)\n        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n        vec2 normalizeCoords(vec2 position) {\n          // read in the positions into x and y vars\n          float x = position[0] * scale + offsetX;\n          float y = position[1] * scale + offsetY;\n          return vec2(\n            2.0 * ((x / stageWidth) - 0.5),\n            // invert y to treat [0,0] as bottom left in pixel space\n            -(2.0 * ((y / stageHeight) - 0.5))\n          );\n        }\n        void main() {\n          // update the size of a point based on the prop pointWidth\n          tscale = scale;\n          if(tscale > 2.0) {\n            tscale = 2.0;\n          }\n          gl_PointSize = size * tscale;\n          // send color to the fragment shader\n          fragColor = color;\n          // scale to normalized device coordinates\n          // gl_Position is a special variable that holds the position of a vertex\n          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n        }\n      ",
        });
        this.reglDrawLine = this.regl({
            attributes: {
                position: pointPositions,
            },
            blend: {
                color: [0, 0, 0, 0],
                enable: true,
                equation: {
                    alpha: "add",
                    rgb: "add",
                },
                func: {
                    dstAlpha: 1,
                    dstRGB: "one minus src alpha",
                    srcAlpha: 1,
                    srcRGB: "src alpha",
                },
            },
            count: this.paintEdges.length,
            depth: {
                enable: false,
            },
            elements: this.paintEdges.map(function (edge) { return [edge[0], edge[1]]; }),
            frag: "\n        precision mediump float;\n        uniform vec4 color;\n        void main() {\n          gl_FragColor = color;\n        }",
            lineWidth: 1,
            primitive: "line",
            uniforms: {
                color: [0, 0, 0, 0.5],
                offsetX: this.regl.prop("offsetX"),
                offsetY: this.regl.prop("offsetY"),
                scale: this.regl.prop("scale"),
                stageHeight: this.regl.prop("stageHeight"),
                stageWidth: this.regl.prop("stageWidth"),
            },
            vert: "\n        precision mediump float;\n        attribute vec2 position;\n        uniform float scale;\n        uniform float offsetX;\n        uniform float offsetY;\n        uniform float stageWidth;\n        uniform float stageHeight;\n        vec2 normalizeCoords(vec2 position) {\n          // read in the positions into x and y vars\n          float x = position[0] * scale + offsetX;\n          float y = position[1] * scale + offsetY;\n          return vec2(\n            2.0 * ((x / stageWidth) - 0.5),\n            // invert y to treat [0,0] as bottom left in pixel space\n            -(2.0 * ((y / stageHeight) - 0.5))\n          );\n        }\n        void main() {\n          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n        }",
        });
        this.time = 1;
        this.update(false);
    };
    NetworkVis.prototype.glAnimate = function () {
        var _this_1 = this;
        if (!this.frameLoop) {
            this.frameLoop = this.regl.frame(function () {
                _this_1.regl.clear({
                    color: [1, 1, 1, 1],
                    depth: 1,
                });
                _this_1.reglDrawLine({
                    offsetX: _this_1.canvasTransform.x,
                    offsetY: _this_1.canvasTransform.y,
                    scale: _this_1.canvasTransform.k,
                    stageHeight: _this_1.height,
                    stageWidth: _this_1.width,
                });
                if (_this_1.pointMode === "cluster") {
                    _this_1.reglDrawMultiPoint({
                        offsetX: _this_1.canvasTransform.x,
                        offsetY: _this_1.canvasTransform.y,
                        scale: _this_1.canvasTransform.k,
                        stageHeight: _this_1.height,
                        stageWidth: _this_1.width,
                    });
                }
                else {
                    _this_1.reglDraw({
                        offsetX: _this_1.canvasTransform.x,
                        offsetY: _this_1.canvasTransform.y,
                        scale: _this_1.canvasTransform.k,
                        stageHeight: _this_1.height,
                        stageWidth: _this_1.width,
                    });
                }
                _this_1.frameLoop.cancel();
                _this_1.frameLoop = false;
            });
        }
    };
    NetworkVis.prototype.update = function (data) {
        this.container.select("#overview-regl-canvas")
            .style("width", this.width + "px")
            .style("height", this.height + "px");
        this.container.select("#overview-regl-canvas canvas")
            .attr("width", this.width * 2)
            .attr("height", this.height * 2)
            .style("width", this.width + "px")
            .style("height", this.height + "px");
        this.visNav.attr("transform", "translate(" + (this.width - 50) + ", 90)");
        this.regl.poll();
        this.glAnimate();
    };
    return NetworkVis;
}(vis_1.Vis));
exports.NetworkVis = NetworkVis;
//# sourceMappingURL=network.js.map