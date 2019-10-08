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
var unsafe_eval_1 = require("@pixi/unsafe-eval");
var crossfoam_dev_utils_1 = require("crossfoam-dev-utils");
var d3 = require("d3");
var PIXI = require("pixi.js");
var vis_1 = require("./vis");
var NetworkVis = /** @class */ (function (_super) {
    __extends(NetworkVis, _super);
    function NetworkVis() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.visType = "network";
        _this_1.paintNodeCount = 0;
        _this_1.clickNodes = [];
        _this_1.paintEdgeCount = 0;
        _this_1.colorSprites = {};
        _this_1.paint = crossfoam_dev_utils_1.debounce(function () {
            _this_1.glContainerLines.x = _this_1.glContainerArcs.x = _this_1.glContainer.x = _this_1.canvasTransform.x;
            _this_1.glContainerLines.y = _this_1.glContainerArcs.y = _this_1.glContainer.y = _this_1.canvasTransform.y;
            _this_1.glContainer.scale.set(_this_1.canvasTransform.k);
            _this_1.glContainerArcs.scale.set(_this_1.canvasTransform.k);
            _this_1.glContainerLines.scale.set(_this_1.canvasTransform.k);
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
        _this.paint();
    };
    NetworkVis.prototype.build = function (data, centralNode) {
        var _this_1 = this;
        unsafe_eval_1.install(PIXI);
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
        this.glContainerLines = new PIXI.Container();
        this.app.stage.addChild(this.glContainerLines);
        this.glContainerLines.x = 0;
        this.glContainerLines.y = 0;
        this.glContainer = new PIXI.Container();
        this.app.stage.addChild(this.glContainer);
        this.glContainer.x = 0;
        this.glContainer.y = 0;
        this.glContainerArcs = new PIXI.Container();
        this.app.stage.addChild(this.glContainerArcs);
        this.glContainerArcs.x = 0;
        this.glContainerArcs.y = 0;
        this.edgeGraphic = new PIXI.Graphics();
        this.edgeGraphic.lineStyle(1, PIXI.utils.string2hex("#000000"), 0.3);
        this.glContainerLines.addChild(this.edgeGraphic);
        this.arcGraphic = new PIXI.Graphics();
        this.glContainerArcs.addChild(this.arcGraphic);
        this.clickNodes = this.paintNodes = data.nodes;
        this.paintCluster = data.cluster;
        this.paintEdges = data.edges.filter(function (d) { return (d[3] < 2) ? true : false; });
        // Default texture
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(2, PIXI.utils.string2hex("#ffffff"), 1);
        graphics.beginFill(PIXI.utils.string2hex("#555555"), 1);
        graphics.drawCircle(50, 50, 50);
        graphics.endFill();
        this.texture = renderer.generateTexture(graphics, 1, this.hqScale);
        Object.keys(this.paintCluster[this.clusterId].clusters).forEach(function (clusterKey) {
            var color = _this_1.paintCluster[_this_1.clusterId].clusters[clusterKey].color;
            var colorGraphics = new PIXI.Graphics();
            colorGraphics.lineStyle(2, PIXI.utils.string2hex("#ffffff"), 1);
            colorGraphics.beginFill(PIXI.utils.string2hex(color), 1);
            colorGraphics.drawCircle(50, 50, 50);
            colorGraphics.endFill();
            _this_1.colorSprites[clusterKey] = renderer.generateTexture(colorGraphics, 1, _this_1.hqScale);
        });
        canvas.call(d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", function () { _this_1.zoom(_this_1); }));
        canvas.on("click", function () {
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var hit = false;
            _this_1.clickNodes.forEach(function (node) {
                var dist = Math.sqrt(Math.pow((x - _this_1.canvasTransform.x) - (node[11] + _this_1.width / 2) * _this_1.canvasTransform.k, 2)
                    + Math.pow((y - _this_1.canvasTransform.y) - (node[12] + _this_1.height / 2) * _this_1.canvasTransform.k, 2));
                if (dist <= node[10] * _this_1.canvasTransform.k) {
                    _this_1.tooltip(node, node[11], node[12]);
                    hit = true;
                }
            });
            if (!hit) {
                _this_1.container.selectAll("#tooltip").remove();
            }
        });
        this.paint();
        this.addNodes();
    };
    NetworkVis.prototype.addNodes = function () {
        var _this_1 = this;
        var limit = 100;
        if (this.paintNodeCount < this.paintNodes.length) {
            var _loop_1 = function (i) {
                var node = this_1.paintNodes[this_1.paintNodeCount];
                this_1.paintNodeCount += 1;
                var texture = this_1.texture;
                if (node[6][this_1.clusterId].length > 0 &&
                    node[6][this_1.clusterId][0] in this_1.paintCluster[this_1.clusterId].clusters) {
                    texture = this_1.colorSprites[node[6][this_1.clusterId][0]];
                }
                if (!this_1.destroyed) {
                    var sprite = new PIXI.Sprite(texture);
                    sprite.anchor.set(0.5, 0.5);
                    sprite.x = node[11] + this_1.width / 2;
                    sprite.y = node[12] + this_1.height / 2;
                    sprite.width = node[10] * 2;
                    sprite.height = node[10] * 2;
                    this_1.glContainer.addChild(sprite);
                    // ---- paint friend arcs
                    var arc_1 = new PIXI.Graphics();
                    var startAngle_1 = 0;
                    var fullCount_1 = 0;
                    Object.keys(node[13][this_1.clusterId]).forEach(function (clusterKey) {
                        fullCount_1 += node[13][_this_1.clusterId][clusterKey];
                    });
                    Object.keys(node[13][this_1.clusterId]).forEach(function (clusterKey) {
                        var angle = (2 * Math.PI / fullCount_1) * node[13][_this_1.clusterId][clusterKey];
                        var friendColor = "#555555";
                        if (clusterKey in _this_1.paintCluster[_this_1.clusterId].clusters) {
                            friendColor = _this_1.paintCluster[_this_1.clusterId].clusters[clusterKey].color;
                        }
                        arc_1.lineStyle(1, PIXI.utils.string2hex("#ffffff"), 1);
                        arc_1.beginFill(PIXI.utils.string2hex(friendColor));
                        arc_1.arc(0, 0, node[10] + 5, startAngle_1, startAngle_1 + angle);
                        arc_1.arc(0, 0, node[10] + 1, startAngle_1 + angle, startAngle_1, true);
                        arc_1.endFill();
                        startAngle_1 += angle;
                    });
                    arc_1.position.set(node[11] + this_1.width / 2, node[12] + this_1.height / 2);
                    this_1.glContainerArcs.addChild(arc_1);
                }
            };
            var this_1 = this;
            for (var i = 0; i < limit && this.paintNodeCount < this.paintNodes.length; i += 1) {
                _loop_1(i);
            }
            window.requestAnimationFrame(function () { return _this_1.addNodes(); });
        }
        else if (this.paintEdgeCount < this.paintEdges.length) {
            // paint edges
            for (var i = 0; i < limit && this.paintEdgeCount < this.paintEdges.length; i += 1) {
                var edge = this.paintEdges[this.paintEdgeCount];
                this.paintEdgeCount += 1;
                this.edgeGraphic.moveTo((this.paintNodes[edge[0]][11] + this.width / 2), (this.paintNodes[edge[0]][12] + this.height / 2));
                this.edgeGraphic.lineTo((this.paintNodes[edge[1]][11] + this.width / 2), (this.paintNodes[edge[1]][12] + this.height / 2));
            }
            window.requestAnimationFrame(function () { return _this_1.addNodes(); });
        }
    };
    NetworkVis.prototype.update = function (data) {
        d3.select(".centerGroup")
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
        d3.selectAll("canvas")
            .attr("width", this.width * this.hqScale)
            .attr("height", this.height * this.hqScale);
        if (data) {
            // rebuild
        }
    };
    return NetworkVis;
}(vis_1.Vis));
exports.NetworkVis = NetworkVis;
//# sourceMappingURL=network.js.map