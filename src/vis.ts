import * as cfData from "@crossfoam/data";
import { blockSplash, colorPicker, formatNumber, isRetinaDisplay } from "@crossfoam/ui-helpers";
import { uuid } from "@crossfoam/utils";
import * as d3 from "d3";

class Vis {
  public visType: string = null;
  public container: any;

  public width: number;
  public height: number;
  public hqScale: number;

  public canvasTransform = {
    k: 1,
    x: 0,
    y: 0,
  };
  public ctx;
  public svg;

  public paintEdges = [];
  public paintNodes = [];
  public paintCluster = {};

  public clusterId = 0;

  public destroyed = false;

  public helpData = [];

  public showIxTooltip = true;
  public showIxMessage = true;

  public stateManager;

  get cluster() {
    return this.clusterId;
  }

  set cluster(clusterId: number) {
    this.clusterId = clusterId;
    this.update(null);
  }

  constructor(stateManager: any) {
    this.stateManager = stateManager;
    this.container = d3.select("#visContainer");

    d3.select("#visHelp")
      .on("click", () => {
        this.help();
      });

    this.resize(false);
  }

  public asyncGetIxState = async (): Promise<boolean> => {
    const r = await cfData.get(`ixTooltip--${this.visType}`, "false")
      .then((alreadyShown) => {
        if (alreadyShown === "true") {
          this.showIxTooltip = false;
          d3.selectAll("#ixTooltip").remove();
        }
        return cfData.get(`ixMessage--${this.visType}`, "false");
      })
      .then((alreadyShown) => {
        if (alreadyShown === "true") {
          this.showIxMessage = false;
          d3.selectAll("#ixMessage").remove();
        }
        return "true";
      });

    return r;
  }

  public init() {
    // init function
  }

  public build(data: any, centralNode: any) {
    // build function
  }

  public destroy() {
    // destroy function
  }

  public update(data: any) {
    // destroy function
  }

  public updateView() {
    // called by the state manager
  }

  public tooltip(
    data: any,
    _x: number,
    _y: number,
    color: string,
    actionLinks: Array<{
      callback?: (d: any) => void | undefined,
      href?: string | undefined,
      label: string,
    }>,
  ) {

    this.container.selectAll("#tooltip").remove();

    const x = _x;
    const y = _y;

    const linkPath = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    };

    const linkSize = 12;
    const linkPadding = 10;

    const wrapper = this.container.append("div")
      .attr("id", "tooltip")
      .on("mouseleave", () => {
        this.container.selectAll("#tooltip").remove();
      });

    const linkImg = wrapper.append("svg")
      .style("height", (linkSize + 2) + "px")
      .style("width", (linkSize + 2) + "px");

    const contentHolder = wrapper.append("div")
      .style("border-color", color)
      .attr("id", "tooltip--contentHolder");

    const url = "https://www.twitter.com/" +
      ((Number.isInteger(parseInt(data[1], 10))) ? ("i/user/" + data[1]) : data[1]);

    contentHolder.append("span")
      .attr("class", "tooltip--skyLine")
      .html((data[4]) ? browser.i18n.getMessage("visTooltipFriendOfFriend") : browser.i18n.getMessage("visTooltipDirectFriend"));

    const link = contentHolder.append("div")
      .attr("class", "tooltip--link")
      .append("a")
        .attr("href", url);

    link.append("span").append("img")
      .on("error", (d, i, a) => {
        d3.select(a[i]).attr("src", "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png");
      })
      .attr("src", (data.length < 15) ? data[10] : data[14]);

    let name;
    if (data.length < 15) {
      name = (data[11] === null) ? browser.i18n.getMessage("nameNotAvailable") : data[11];
    } else {
      name = (data[15] === null) ? browser.i18n.getMessage("nameNotAvailable") : data[15];
    }

    link.append("span")
      .html(name);

    let bottomLine;

