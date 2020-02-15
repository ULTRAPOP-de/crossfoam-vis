import { formatNumber } from "@crossfoam/ui-helpers";
import { debounce } from "@crossfoam/utils";
import * as d3 from "d3";
import * as REGL from "regl";
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
  public regl;
  public reglDraw;

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
    // this.g.attr("transform", `translate(${this.canvasTransform.x},${this.canvasTransform.y}) \
    //                           scale(${this.canvasTransform.k})`);

    // this.glContainer.x = this.canvasTransform.x;
    // this.glContainer.y = this.canvasTransform.y;
    // this.glContainer.scale.set(this.canvasTransform.k);
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

    this.resize(false);

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

    const canvas = this.container.append("canvas").attr("id", "overview-regl-canvas");

    this.regl = REGL(document.getElementById("overview-regl-canvas"));

    const points = this.paintNodes.map((node) => {
      let color = [85, 85, 85];

      if (node[6][this.clusterId].length > 0 &&
        node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
        color = this.paintCluster[this.clusterId].clusters[node[6][this.clusterId]].color;
      }

      return {
        color,
        size: node[7] * 2,
        x: node[8] + this.width / 2,
        y: node[9] + this.width / 2,
      };
    });

    // this.glContainer.x = 0;
    // this.glContainer.y = 0;

    // canvas.call(d3.zoom()
    //   .scaleExtent([0.1, 8])
    //   .on("zoom", () => { this.zoom(this); }),
    // );

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

    this.reglDraw = this.regl({
      attributes: {
        color: points.map((d) => d.color),
        position: points.map((d) => [d.x, d.y]),
        size: points.map((d) => d.size),
      },
      count: points.length,
      frag: `
        // set the precision of floating point numbers
        precision highp float;
        // this value is populated by the vertex shader
        varying vec3 fragColor;
        void main() {
          // gl_FragColor is a special variable that holds the color of a pixel
          gl_FragColor = vec4(fragColor, 1);
        }
      `,
      primitive: "points",
      uniforms: {
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
        uniform float stageWidth;
        uniform float stageHeight;
        // helper function to transform from pixel space to normalized device coordinates (NDC)
        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.
        vec2 normalizeCoords(vec2 position) {
          // read in the positions into x and y vars
          float x = position[0];
          float y = position[1];
          return vec2(
            2.0 * ((x / stageWidth) - 0.5),
            // invert y since we think [0,0] is bottom left in pixel space
            -(2.0 * ((y / stageHeight) - 0.5)));
        }
        void main() {
          // update the size of a point based on the prop pointWidth
          gl_PointSize = size;
          // send color to the fragment shader
          fragColor = color;
          // scale to normalized device coordinates
          // gl_Position is a special variable that holds the position of a vertex
          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
        }
      `,
    });

    const frameLoop = this.regl.frame(() => {
      this.regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
      });

      this.reglDraw({
        stageHeight: this.height,
        stageWidth: this.width,
      });

      if (frameLoop) {
        frameLoop.cancel();
      }
    });

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
