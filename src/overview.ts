import { formatNumber, logoSpinner } from "@crossfoam/ui-helpers";
import { debounce } from "@crossfoam/utils";
import { color as d3color,  easeCubic, event as d3event, extent, interpolate, max, scaleLinear, select } from "d3";
import * as REGL from "regl";
import { Vis } from "./vis";

class OverviewVis extends Vis {
  public visType = "overview";
  public glNodes = [];
  public app;
  public glContainer;
  public clickNodes = [];
  public g;
  public regl;
  public reglDraw;
  public time = 1;
  public scaleTarget = 1;
  public navData;
  public navPoints;
  public navLine;
  public navActiveLine;
  public currentScale = 0;
  public interpolation;
  public lineInterpolation;
  public lineTarget = 0;
  public navDist;
  public frameLoop: any = false;

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

  public handleResize = debounce(() => {
    this.resize(true);
  }, 200, true);

  constructor(stateManager: any) {
    super(stateManager);
    this.asyncGetIxState();
  }

  public destroyTooltip() {
    const tooltip = this.container.selectAll("#tooltip");
    if (tooltip.size() > 0) {
      tooltip.remove();
    }
  }

  public destroy() {
    this.destroyed = true;
    this.destroyTooltip();
  }

  public zoom(_this) {
    this.destroyTooltip();
    _this.canvasTransform = d3event.transform;
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

    this.paintNodes = [...data.nodes, ...data.proxies, ...tempLeafs];
    this.clickNodes = [...data.nodes, ...data.proxies];
    this.paintCluster = data.cluster;

    this.resize(false);

    select(window).on("resize", () => {
      this.handleResize();
    });

    // canvas
    const canvas = this.container.append("div")
      .style("width", this.width + "px")
      .style("height", this.height + "px")
      .attr("id", "overview-regl-canvas");

    const svg = this.container.append("svg")
      .attr("id", "overview-svg")
      .style("z-index", 2)
      .on("click", () => {
        const x = d3event.pageX;
        const y = d3event.pageY;

        let hit = false;

        this.clickNodes.forEach((node) => {
          const dist = Math.sqrt(
            Math.pow(x - (node[8] * this.scaleTarget + this.width / 2), 2)
            + Math.pow(y - (node[9] * this.scaleTarget + this.height / 2), 2),
          );

          if (dist <= node[7] * this.scaleTarget) {
            let color = "#555555";
            let params = [];
            if (node[6][this.clusterId].length > 0 &&
              node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
              const rgb = d3color(this.paintCluster[this.clusterId].clusters[node[6][this.clusterId]].color).rgb();
              color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
              params = [{
                callback: (d) => {
                  window.location.href = `vis.html?view=cluster&nUuid=${this.stateManager.urlState.nUuid}&subView=level2&subViewId=${d[0]}`;
                },
                label: "Show connections to this user &raquo;",
              }];
            }

            this.tooltip(
              node,
              node[8] * this.scaleTarget + this.width / 2,
              node[9] * this.scaleTarget + this.height / 2,
              color,
              params,
            );
            hit = true;
          }
        });

        if (!hit) {
          this.container.selectAll("#tooltip").remove();
        }

      });

    const textRadius = max(data.nodes, (d) => Math.sqrt(Math.pow(d[8], 2) + Math.pow(d[9], 2)));

    const defs = svg.append("defs");

    defs.append("path")
      .attr("id", "textPath")
      .attr("d", this.circlePath(0, 0, textRadius + 8, true));

    defs.append("path")
      .attr("id", "reverseTextPath")
      .attr("d", this.circlePath(0, 0, textRadius + 17, false));

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
      .classed("centerGroup", true);

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

    const pointColors = [];
    const pointPositions = [];
    const pointSizes = [];

    let pointSizeMin = Number.MAX_VALUE;
    let pointSizeMax = 0;

    this.paintNodes.forEach((node) => {
      let color = [85 / 255, 85 / 255, 85 / 255];

      if (node[6][this.clusterId].length > 0 &&
        node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
        const rgb = d3color(this.paintCluster[this.clusterId].clusters[node[6][this.clusterId]].color).rgb();
        color = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      }

      pointColors.push(color);
      pointPositions.push([node[8], node[9]]);
      pointSizes.push(node[7] * 4);

      if (node[5] > pointSizeMax) {
        pointSizeMax = node[5];
      }

      if (node[5] < pointSizeMin) {
        pointSizeMin = node[5];
      }
    });

    // ------ VIS NAVIGATION

    const navigation = this.container.append("div")
      .attr("id", "overview-navigation")
      .append("svg");

    this.navData = [
      [data.nodes.length, `<strong>${browser.i18n.getMessage("friends")}</strong> ${formatNumber(data.nodes.length, browser.i18n.getUILanguage())}`],
      [data.proxies.length, `<strong>${browser.i18n.getMessage("sharedFiendsOfFriends")}</strong> ${formatNumber(data.proxies.length, browser.i18n.getUILanguage())}`],
      [tempLeafs.length, `<strong>${browser.i18n.getMessage("otherFriends")}</strong> ${formatNumber(tempLeafs.length, browser.i18n.getUILanguage())}`],
    ];

    this.navLine = navigation.append("line")
      .attr("transform", "translate(110, 0)")
      .attr("y1", this.navData[0][2])
      .style("stroke-width", 5)
      .style("stroke", "white");

    this.navPoints = navigation.append("g").selectAll("g").data(this.navData).enter().append("g")
      .attr("class", "overview-navigation-buttons");

    const navScale = scaleLinear().range([10, 35]).domain(extent(this.navData, (d) => d[0]));

    this.navData.forEach((nd, ni) => {
      nd.push(navScale(nd[0]));
      let offset = 0;
      while (ni > 0) {
        ni -= 1;
        offset += this.navData[ni][2] * 2;
      }
      nd.push(offset);
    });

    this.navPoints.append("circle")
      .attr("r", (d) => navScale(d[0]) + 5)
      .style("fill", "white");

    this.navPoints.append("circle")
      .attr("r", (d) => navScale(d[0]))
      .style("fill", "rgba(0,0,0,0.2)");

    this.navPoints.append("circle")
      .attr("r", (d, i) => {
        if (i === 0) {
          return 0;
        } else {
          return navScale(this.navData[i - 1][0]);
        }
      })
      .style("fill", "white");

    this.navPoints.append("line")
      .attr("x2", -14);

    this.navPoints.append("circle")
      .attr("class", "overview-navigation-indicator")
      .attr("r", 5);

    this.navPoints.append("foreignObject")
      .attr("width", "90")
      .attr("height", "45")
      .attr("transform", "translate(-108, -17)")
      .html((d) => `<p>${d[1]}</p>`);

    this.navActiveLine = navigation.append("line")
      .style("pointer-events", "none")
      .attr("transform", "translate(110, 15)")
      .style("stroke-width", 1)
      .style("stroke", "338498");

    const getDist = (n) => Math.sqrt(Math.pow(n[8], 2) + Math.pow(n[9], 2));

    this.navData[0].push(data.nodes.map((n) => getDist(n)).sort((a, b) => b - a)[0]);
    this.navData[1].push(getDist(data.proxies[data.proxies.length - 1]));
    this.navData[2].push(getDist(tempLeafs[tempLeafs.length - 1]));

    this.navPoints.on("click", (d, i) => {
      this.container.selectAll("#tooltip").remove();
      this.currentScale = i;
      this.interpolation = interpolate(this.scaleTarget, d[5]);
      this.lineInterpolation = interpolate(this.lineTarget, this.navDist * i + d[3] + d[2] - 5);
      this.time = 0;
      this.update(false);
      this.ixTooltipHide();
    });

    this.circleLegend(pointSizeMin, pointSizeMax);

    // ------ WebGL Object Initialization (REGL)

    this.regl = REGL(document.getElementById("overview-regl-canvas"));

    window.onbeforeunload = () => {
      this.regl.destroy();
    };

    this.reglDraw = this.regl({
      attributes: {
        color: pointColors,
        position: pointPositions,
        size: pointSizes,
      },
      count: pointColors.length,
      frag: `
        // set the precision of floating point numbers
        precision highp float;
        // this value is populated by the vertex shader
        varying vec3 fragColor;
        void main() {
          float r = 0.0, delta = 0.0;
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          r = dot(cxy, cxy);
          if (r > 1.0) {
              discard;
          }
          // gl_FragColor is a special variable that holds the color of a pixel
          gl_FragColor = vec4(fragColor, 1);
        }
      `,
      primitive: "points",
      uniforms: {
        scale: this.regl.prop("scale"),
        stageHeight: this.regl.prop("stageHeight"),
        stageWidth: this.regl.prop("stageWidth"),
      },
      vert: `
        // per vertex attributes
        attribute float size;
        attribute vec2 position;
        attribute vec3 color;
        // variables to send to the fragment shader
        varying vec3 fragColor;
        // values that are the same for all vertices
        uniform float scale;
        uniform float stageWidth;
        uniform float stageHeight;
        // helper function to transform from pixel space to normalized device coordinates (NDC)
        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.
        vec2 normalizeCoords(vec2 position) {
          // read in the positions into x and y vars
          float x = position[0] * scale + stageWidth / 2.0;
          float y = position[1] * scale + stageHeight / 2.0;
          return vec2(
            2.0 * ((x / stageWidth) - 0.5),
            // invert y to treat [0,0] as bottom left in pixel space
            -(2.0 * ((y / stageHeight) - 0.5))
          );
        }
        void main() {
          // update the size of a point based on the prop pointWidth
          gl_PointSize = size * scale;
          // send color to the fragment shader
          fragColor = color;
          // scale to normalized device coordinates
          // gl_Position is a special variable that holds the position of a vertex
          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
        }
      `,
    });

    this.time = 1;
    this.update(false);

    setTimeout(() => {
      this.update(false);
    }, 100);
  }

