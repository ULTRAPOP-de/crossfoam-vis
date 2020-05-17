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
var ListVis = /** @class */ (function (_super) {
    __extends(ListVis, _super);
    function ListVis(stateManager) {
        var _this = _super.call(this, stateManager) || this;
        _this.visType = "list";
        _this.helpData = [
            browser.i18n.getMessage("helpList_1"),
            browser.i18n.getMessage("helpList_2"),
            browser.i18n.getMessage("helpList_3"),
            browser.i18n.getMessage("helpList_4"),
            browser.i18n.getMessage("helpList_5"),
        ];
        _this.asyncGetIxState();
        return _this;
    }
    ListVis.prototype.build = function (data, centralNode) {
        var _this = this;
        var clusterKeys = [];
        var clusterSort = [];
        var r = [];
        Object.keys(data.cluster[this.clusterId].clusters).forEach(function (cluster, ci) {
            clusterSort.push({
                clusters: [],
                edit: true,
                id: cluster,
                info: data.cluster[_this.clusterId].clusters[cluster],
                max: 0,
            });
            clusterKeys[cluster] = ci;
        });
        clusterSort.push({
            clusters: [],
            edit: false,
            info: { name: browser.i18n.getMessage("noCluster"), color: "#555555" },
        });
        data.nodes.forEach(function (node) {
            if (node[6][_this.clusterId][0] in clusterKeys) {
                if (clusterSort[clusterKeys[node[6][_this.clusterId][0]]].max < node[10]) {
                    clusterSort[clusterKeys[node[6][_this.clusterId][0]]].max = node[10];
                }
                clusterSort[clusterKeys[node[6][_this.clusterId][0]]].clusters.push(node);
            }
            else {
                clusterSort[clusterSort.length - 1].clusters.push(node);
            }
        });
        clusterSort.forEach(function (cluster) {
            cluster.clusters.sort(function (a, b) {
                return b[10] - a[10];
            });
            r.push(d3.scaleLinear().range([0, 12]).domain([0, cluster.max]));
        });
        this.container.selectAll("*").remove();
        // TODO: add a headline with centralNode in it...
        var legendText = browser.i18n.getMessage("visListLegend").split(";");
        this.container.append("div")
            .attr("id", "clusterList-legend")
            .html("<div>\n      <span><strong>" + legendText[0] + ":</strong></span>\n      <span>" + legendText[1] + "</span>\n      <span><img src=\"../assets/images/vis--legend--list--circle.png\"       srcset=\"../assets/images/vis--legend--list--circle.png 1x,       ../assets/images/vis--legend--list--circle@2x.png 2x\" ></span>\n      <span>" + legendText[2] + "</span>\n      <span class=\"clusterList-legend-divider\"></span>\n      <span><strong>" + legendText[3] + "</strong></span>\n      <span><img src=\"../assets/images/vis--icon--hide.png\"       srcset=\"../assets/images/vis--icon--hide.png 1x,       ../assets/images/vis--icon--hide@2x.png 2x\" ></span>\n      <span>" + legendText[4] + "</span>\n      <span><img src=\"../assets/images/vis--icon--hidden.png\"       srcset=\"../assets/images/vis--icon--hidden.png 1x,       ../assets/images/vis--icon--hidden@2x.png 2x\" ></span>\n    </div>");
        this.listContainer = this.container.append("div")
            .attr("id", "clusterList-wrapper")
            .selectAll("div.clusterList-container")
            .data(clusterSort).enter().append("div")
            .attr("class", "clusterList-container");
        var title = this.listContainer.append("div")
            .attr("class", "clusterList-title")
            .html(function (d) { return "<span><svg width=\"24\" height=\"24\">\n  <circle cx=\"12\" cy=\"12\" r=\"12\" style=\"fill:" + d.info.color + ";\" />\n</svg></span>\n<span><h2>" + d.info.name + "</h2></span>\n<span><a\n  style=\"display:" + ((d.edit) ? "inline-block" : "none") + ";\"\n  class=\"clusterList-editButton\"><img src=\"../assets/images/vis--icon--edit.png\"   srcset=\"../assets/images/vis--icon--edit.png 1x,   ../assets/images/vis--icon--edit@2x.png 2x\" ></a></span>  <span><a\n  style=\"display:" + ((d.edit) ? "inline-block" : "none") + ";\"\n  class=\"clusterList-hideButton\">  <img src=\"../assets/images/vis--icon--" + ((d.info.modified) ? "hide" : "hidden") + ".png\"   srcset=\"../assets/images/vis--icon--" + ((d.info.modified) ? "hide" : "hidden") + ".png 1x,   ../assets/images/vis--icon--" + ((d.info.modified) ? "hide" : "hidden") + "@2x.png 2x\" >  </a></span>"; });
        title.select(".clusterList-editButton")
            .on("click", function (d) {
            _this.editCluster(d, centralNode);
        });
        title.select(".clusterList-hideButton")
            .on("click", function (d) {
            _this.hideCluster(d, centralNode);
        });
        var item = this.listContainer.append("ul")
            .style("fill", function (d) { return d.info.color; })
            .selectAll("li").data(function (d) { return d.clusters; }).enter().append("li");
        item.append("span").append("svg")
            .attr("width", 24)
            .attr("height", 24)
            .style("display", function (d) { return (clusterKeys[d[6][_this.clusterId][0]] in r) ? null : "none"; })
            .append("circle")
            .attr("cx", 12)
            .attr("cy", 12)
            .attr("r", function (d) {
            if (clusterKeys[d[6][_this.clusterId][0]] in r) {
                return r[clusterKeys[d[6][_this.clusterId][0]]](d[10]);
            }
            return 0;
        });
        item.append("span").append("img")
            .on("error", function (d, i, a) {
            d3.select(a[i]).attr("src", "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png");
        })
            .attr("src", function (d) { return d[14]; });
        item.append("span")
            .attr("class", "actionContainer")
            // TODO: profile generator function in the service module
            .html(function (d) { return "<span class=\"username\">" + d[15] + "</span><br /><span class=\"actions\"><a href=\"vis.html?view=cluster&nUuid=" + _this.stateManager.urlState.nUuid + "&subView=level2&subViewId=" + d[0] + "\">" + browser.i18n.getMessage("visListUserNetwork") + "&nbsp;&raquo;</a><br /><a href=\"https://www.twitter.com/" + d[1] + "\">" + browser.i18n.getMessage("visListUserSocialProfile") + "&nbsp;&raquo;</a></span>"; });
        this.container.append("div")
            .attr("id", "clusterList-search")
            .append("input")
            .attr("id", "clusterList-search-field")
            .attr("type", "text")
            .attr("placeholder", "Search for Username")
            .on("input", function () {
            var searchWord = d3.select("#clusterList-search-field").property("value").toLowerCase();
            if (searchWord.length === 0) {
                item.style("display", null);
            }
            else {
                item.style("display", function (d) {
                    if (d[15].toLowerCase().indexOf(searchWord) >= 0) {
                        return null;
                    }
                    else {
                        return "none";
                    }
                });
            }
        });
        // TODO: // TODO: Add debouncer
        // if (this.showIxMessage) {
        //   this.ixMessage(browser.i18n.getMessage("visClusterIntro"));
        // }
    };
    return ListVis;
}(vis_1.Vis));
exports.ListVis = ListVis;
//# sourceMappingURL=list.js.map