    if (data[3] !== 0 || data[2] !== 0) {
      bottomLine = `${browser.i18n.getMessage("friends")}:${formatNumber(data[3], browser.i18n.getUILanguage())} | \
        ${browser.i18n.getMessage("followers")}:${formatNumber(data[2], browser.i18n.getUILanguage())} | `;
    }

    bottomLine += `${browser.i18n.getMessage("connections")}:${formatNumber(data[5], browser.i18n.getUILanguage())}`;

    contentHolder.append("span")
      .attr("class", "tooltip--bottomLine")
      .html(bottomLine);

    if (actionLinks && actionLinks.length > 0) {
      const actionLinkP = contentHolder.append("p")
        .attr("id", "tooltip--actionLinks");

      actionLinks.forEach((actionLink) => {
        const actionLinkA = actionLinkP.append("a")
          .datum(data)
          .html(actionLink.label);
        if (actionLink.href !== undefined) {
          actionLinkA.attr("href", actionLink.href);
        } else if (actionLink.callback !== undefined) {
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
    } else {
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
    } else {
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
      .attr("d", `M${linkPath.x1},${linkPath.y1}L${linkPath.x2},${linkPath.y2}`);

  }

  public ixTooltip(x: number, y: number) {
    this.container.selectAll("#ixTooltip").remove();
    this.container.append("div")
      .attr("id", "ixTooltip")
      .style("left", `${x}px`)
      .style("top", `${y}px`)
      .append("img")
        .attr("src", "../assets/images/vis--overview--interaction-pointer@2x.png");
  }

  public ixTooltipHide() {
    d3.selectAll("#ixTooltip").remove();
    this.showIxTooltip = false;
    cfData.set(`ixTooltip--${this.visType}`, "true");
  }

  public ixMessage(text: string) {
    this.container.selectAll("#ixMessage").remove();
    const message = this.container.append("div")
      .attr("id", "ixMessage")
      .html(`<a><img src="../assets/images/vis--closeButton@2x.png" /></a><br /><p>${text}</p>`)
      .on("click", () => {
        d3.selectAll("#ixMessage").remove();
        this.showIxMessage = false;
        cfData.set(`ixMessage--${this.visType}`, "true");
      });
    const size = message.node().getBoundingClientRect();
    message.style("top", (this.height / 2 - size.height / 2) + "px");
  }

  public lineLegend(min: number, max: number) {
    // ------ LEGEND

    d3.selectAll("#line-legend").remove();

    const legendWidth = 500;
    const legend = this.container.append("div")
      .attr("id", "line-legend")
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", 25);

    // --- Circle-Sizes
    const lineLegend = legend.append("g")
      .attr("transform", `translate(${legendWidth},21)`);

    let lineLegendOffset = 5;

    lineLegendOffset += 3 + lineLegend.append("text")
      .attr("transform", `translate(-${lineLegendOffset},0)`)
      .attr("class", "normal")
      .attr("text-anchor", "end")
      .text(max)
      .node().getBBox().width;

    lineLegend.append("image")
      .attr("transform", `translate(-${lineLegendOffset + 40},-13.5)`)
      .attr("width", 40)
      .attr("height", 21)
      .attr("xlink:href", "../assets/images/vis--legend--overview--line@2x.png");

    lineLegendOffset += 43;

    lineLegendOffset += 3 + lineLegend.append("text")
      .attr("transform", `translate(-${lineLegendOffset},0)`)
      .attr("class", "normal")
      .attr("text-anchor", "end")
      .text(min)
      .node().getBBox().width;

    lineLegend.append("text")
      .attr("text-anchor", "end")
      .attr("transform", `translate(-${lineLegendOffset},0)`)
      .text(browser.i18n.getMessage("visLegendNumberOfConnections"));
  }

  public circleLegend(min: number, max: number, altText?: string) {
    // ------ LEGEND

    d3.selectAll("#circle-legend").remove();

    const legendWidth = 500;
    const legend = this.container.append("div")
      .attr("id", "circle-legend")
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", 50);

    // --- Cluster-Colors

    const colorLegend = legend.append("g");
    let colorLegendOffset = 10;
    Object.keys(this.paintCluster[this.clusterId].clusters).forEach((clusterKey) => {
      const clusterLegend = this.paintCluster[this.clusterId].clusters[clusterKey];
      const colorLegendItem = colorLegend.append("g")
        .attr("transform", `translate(${legendWidth - colorLegendOffset}, 45)`);
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
    const circleLegend = legend.append("g")
      .attr("transform", `translate(${legendWidth},21)`);

    let circleLegendOffset = 5;

    circleLegendOffset += 3 + circleLegend.append("text")
      .attr("transform", `translate(-${circleLegendOffset},0)`)
      .attr("class", "normal")
      .attr("text-anchor", "end")
      .text(max)
      .node().getBBox().width;

    circleLegend.append("image")
      .attr("transform", `translate(-${circleLegendOffset + 40},-13.5)`)
      .attr("width", 40)
      .attr("height", 21)
      .attr("xlink:href", "../assets/images/vis--legend--overview--circle@2x.png");

    circleLegendOffset += 43;

    circleLegendOffset += 3 + circleLegend.append("text")
      .attr("transform", `translate(-${circleLegendOffset},0)`)
      .attr("class", "normal")
      .attr("text-anchor", "end")
      .text(min)
      .node().getBBox().width;

    let labelNumOfConnections = browser.i18n.getMessage("visLegendNumberOfConnections");
    if (altText && altText !== null) {
      labelNumOfConnections = altText;
    }

    circleLegend.append("text")
      .attr("text-anchor", "end")
      .attr("transform", `translate(-${circleLegendOffset},0)`)
      .text(labelNumOfConnections);
  }

  public help() {
    let helpCount = 0;

    const helpContainer = d3.select("#page").append("div")
      .attr("id", "helpContainer")
      .html(`<p></p>`);

    const helpButtons = helpContainer.append("div")
      .attr("id", "helpButtons");

    const closeHelp = () => {
      d3.selectAll("#helpContainer").remove();
    };

    const updateHelp = () => {
      d3.selectAll(".helpButton").style("opacity", 1);
      if (helpCount === 0) {
        d3.select("#helpButton-prev").style("opacity", 0.3);
      } else if (helpCount === this.helpData.length - 1) {
        d3.select("#helpButton-next").style("opacity", 0.3);
      }
      helpContainer.select("#helpContainer p").html(this.helpData[helpCount]);
    };

    const nextHelp = () => {
      if (helpCount < this.helpData.length - 1) {
        helpCount += 1;
        updateHelp();
      }
    };

    const prevHelp = () => {
      if (helpCount > 0) {
        helpCount -= 1;
        updateHelp();
      }
    };

    helpButtons.append("a")
      .attr("class", "helpButton")
      .html(`<span><span class="icon">
      <img src="../assets/images/navbar--icon-close.png" \
      srcset="../assets/images/navbar--icon-close.png 1x, \
      ../assets/images/navbar--icon-close@2x.png 2x" >
      </span>
      <span>${browser.i18n.getMessage("close")}</span></span>`)
      .on("click", closeHelp);

    helpButtons.append("a")
      .attr("class", "helpButton")
      .attr("id", "helpButton-prev")
      .html(`<span><span>&laquo;&nbsp;${browser.i18n.getMessage("back")}</span></span>`)
      .on("click", prevHelp);

    helpButtons.append("a")
      .attr("class", "helpButton")
      .attr("id", "helpButton-next")
      .html(`<span><span>${browser.i18n.getMessage("next")}&nbsp;&raquo;</span></span>`)
      .on("click", nextHelp);

    updateHelp();
  }

  public resize(update: boolean) {
    this.container.selectAll("#tooltip").remove();

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.hqScale = (isRetinaDisplay) ? 2 : 1;

    if (update) {
      this.update(null);
    }
  }

  public editCluster(data: any, centralNode: any) {

    const modalContainer = document.createElement("div");
    const modalUUID = uuid();

    modalContainer
      .setAttribute("class", "cf--modal-container");

    modalContainer
      .setAttribute("id", "cf--modal-container-" + modalUUID);

    modalContainer
      .innerHTML = `<div class="cf--modal-box">
      <div class="cf--modal-title">${browser.i18n.getMessage("clusterModifyTitle")}</div>
      <div class="cf--modal-message">
        <form>
          <label for="clusterForm-name">${browser.i18n.getMessage("clusterModifyName")}:</label>
          <input type="text" value="${data.info.name}" id="clusterForm-name" />
          <input type="hidden" value="${data.info.color}" id="clusterForm-color" />
          <div id="colorPickerContainer" style="width:300px;"></div>
        </form>
      </div>
      <div class="cf--modal-buttons">
        <button class='cf--modal-button-0' data-value='cancel'>${browser.i18n.getMessage("cancel")}</button>
        <button class='cf--modal-button-1' data-value='save'>${browser.i18n.getMessage("save")}</button>
      </div>
  </div>`;

    document.body.appendChild(modalContainer);

    colorPicker("colorPickerContainer", "clusterForm-color", 370, data.info.color);

    const removeModal = () => {
      const modalContainerSelect = document.querySelector(`#cf--modal-container-${modalUUID}`);
      if (modalContainerSelect !== null) {
        modalContainerSelect.remove();
      }
    };

    // cancel
    document.querySelector(`#cf--modal-container-${modalUUID} .cf--modal-button-0`)
      .addEventListener("click", () => {
        removeModal();
      });

    // save changes
    document.querySelector(`#cf--modal-container-${modalUUID} .cf--modal-button-1`)
      .addEventListener("click", (event) => {
        blockSplash("Updating Network Data");

        const name = (document.querySelector(`#clusterForm-name`) as HTMLInputElement).value;
        const color = (document.querySelector(`#clusterForm-color`) as HTMLInputElement).value;

        cfData.get(`s--${centralNode.service}--a--${centralNode.screenName}-${centralNode.nUuid}--nw`)
          .then((networkData) => {

            networkData.cluster[this.clusterId].clusters[data.id].name = name;
            networkData.cluster[this.clusterId].clusters[data.id].color = color;
            networkData.cluster[this.clusterId].clusters[data.id].modified = true;

            // TODO: indicator while saving happens, update dictionary afterwards...

            return cfData.set(`s--${centralNode.service}--a--${centralNode.screenName}-${centralNode.nUuid}--nw`,
              networkData);
          })
          .then(() => {
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
            }).then(() => {
              // we could at this point reintegrate the modified data
              // and only update the visualisation partially, but this
              // is likely going to run into problems, therefore, we
              // are simply reloading the current view
              location.reload();
            }).catch((err) => {
              throw err;
            });
          });

      });
  }

  public hideCluster(data: any, centralNode: any) {
    blockSplash("Updating Network Data");

    cfData.get(`s--${centralNode.service}--a--${centralNode.screenName}-${centralNode.nUuid}--nw`)
      .then((networkData) => {
        const current = networkData.cluster[this.clusterId].clusters[data.id].modified;
        networkData.cluster[this.clusterId].clusters[data.id].modified = !current;

        return cfData.set(`s--${centralNode.service}--a--${centralNode.screenName}-${centralNode.nUuid}--nw`,
          networkData);
      })
      .then(() => {
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
        }).then(() => {
          // we could at this point reintegrate the modified data
          // and only update the visualisation partially, but this
          // is likely going to run into problems, therefore, we
          // are simply reloading the current view
          location.reload();
        }).catch((err) => {
          throw err;
        });
      });

  }

}

export { Vis };