  public glAnimate() {
    if (!this.frameLoop) {
      this.frameLoop = this.regl.frame(() => {
        this.regl.clear({
          color: [255, 255, 255, 1],
          depth: 1,
        });

        let scale = this.scaleTarget;
        let lineY = this.lineTarget;

        if (this.time < 1) {
          lineY = this.lineInterpolation(easeCubic(this.time));
          this.lineTarget = lineY;

          scale = this.interpolation(easeCubic(this.time));
          this.scaleTarget = scale;
        }

        this.navActiveLine.attr("y2", lineY);
        this.navPoints.classed("active", (d, i) => {
          if (lineY >= this.navDist * i + d[3]) {
            return true;
          }
          return false;
        });

        this.svg.attr("transform", `translate(${this.width / 2},${this.height / 2}) scale(${this.scaleTarget})`);

        this.reglDraw({
          scale,
          stageHeight: this.height,
          stageWidth: this.width,
        });

        if (this.frameLoop && this.time >= 1) {
          this.frameLoop.cancel();
          this.frameLoop = false;
        } else {
          this.time += 0.01;
        }
      });
    }
  }

  public update(data: any) {
    this.navDist = (this.height * 0.5 - 10 - this.navData.reduce((a, b) => a + b[2] * 2, 0)) / 2;
    this.navPoints.attr("transform", (d, i) => `translate(110, ${this.navDist * i + d[3] + d[2] + 5})`);

    if (this.showIxTooltip) {
      this.ixTooltip(this.width - 50, this.height / 2 + this.navDist * 1.5);
    }

    if (this.showIxMessage) {
      this.ixMessage(browser.i18n.getMessage("visOverviewIntro"));
    }

    this.navLine.attr("y2", this.navDist * 2 +
      this.navData[this.navData.length - 1][3] +
      this.navData[this.navData.length - 1][2]);

    this.svg.attr("transform", `translate(${this.width / 2},${this.height / 2}) scale(${this.scaleTarget})`);

    this.container.select("#overview-regl-canvas")
      .style("width", this.width + "px")
      .style("height", this.height + "px");

    this.container.select("#overview-regl-canvas canvas")
      .attr("width", this.width * 2)
      .attr("height", this.height * 2)
      .style("width", this.width + "px")
      .style("height", this.height + "px");

    this.navData.forEach((n) => {
      const scaleX = (this.width / 2) / (n[4] + 50);
      const scaleY = (this.height / 2) / (n[4] + 50);
      let scale = 1;
      if (scaleX < scaleY && scaleX < 1) {
        scale = scaleX;
      } else if (scaleY < 1) {
        scale = scaleY;
      }
      n[5] = scale;
    });

    this.regl.poll();
    this.glAnimate();
  }
}

export { OverviewVis };
