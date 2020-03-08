import { debounce } from "@crossfoam/utils";
import * as d3 from "d3";
import * as REGL from "regl";
import { Vis } from "./vis";

class NetworkVis extends Vis {
  public visType = "network";
  public regl;
  public reglDraw;
  public reglDrawLine;
  public clickNodes;
  public paintNodes;
  public paintEdges;
  public time = 0;
  public frameLoop: any = false;

  public destroy() {
    this.destroyed = true;
    this.container.selectAll("#tooltip").remove();
    this.app.destroy(true, true);
  }

  public zoom(_this) {
    this.container.selectAll("#tooltip").remove();
    _this.canvasTransform = d3.event.transform;
    this.glAnimate();
  }

  public build(data: any, centralNode: any) {

    this.paintCluster = data.cluster;

    const pointColors = [];
    const pointPositions = [];
    const pointSizes = [];

    data.nodes.forEach((node) => {
      let color = [85 / 255, 85 / 255, 85 / 255];

      if (node[6][this.clusterId].length > 0 &&
        node[6][this.clusterId][0] in this.paintCluster[this.clusterId].clusters) {
        const rgb = d3.color(this.paintCluster[this.clusterId].clusters[node[6][this.clusterId]].color).rgb();
        color = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      }

      pointColors.push(color);
      pointPositions.push([node[11] + this.width / 2, node[12] + this.height / 2]);
      pointSizes.push(node[10] * 4);
    });

    this.paintEdges = data.edges.filter((d) => (d[3] < 2) ? true : false);

    // this.resize(false);

    // d3.select(window).on("resize", () => {
    //   this.handleResize();
    // });

    // canvas
    const canvas = this.container.append("div")
      .style("width", this.width + "px")
      .style("height", this.height + "px")
      .attr("id", "overview-regl-canvas");
    
    this.canvasTransform = d3.zoomIdentity;

    this.regl = REGL(document.getElementById("overview-regl-canvas"));

    d3.select("#overview-regl-canvas").call(d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", () => { this.zoom(this); }),
    );

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
        offsetX: this.regl.prop("offsetX"),
        offsetY: this.regl.prop("offsetY"),
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
        uniform float offsetX;
        uniform float offsetY;
        uniform float stageWidth;
        uniform float stageHeight;
        // helper function to transform from pixel space to normalized device coordinates (NDC)
        // in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.
        vec2 normalizeCoords(vec2 position) {
          // read in the positions into x and y vars
          float x = position[0] * scale + offsetX;
          float y = position[1] * scale + offsetY;
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

    this.reglDrawLine = this.regl({
      attributes: {
        position: pointPositions,
      },
      blend: {
        enable: true,
        func: {
          srcRGB: "src alpha",
          srcAlpha: 1,
          dstRGB: "one minus src alpha",
          dstAlpha: 1,
        },
        equation: {
          rgb: "add",
          alpha: "add",
        },
        color: [0, 0, 0, 0],
      },
      count: this.paintEdges.length,
      depth: {
        enable: false,
      },
      elements: this.paintEdges.map((edge) => [edge[0], edge[1]]),
      frag: `
        precision mediump float;
        uniform vec4 color;
        void main() {
          gl_FragColor = color;
        }`,
      lineWidth: 1,
      primitive: "line",
      uniforms: {
        offsetX: this.regl.prop("offsetX"),
        offsetY: this.regl.prop("offsetY"),
        color: [0, 0, 0, 0.5],
        scale: this.regl.prop("scale"),
        stageHeight: this.regl.prop("stageHeight"),
        stageWidth: this.regl.prop("stageWidth"),
      },
      vert: `
        precision mediump float;
        attribute vec2 position;
        uniform float scale;
        uniform float offsetX;
        uniform float offsetY;
        uniform float stageWidth;
        uniform float stageHeight;
        vec2 normalizeCoords(vec2 position) {
          // read in the positions into x and y vars
          float x = position[0] * scale + offsetX;
          float y = position[1] * scale + offsetY;
          return vec2(
            2.0 * ((x / stageWidth) - 0.5),
            // invert y to treat [0,0] as bottom left in pixel space
            -(2.0 * ((y / stageHeight) - 0.5))
          );
        }
        void main() {
          gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
        }`,
    });

    this.time = 1;
    this.update(false);
  }

  public glAnimate() {
    if (!this.frameLoop) {
      this.frameLoop = this.regl.frame(() => {
        this.regl.clear({
          color: [1, 1, 1, 1],
          depth: 1,
        });

        this.reglDrawLine({
          offsetX: this.canvasTransform.x,
          offsetY: this.canvasTransform.y,
          scale: this.canvasTransform.k,
          stageHeight: this.height,
          stageWidth: this.width,
        });

        this.reglDraw({
          offsetX: this.canvasTransform.x,
          offsetY: this.canvasTransform.y,
          scale: this.canvasTransform.k,
          stageHeight: this.height,
          stageWidth: this.width,
        });

        this.frameLoop.cancel();
        this.frameLoop = false;
      });
    }
  }

  public update(data: any) {
    // this.svg.attr("transform", `translate(${this.width / 2},${this.height / 2}) scale(${this.scaleTarget})`);

    this.container.select("#overview-regl-canvas")
      .style("width", this.width + "px")
      .style("height", this.height + "px");

    this.container.select("#overview-regl-canvas canvas")
      .attr("width", this.width * 2)
      .attr("height", this.height * 2)
      .style("width", this.width + "px")
      .style("height", this.height + "px");

    this.regl.poll();
    this.glAnimate();
  }

}

export { NetworkVis };
