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
var unsafe_eval_1 = require("@pixi/unsafe-eval");
var d3 = require("d3");
var PIXI = require("pixi.js");
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
            _this_1.g.attr("transform", "translate(" + _this_1.canvasTransform.x + "," + _this_1.canvasTransform.y + ")                               scale(" + _this_1.canvasTransform.k + ")");
            _this_1.glContainer.x = _this_1.canvasTransform.x;
            _this_1.glContainer.y = _this_1.canvasTransform.y;
            _this_1.glContainer.scale.set(_this_1.canvasTransform.k);
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
        unsafe_eval_1.install(PIXI);
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
        var canvas = this.container.append("canvas");
        this.update(null);
        this.app = new PIXI.Application({
            antialias: true,
            backgroundColor: 0xffffff,
            height: this.height,
            resolution: this.hqScale,
            view: canvas.node(),
            width: this.width,
        });
        var renderer = this.app.renderer;
        this.app.render();
        this.container.node().appendChild(this.app.view);
        this.glContainer = new PIXI.Container();
        this.app.stage.addChild(this.glContainer);
        this.nodeGraphic = new PIXI.Graphics();
        this.glContainer.addChild(this.nodeGraphic);
        // Default texture
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(0);
        graphics.beginFill(PIXI.utils.string2hex("#555555"), 1);
        graphics.drawCircle(50, 50, 50);
        graphics.endFill();
        this.texture = renderer.generateTexture(graphics, 1, this.hqScale);
        Object.keys(this.paintCluster[this.clusterId].clusters).forEach(function (clusterKey) {
            var color = _this_1.paintCluster[_this_1.clusterId].clusters[clusterKey].color;
            var colorGraphics = new PIXI.Graphics();
            colorGraphics.lineStyle(0);
            colorGraphics.beginFill(PIXI.utils.string2hex(color), 1);
            colorGraphics.drawCircle(50, 50, 50);
            colorGraphics.endFill();
            _this_1.colorSprites[clusterKey] = renderer.generateTexture(colorGraphics, 1, _this_1.hqScale);
        });
        this.glContainer.x = 0;
        this.glContainer.y = 0;
        canvas.call(d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", function () { _this_1.zoom(_this_1); }));
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
        this.paint();
        this.addNodes();
    };
    OverviewVis.prototype.addNodes = function () {
        var _this_1 = this;
        var limit = 100;
        if (this.paintNodeCount < this.paintNodes.length) {
            for (var i = 0; i < limit && this.paintNodeCount < this.paintNodes.length; i += 1) {
                var node = this.paintNodes[this.paintNodeCount];
                this.paintNodeCount += 1;
                var texture = this.texture;
                if (node[6][this.clusterId].length > 0 &&
                    node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
                    texture = this.colorSprites[node[6][this.clusterId][0]];
                }
                if (!this.destroyed) {
                    var sprite = new PIXI.Sprite(texture);
                    sprite.anchor.set(0.5, 0.5);
                    sprite.x = node[8] + this.width / 2;
                    sprite.y = node[9] + this.height / 2;
                    sprite.width = node[7] * 2;
                    sprite.height = node[7] * 2;
                    this.glContainer.addChild(sprite);
                }
            }
            window.requestAnimationFrame(function () { return _this_1.addNodes(); });
        }
        else if (this.glNodeCount < this.glNodes.length) {
            for (var i = 0; i < limit && this.glNodeCount < this.glNodes.length; i += 1) {
                var glNode = this.glNodes[this.glNodeCount];
                this.glNodeCount += 1;
                if (!this.destroyed) {
                    var sprite = new PIXI.Sprite(this.texture);
                    sprite.anchor.set(0.5, 0.5);
                    sprite.x = glNode[8] + this.width / 2;
                    sprite.y = glNode[9] + this.height / 2;
                    sprite.width = glNode[7] * 2;
                    sprite.height = glNode[7] * 2;
                    this.glContainer.addChild(sprite);
                }
            }
            window.requestAnimationFrame(function () { return _this_1.addNodes(); });
        }
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