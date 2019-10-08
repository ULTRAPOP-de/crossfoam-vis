import { install as pixiInstall } from "@pixi/unsafe-eval";
import { formatNumber } from "crossfoam-dev-ui-helpers";
import { debounce } from "crossfoam-dev-utils";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Vis } from "./vis";

class OverviewVis extends Vis {
  public visType = "overview";
  public glNodes = [];
  public app;
  public glContainer;
  public clickNodes = [];
  public nodeColors = [];
  public paintNodeCount = 0;
  public glNodeCount = 0;
  public texture;
  public nodeGraphic;
  public colorSprites = {};
  public g;

  public helpData = [
    browser.i18n.getMessage("helpOverview_1"),
    browser.i18n.getMessage("helpOverview_2"),
    browser.i18n.getMessage("helpOverview_3"),
    browser.i18n.getMessage("helpOverview_4"),
    browser.i18n.getMessage("helpOverview_5"),
    browser.i18n.getMessage("helpOverview_6"),
    browser.i18n.getMessage("helpOverview_7"),
    browser.i18n.getMessage("helpOverview_8"),
  ];

  public paint = debounce(() => {
    // Only SVG Overlay...
    this.g.attr("transform", `translate(${this.canvasTransform.x},${this.canvasTransform.y}) \
                              scale(${this.canvasTransform.k})`);

    this.glContainer.x = this.canvasTransform.x;
    this.glContainer.y = this.canvasTransform.y;
    this.glContainer.scale.set(this.canvasTransform.k);
  }, 200, true);

  public destroy() {
    this.destroyed = true;
    this.container.selectAll("#tooltip").remove();
    this.app.destroy(true, true);
  }

  public zoom(_this) {
    this.container.selectAll("#tooltip").remove();
    _this.canvasTransform = d3.event.transform;
    _this.paint();
  }

  public circlePath(x: number, y: number, r: number, direction: boolean): string {
    return `M${x},${y} \
     m${-r}, 0 \
     a${r},${r} 0 ${(direction) ? "0" : "1"},${(direction) ? "1" : "0"} ${r * 2},0 \
     a${r},${r} 0 ${(direction) ? "0" : "1"},${(direction) ? "1" : "0"} ${-r * 2},0Z`;
  }

