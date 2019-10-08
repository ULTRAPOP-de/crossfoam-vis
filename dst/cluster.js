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
var d3 = require("d3");
var vis_1 = require("./vis");
var ClusterVis = /** @class */ (function (_super) {
    __extends(ClusterVis, _super);
    function ClusterVis() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.visType = "cluster";
        _this.edges = [];
        _this.labels = [];
        _this.helpData = [];
        return _this;
    }
    ClusterVis.prototype.build = function (data, centralNode) {
        var _this = this;
        this.svg = this.container.append("svg");
        this.update(null);
        var maxEdge = 0;
        var maxNodeSize = 0;
        this.nodes = Object.keys(data.cluster[this.clusterId].clusters).map(function (cluster) {
            var clusterData = data.cluster[_this.clusterId].clusters[cluster];
            var nodeSize = 0;
            Object.keys(clusterData.edges).forEach(function (edgeId) {
                var edge = clusterData.edges[edgeId];
                if (edgeId === cluster) {
                    if (nodeSize > maxNodeSize) {
                        maxNodeSize = nodeSize;
                    }
                    nodeSize = edge[1];
                }
                else {
                    if (edge[1] > maxEdge) {
                        maxEdge = edge[1];
                    }
                    _this.edges.push({
                        source: cluster,
                        target: edgeId,
                        value: edge[1],
                    });
                }
            });
            return {
                color: clusterData.color,
                id: cluster,
                name: clusterData.name,
                size: nodeSize,
            };
        });
        var labels = {
            links: [],
            nodes: [],
        };
        this.nodes.forEach(function (d, i) {
            labels.nodes.push({ node: d });
            labels.nodes.push({ node: d });
            labels.links.push({
                source: i * 2,
                target: i * 2 + 1,
            });
        });
        var rScale = d3.scaleLinear().range([0, 50]).domain([0, maxNodeSize]);
        var sScale = d3.scaleLinear().range([0, 10]).domain([0, maxEdge]);
        var simulation = d3.forceSimulation(this.nodes)
            .force("charge", d3.forceManyBody())
            .force("link", d3.forceLink(this.edges).id(function (d) { return d.id; }).distance(200))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("charge", d3.forceCollide().radius(function (d) { return rScale(d.size); }));
        var labelSimulation = d3.forceSimulation(labels.nodes)
            .force("charge", d3.forceManyBody().strength(-50))
            .force("link", d3.forceLink(labels.links).distance(55).strength(2));
        this.edge = this.svg.append("g").attr("class", "links")
            .selectAll("line")
            .data(this.edges)
            .enter()
            .append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", function (d) { return sScale(d.value); });
        this.node = this.svg.append("g").attr("class", "nodes")
            .selectAll("g")
            .data(this.nodes)
            .enter()
            .append("circle")
            .attr("r", function (d) { return rScale(d.size); })
            .attr("fill", function (d) { return d.color; });
        this.label = this.svg.append("g").attr("class", "labelNodes")
            .selectAll("text")
            .data(labels.nodes)
            .enter()
            .append("text")
            .text(function (d, i) { return (i % 2 === 0) ? "" : d.node.name; })
            .style("fill", "#555")
            .style("font-family", "Arial")
            .style("font-size", 12)
            .style("pointer-events", "none");
        simulation.on("tick", function () {
            _this.edge
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });
            _this.node
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            labelSimulation.alphaTarget(0.3).restart();
            _this.label.each(function (d, i, a) {
                if (i % 2 === 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                }
                else {
                    var b = d3.select(a[i]).node().getBBox();
                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;
                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);
                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 16;
                    d3.select(a[i]).attr("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });
            _this.label.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        });
    };
    ClusterVis.prototype.fixna = function (x) {
        if (isFinite(x)) {
            return x;
        }
        else {
            return 0;
        }
    };
    ClusterVis.prototype.update = function (data) {
        this.svg
            .attr("width", this.width)
            .attr("height", this.height);
    };
    return ClusterVis;
}(vis_1.Vis));
exports.ClusterVis = ClusterVis;
//# sourceMappingURL=cluster.js.map