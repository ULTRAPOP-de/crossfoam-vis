"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cfData = require("crossfoam-dev-data");
var crossfoam_dev_ui_helpers_1 = require("crossfoam-dev-ui-helpers");
var crossfoam_dev_utils_1 = require("crossfoam-dev-utils");
var d3 = require("d3");
var Vis = /** @class */ (function () {
    function Vis() {
        var _this = this;
        this.visType = null;
        this.app = null;
        this.glContainer = null;
        this.glContainerArcs = null;
        this.glContainerLines = null;
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
        this.container = d3.select("#visContainer");
        d3.select("#visHelp")
            .on("click", function () {
            // if (this.app || ("app" in this)) {
            //   let image = this.app.renderer.plugins.extract.image(this.glContainer);
            //   document.body.appendChild(image);
            //   if (this.glContainerArcs !== null) {
            //     image = this.app.renderer.plugins.extract.image(this.glContainerArcs);
            //     document.body.appendChild(image);
            //     image = this.app.renderer.plugins.extract.image(this.glContainerLines);
            //     document.body.appendChild(image);
            //   }
            // }
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
    Vis.prototype.tooltip = function (data, _x, _y) {
        this.container.selectAll("#tooltip").remove();
        var x = (this.width / 2 + _x) * this.canvasTransform.k + this.canvasTransform.x;
        var y = (this.height / 2 + _y) * this.canvasTransform.k + this.canvasTransform.y;
        var wrapper = this.container.append("div")
            .attr("id", "tooltip")
            .style("top", y + "px");
        if (x < this.width / 2) {
            wrapper
                .style("left", x + "px")
                .attr("class", "rightSide");
        }
        else {
            wrapper
                .style("right", (this.width - x) + "px")
                .attr("class", "leftSide");
        }
        var contentHolder = wrapper.append("div");
        var url = "https://www.twitter.com/" +
            ((Number.isInteger(parseInt(data[1], 10))) ? data[1] : ("i/user/" + data[1]));
        contentHolder.append("span")
            .attr("class", "tooltip--skyLine")
            .html((data[4]) ? "Friend of a friend" : "Direct friend");
        var link = contentHolder.append("div")
            .attr("class", "tooltip--link")
            .append("a")
            .attr("href", url);
        link.append("span").append("img")
            .on("error", function (d, i, a) {
            d3.select(a[i]).attr("src", "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png");
        })
            .attr("src", data[14]);
        link.append("span")
            .html((data[15] === null) ? "Sorry, we have the real username of this person." : data[15]);
        contentHolder.append("span")
            .attr("class", "tooltip--bottomLine")
            .html(((data[3] !== 0 || data[2] !== 0) ? "Friends:" + crossfoam_dev_ui_helpers_1.formatNumber(data[3], browser.i18n.getUILanguage()) + " | Followers:" + crossfoam_dev_ui_helpers_1.formatNumber(data[2], browser.i18n.getUILanguage()) + " | " : "") + ("Connections:" + crossfoam_dev_ui_helpers_1.formatNumber(data[5], browser.i18n.getUILanguage())));
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
        this.hqScale = (crossfoam_dev_ui_helpers_1.isRetinaDisplay) ? 2 : 1;
        if (update) {
            this.update(null);
        }
    };
    Vis.prototype.editCluster = function (data, centralNode) {
        var _this = this;
        var modalContainer = document.createElement("div");
        var modalUUID = crossfoam_dev_utils_1.uuid();
        modalContainer
            .setAttribute("class", "cf--modal-container");
        modalContainer
            .setAttribute("id", "cf--modal-container-" + modalUUID);
        modalContainer
            .innerHTML = "<div class=\"cf--modal-box\">\n      <div class=\"cf--modal-title\">" + browser.i18n.getMessage("clusterModifyTitle") + "</div>\n      <div class=\"cf--modal-message\">\n        <form>\n          <label for=\"clusterForm-name\">" + browser.i18n.getMessage("clusterModifyName") + ":</label>\n          <input type=\"text\" value=\"" + data.info.name + "\" id=\"clusterForm-name\" />\n          <input type=\"hidden\" value=\"" + data.info.color + "\" id=\"clusterForm-color\" />\n          <div id=\"colorPickerContainer\" style=\"width:300px;\"></div>\n        </form>\n      </div>\n      <div class=\"cf--modal-buttons\">\n        <button class='cf--modal-button-0' data-value='cancel'>" + browser.i18n.getMessage("cancel") + "</button>\n        <button class='cf--modal-button-1' data-value='save'>" + browser.i18n.getMessage("save") + "</button>\n      </div>\n  </div>";
        document.body.appendChild(modalContainer);
        crossfoam_dev_ui_helpers_1.colorPicker("colorPickerContainer", "clusterForm-color", 370, data.info.color);
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
            crossfoam_dev_ui_helpers_1.blockSplash("Updating Network Data");
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
        crossfoam_dev_ui_helpers_1.blockSplash("Updating Network Data");
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