  public build(data: any, centralNode: any) {

    const tempLeafs = data.leafs.map((d) => {
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

    this.glNodes = [...data.proxies, ...tempLeafs];
    this.paintNodes = data.nodes;
    this.paintCluster = data.cluster;
    pixiInstall(PIXI);

    const svg = this.container.append("svg")
      .style("pointer-events", "none")
      .style("z-index", 2);

    const textRadius = d3.max(data.nodes, (d) => Math.sqrt(Math.pow(d[8], 2) + Math.pow(d[9], 2)));

    const defs = svg.append("defs");

    defs.append("path")
      .attr("id", "textPath")
      .attr("d", this.circlePath(0, 0, textRadius + 8, true));

    defs.append("path")
      .attr("id", "reverseTextPath")
      .attr("d", this.circlePath(0, 0, textRadius + 14, false));

    const imageSize = 48;

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
      .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

    this.svg.append("text")
      .append("textPath")
      .attr("startOffset", "25%")
      .attr("xlink:href", "#textPath")
      .style("font-family", "Helvetica, Arial, sans-serif")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .html(`&darr;&nbsp;${formatNumber(data.nodes.length, browser.i18n.getUILanguage())} ${browser.i18n.getMessage("friends")}`);

    this.svg.append("text")
      .append("textPath")
      .attr("startOffset", "25%")
      .attr("xlink:href", "#reverseTextPath")
      .style("font-family", "Helvetica, Arial, sans-serif")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .html(`&darr;&nbsp;${formatNumber(data.proxies.length, browser.i18n.getUILanguage())} ${browser.i18n.getMessage("sharedFiendsOfFriends")}`);

    this.svg.append("image")
      .attr("transform", `translate(-${imageSize / 2}, -${imageSize / 2})`)
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

    const canvas = this.container.append("canvas");

    this.update(null);

    this.app = new PIXI.Application({
      antialias: true,
      backgroundColor: 0xffffff,
      height: this.height,
      resolution: this.hqScale,
      view: canvas.node(),
      width: this.width,
    });

    const renderer = this.app.renderer;

    this.app.render();

    this.container.node().appendChild(this.app.view);

    this.glContainer = new PIXI.Container();
    this.app.stage.addChild(this.glContainer);

    this.nodeGraphic = new PIXI.Graphics();
    this.glContainer.addChild(this.nodeGraphic);

    // Default texture
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(0);
    graphics.beginFill(PIXI.utils.string2hex("#555555"), 1);
    graphics.drawCircle(50, 50, 50);
    graphics.endFill();
    this.texture = renderer.generateTexture(graphics, 1, this.hqScale);

    Object.keys(this.paintCluster[this.clusterId].clusters).forEach((clusterKey) => {
      const color = this.paintCluster[this.clusterId].clusters[clusterKey].color;

      const colorGraphics = new PIXI.Graphics();
      colorGraphics.lineStyle(0);
      colorGraphics.beginFill(PIXI.utils.string2hex(color), 1);
      colorGraphics.drawCircle(50, 50, 50);
      colorGraphics.endFill();

      this.colorSprites[clusterKey] = renderer.generateTexture(colorGraphics, 1, this.hqScale);
    });

    this.glContainer.x = 0;
    this.glContainer.y = 0;

    canvas.call(d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", () => { this.zoom(this); }),
    );

    canvas.on("click", () => {
      const x = d3.event.pageX;
      const y = d3.event.pageY;

      let hit = false;

      this.clickNodes.forEach((node) => {
        const dist = Math.sqrt(
          Math.pow((x - this.canvasTransform.x) - (node[8] + this.width / 2) * this.canvasTransform.k, 2)
          + Math.pow((y - this.canvasTransform.y) - (node[9] + this.height / 2) * this.canvasTransform.k, 2),
        );

        if (dist <= node[7] * this.canvasTransform.k) {
          this.tooltip(node, node[8], node[9]);
          hit = true;
        }
      });

      if (!hit) {
        this.container.selectAll("#tooltip").remove();
      }

    });

    this.clickNodes = [...data.nodes, ...data.proxies];

    this.container.append("div")
      .attr("id", "overview-legend")
      .html(`<img src="../assets/images/vis--overview--legend.png" \
      srcset="../assets/images/vis--overview--legend.png 1x, \
      ../assets/images/vis--overview--legend@2x.png 2x">`);

    this.paint();
    this.addNodes();
  }

  public addNodes() {
    const limit = 100;

    if (this.paintNodeCount < this.paintNodes.length) {
      for (let i = 0; i < limit && this.paintNodeCount < this.paintNodes.length; i += 1) {
        const node = this.paintNodes[this.paintNodeCount];
        this.paintNodeCount += 1;

        let texture = this.texture;
        if (node[6][this.clusterId].length > 0 &&
            node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
          texture = this.colorSprites[node[6][this.clusterId][0]];
        }

        if (!this.destroyed) {
          const sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5, 0.5);
          sprite.x = node[8] + this.width / 2;
          sprite.y = node[9] + this.height / 2;
          sprite.width = node[7] * 2;
          sprite.height = node[7] * 2;

          this.glContainer.addChild(sprite);
        }

      }
      window.requestAnimationFrame(() => this.addNodes());
    } else if (this.glNodeCount < this.glNodes.length) {

      for (let i = 0; i < limit && this.glNodeCount < this.glNodes.length; i += 1) {
        const glNode = this.glNodes[this.glNodeCount];
        this.glNodeCount += 1;

        if (!this.destroyed) {
          const sprite = new PIXI.Sprite(this.texture);
          sprite.anchor.set(0.5, 0.5);
          sprite.x = glNode[8] + this.width / 2;
          sprite.y = glNode[9] + this.height / 2;
          sprite.width = glNode[7] * 2;
          sprite.height = glNode[7] * 2;

          this.glContainer.addChild(sprite);
        }
      }
      window.requestAnimationFrame(() => this.addNodes());
    }
  }

  public update(data: any) {
    d3.selectAll("canvas, svg")
      .attr("width", this.width * this.hqScale)
      .attr("height", this.height * this.hqScale);

    if (data) {
      // rebuild
    }
  }

}

export { OverviewVis };
