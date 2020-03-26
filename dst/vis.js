"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cfData = require("@crossfoam/data");
var ui_helpers_1 = require("@crossfoam/ui-helpers");
var utils_1 = require("@crossfoam/utils");
var d3 = require("d3");
var Vis = /** @class */ (function () {
    function Vis() {
        var _this = this;
        this.visType = null;
        this.canvasTransform = {
            k: 1,
            x: 0,
            y: 0,
        };
        this.paintEdges = [];
        this.paintNodes = [];
        this.paintCluster = {};
        this.clusterId = 0;
        this.destroyed = false;
        this.helpData = [];
        this.showIxTooltip = true;
        this.showIxMessage = true;
        this.asyncGetIxState = function () { return __awaiter(_this, void 0, void 0, function () {
            var r;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cfData.get("ixTooltip--" + this.visType, "false")
                            .then(function (alreadyShown) {
                            if (alreadyShown === "true") {
                                _this.showIxTooltip = false;
                                d3.selectAll("#ixTooltip").remove();
                            }
                            return cfData.get("ixMessage--" + _this.visType, "false");
                        })
                            .then(function (alreadyShown) {
                            if (alreadyShown === "true") {
                                _this.showIxMessage = false;
                                d3.selectAll("#ixMessage").remove();
                            }
                            return "true";
                        })];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r];
                }
            });
        }); };
        this.container = d3.select("#visContainer");
        d3.select("#visHelp")
            .on("click", function () {
            _this.help();
        });
        this.resize(false);
    }
    Object.defineProperty(Vis.prototype, "cluster", {
        get: function () {
            return this.clusterId;
        },
        set: function (clusterId) {
            this.clusterId = clusterId;
            this.update(null);
        },
        enumerable: true,
        configurable: true
    });
    Vis.prototype.init = function () {
        // init function
    };
    Vis.prototype.build = function (data, centralNode) {
        // build function
    };
    Vis.prototype.destroy = function () {
        // destroy function
    };
    Vis.prototype.update = function (data) {
        // destroy function
    };
    Vis.prototype.tooltip = function (data, _x, _y, color, actionLinks) {
        var _this = this;
        this.container.selectAll("#tooltip").remove();
        var x = _x;
        var y = _y;
        var linkPath = {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 0,
        };
        var linkSize = 12;
        var linkPadding = 10;
        var wrapper = this.container.append("div")
            .attr("id", "tooltip")
            .on("mouseleave", function () {
            _this.container.selectAll("#tooltip").remove();
        });
        var linkImg = wrapper.append("svg")
            .style("height", (linkSize + 2) + "px")
            .style("width", (linkSize + 2) + "px");
        var contentHolder = wrapper.append("div")
            .style("border-color", color)
            .attr("id", "tooltip--contentHolder");
        var url = "https://www.twitter.com/" +
            ((Number.isInteger(parseInt(data[1], 10))) ? ("i/user/" + data[1]) : data[1]);
        contentHolder.append("span")
            .attr("class", "tooltip--skyLine")
            .html((data[4]) ? browser.i18n.getMessage("visTooltipFriendOfFriend") : browser.i18n.getMessage("visTooltipDirectFriend"));
        var link = contentHolder.append("div")
            .attr("class", "tooltip--link")
            .append("a")
            .attr("href", url);
        link.append("span").append("img")
            .on("error", function (d, i, a) {
            d3.select(a[i]).attr("src", "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png");
        })
            .attr("src", (data.length < 15) ? data[10] : data[14]);
        var name;
        if (data.length < 15) {
            name = (data[11] === null) ? browser.i18n.getMessage("nameNotAvailable") : data[11];
        }
        else {
            name = (data[15] === null) ? browser.i18n.getMessage("nameNotAvailable") : data[15];
        }
        link.append("span")
            .html(name);
        var bottomLine;
        if (data[3] !== 0 || data[2] !== 0) {
            bottomLine = browser.i18n.getMessage("friends") + ":" + ui_helpers_1.formatNumber(data[3], browser.i18n.getUILanguage()) + " |         " + browser.i18n.getMessage("followers") + ":" + ui_helpers_1.formatNumber(data[2], browser.i18n.getUILanguage()) + " | ";
        }
        bottomLine += browser.i18n.getMessage("connections") + ":" + ui_helpers_1.formatNumber(data[5], browser.i18n.getUILanguage());
        contentHolder.append("span")
            .attr("class", "tooltip--bottomLine")
            .html(bottomLine);
        if (actionLinks && actionLinks.length > 0) {
            var actionLinkP_1 = contentHolder.append("p")
                .attr("id", "tooltip--actionLinks");
            actionLinks.forEach(function (actionLink) {
                var actionLinkA = actionLinkP_1.append("a")
                    .datum(data)
                    .html(actionLink.label);
                if (actionLink.href !== undefined) {
                    actionLinkA.attr("href", actionLink.href);
                }
                else if (actionLink.callback !== undefined) {
                    actionLinkA.on("click", actionLink.callback);
                }
            });
        }
        if (x < this.width / 2) {
            wrapper
                .style("left", x - linkPadding + "px")
                .classed("rightSide", true);
            linkImg.style("left", linkPadding + "px");
            linkPath.x1 = linkSize + 2;
            linkPath.x2 = -2;
        }
        else {
            wrapper
                .style("right", (this.width - x - linkPadding) + "px")
                .classed("leftSide", true);
            linkImg.style("left", (contentHolder.node().offsetWidth + linkPadding * 2 - 2) + "px");
            linkPath.x1 = -2;
            linkPath.x2 = linkSize + 2;
        }
        if (y > this.height / 2) {
            wrapper
                .style("bottom", (this.height - y - linkPadding) + "px")
                .classed("upSide", true);
            linkImg.style("top", (contentHolder.node().offsetHeight + linkPadding * 2 - 2) + "px");
            linkPath.y1 = -2;
            linkPath.y2 = linkSize + 2;
        }
        else {
            wrapper
                .style("top", y - linkPadding + "px")
                .classed("downSide", true);
            linkImg.style("top", linkPadding + "px");
            linkPath.y1 = linkSize + 2;
            linkPath.y2 = -2;
        }
        linkImg.append("path")
            .style("stroke", color)
            .style("stroke-width", 2)
            .attr("d", "M" + linkPath.x1 + "," + linkPath.y1 + "L" + linkPath.x2 + "," + linkPath.y2);
    };
    Vis.prototype.ixTooltip = function (x, y) {
        this.container.selectAll("#ixTooltip").remove();
        this.container.append("div")
            .attr("id", "ixTooltip")
            .style("left", x + "px")
            .style("top", y + "px")
            .append("img")
            .attr("src", "../assets/images/vis--overview--interaction-pointer@2x.png");
    };
    Vis.prototype.ixTooltipHide = function () {
        d3.selectAll("#ixTooltip").remove();
        this.showIxTooltip = false;
        cfData.set("ixTooltip--" + this.visType, "true");
    };
    Vis.prototype.ixMessage = function (text) {
        var _this = this;
        this.container.selectAll("#ixMessage").remove();
        var message = this.container.append("div")
            .attr("id", "ixMessage")
            .html("<a><img src=\"../assets/images/vis--closeButton@2x.png\" /></a><br /><p>" + text + "</p>")
            .on("click", function () {
            d3.selectAll("#ixMessage").remove();
            _this.showIxMessage = false;
            cfData.set("ixMessage--" + _this.visType, "true");
        });
        var size = message.node().getBoundingClientRect();
        message.style("top", (this.height / 2 - size.height / 2) + "px");
    };
    Vis.prototype.circleLegend = function (min, max) {
        // ------ LEGEND
        var _this = this;
        var legendWidth = 500;
        var legend = this.container.append("div")
            .attr("id", "circle-legend")
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", 50);
        // --- Cluster-Colors
        var colorLegend = legend.append("g");
        var colorLegendOffset = 10;
        Object.keys(this.paintCluster[this.clusterId].clusters).forEach(function (clusterKey) {
            var clusterLegend = _this.paintCluster[_this.clusterId].clusters[clusterKey];
            var colorLegendItem = colorLegend.append("g")
                .attr("transform", "translate(" + (legendWidth - colorLegendOffset) + ", 45)");
            colorLegendItem.append("circle")
                .attr("r", 5)
                .style("stroke", "#ffffff")
                .style("fill", clusterLegend.color);
            colorLegendOffset += 22 + colorLegendItem.append("text")
                .attr("text-anchor", "end")
                .attr("dx", -8)
                .attr("dy", 4)
                .text(clusterLegend.name).node().getBBox().width;
        });
        // --- Circle-Sizes
        var circleLegend = legend.append("g")
            .attr("transform", "translate(" + legendWidth + ",21)");
        var circleLegendOffset = 5;
        circleLegendOffset += 3 + circleLegend.append("text")
            .attr("transform", "translate(-" + circleLegendOffset + ",0)")
            .attr("class", "normal")
            .attr("text-anchor", "end")
            .text(max)
            .node().getBBox().width;
        circleLegend.append("image")
            .attr("transform", "translate(-" + (circleLegendOffset + 40) + ",-13.5)")
            .attr("width", 40)
            .attr("height", 21)
            .attr("xlink:href", "../assets/images/vis--legend--overview--circle@2x.png");
        circleLegendOffset += 43;
        circleLegendOffset += 3 + circleLegend.append("text")
            .attr("transform", "translate(-" + circleLegendOffset + ",0)")
            .attr("class", "normal")
            .attr("text-anchor", "end")
            .text(min)
            .node().getBBox().width;
        circleLegend.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "translate(-" + circleLegendOffset + ",0)")
            .text(browser.i18n.getMessage("visLegendNumberOfConnections"));
    };
    Vis.prototype.help = function () {
        var _this = this;
        var helpCount = 0;
        var helpContainer = d3.select("#page").append("div")
            .attr("id", "helpContainer")
            .html("<p></p>");
        var helpButtons = helpContainer.append("div")
            .attr("id", "helpButtons");
        var closeHelp = function () {
            d3.selectAll("#helpContainer").remove();
        };
        var updateHelp = function () {
            d3.selectAll(".helpButton").style("opacity", 1);
            if (helpCount === 0) {
                d3.select("#helpButton-prev").style("opacity", 0.3);
            }
            else if (helpCount === _this.helpData.length - 1) {
                d3.select("#helpButton-next").style("opacity", 0.3);
            }
            helpContainer.select("#helpContainer p").html(_this.helpData[helpCount]);
        };
        var nextHelp = function () {
            if (helpCount < _this.helpData.length - 1) {
                helpCount += 1;
                updateHelp();
            }
        };
        var prevHelp = function () {
            if (helpCount > 0) {
                helpCount -= 1;
                updateHelp();
            }
        };
        helpButtons.append("a")
            .attr("class", "helpButton")
            .html("<span><span class=\"icon\">\n      <img src=\"../assets/images/navbar--icon-close.png\"       srcset=\"../assets/images/navbar--icon-close.png 1x,       ../assets/images/navbar--icon-close@2x.png 2x\" >\n      </span>\n      <span>" + browser.i18n.getMessage("close") + "</span></span>")
            .on("click", closeHelp);
        helpButtons.append("a")
            .attr("class", "helpButton")
            .attr("id", "helpButton-prev")
            .html("<span><span>&laquo;&nbsp;" + browser.i18n.getMessage("back") + "</span></span>")
            .on("click", prevHelp);
        helpButtons.append("a")
            .attr("class", "helpButton")
            .attr("id", "helpButton-next")
            .html("<span><span>" + browser.i18n.getMessage("next") + "&nbsp;&raquo;</span></span>")
            .on("click", nextHelp);
        updateHelp();
    };
    Vis.prototype.resize = function (update) {
        this.container.selectAll("#tooltip").remove();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.hqScale = (ui_helpers_1.isRetinaDisplay) ? 2 : 1;
        if (update) {
            this.update(null);
        }
    };
    Vis.prototype.editCluster = function (data, centralNode) {
        var _this = this;
        var modalContainer = document.createElement("div");
        var modalUUID = utils_1.uuid();
        modalContainer
            .setAttribute("class", "cf--modal-container");
        modalContainer
            .setAttribute("id", "cf--modal-container-" + modalUUID);
        modalContainer
            .innerHTML = "<div class=\"cf--modal-box\">\n      <div class=\"cf--modal-title\">" + browser.i18n.getMessage("clusterModifyTitle") + "</div>\n      <div class=\"cf--modal-message\">\n        <form>\n          <label for=\"clusterForm-name\">" + browser.i18n.getMessage("clusterModifyName") + ":</label>\n          <input type=\"text\" value=\"" + data.info.name + "\" id=\"clusterForm-name\" />\n          <input type=\"hidden\" value=\"" + data.info.color + "\" id=\"clusterForm-color\" />\n          <div id=\"colorPickerContainer\" style=\"width:300px;\"></div>\n        </form>\n      </div>\n      <div class=\"cf--modal-buttons\">\n        <button class='cf--modal-button-0' data-value='cancel'>" + browser.i18n.getMessage("cancel") + "</button>\n        <button class='cf--modal-button-1' data-value='save'>" + browser.i18n.getMessage("save") + "</button>\n      </div>\n  </div>";
        document.body.appendChild(modalContainer);
        ui_helpers_1.colorPicker("colorPickerContainer", "clusterForm-color", 370, data.info.color);
        var removeModal = function () {
            var modalContainerSelect = document.querySelector("#cf--modal-container-" + modalUUID);
            if (modalContainerSelect !== null) {
                modalContainerSelect.remove();
            }
        };
        // cancel
        document.querySelector("#cf--modal-container-" + modalUUID + " .cf--modal-button-0")
            .addEventListener("click", function () {
            removeModal();
        });
        // save changes
        document.querySelector("#cf--modal-container-" + modalUUID + " .cf--modal-button-1")
            .addEventListener("click", function (event) {
            ui_helpers_1.blockSplash("Updating Network Data");
            var name = document.querySelector("#clusterForm-name").value;
            var color = document.querySelector("#clusterForm-color").value;
            cfData.get("s--" + centralNode.service + "--a--" + centralNode.screenName + "-" + centralNode.nUuid + "--nw")
                .then(function (networkData) {
                networkData.cluster[_this.clusterId].clusters[data.id].name = name;
                networkData.cluster[_this.clusterId].clusters[data.id].color = color;
                networkData.cluster[_this.clusterId].clusters[data.id].modified = true;
                // TODO: indicator while saving happens, update dictionary afterwards...
                return cfData.set("s--" + centralNode.service + "--a--" + centralNode.screenName + "-" + centralNode.nUuid + "--nw", networkData);
            })
                .then(function () {
                browser.runtime.sendMessage({
                    date: Date.now(),
                    func: "network-updateNetworkDictionary",
                    nUuid: centralNode.nUuid,
                    params: [
                        centralNode.service,
                        centralNode.screenName,
                        centralNode.nUuid,
                    ],
                    type: "call",
                }).then(function () {
                    // we could at this point reintegrate the modified data
                    // and only update the visualisation partially, but this
                    // is likely going to run into problems, therefore, we
                    // are simply reloading the current view
                    location.reload();
                }).catch(function (err) {
                    throw err;
                });
            });
        });
    };
    Vis.prototype.hideCluster = function (data, centralNode) {
        var _this = this;
        ui_helpers_1.blockSplash("Updating Network Data");
        cfData.get("s--" + centralNode.service + "--a--" + centralNode.screenName + "-" + centralNode.nUuid + "--nw")
            .then(function (networkData) {
            var current = networkData.cluster[_this.clusterId].clusters[data.id].modified;
            networkData.cluster[_this.clusterId].clusters[data.id].modified = !current;
            return cfData.set("s--" + centralNode.service + "--a--" + centralNode.screenName + "-" + centralNode.nUuid + "--nw", networkData);
        })
            .then(function () {
            browser.runtime.sendMessage({
                date: Date.now(),
                func: "network-updateNetworkDictionary",
                nUuid: centralNode.nUuid,
                params: [
                    centralNode.service,
                    centralNode.screenName,
                    centralNode.nUuid,
                ],
                type: "call",
            }).then(function () {
                // we could at this point reintegrate the modified data
                // and only update the visualisation partially, but this
                // is likely going to run into problems, therefore, we
                // are simply reloading the current view
                location.reload();
            }).catch(function (err) {
                throw err;
            });
        });
    };
    return Vis;
}());
exports.Vis = Vis;
//# sourceMappingURL=vis.js.map