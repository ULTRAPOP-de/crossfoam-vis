import { install as pixiInstall } from "@pixi/unsafe-eval";
import { isRetinaDisplay } from "crossfoam-dev-ui-helpers";
import { debounce } from "crossfoam-dev-utils";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Vis } from "./vis";

class NetworkVis extends Vis {
  public visType = "network";
  public app;
  public glContainer;
  public glContainerArcs;
  public glContainerLines;
  public paintNodeCount = 0;
  public clickNodes = [];
  public paintEdgeCount = 0;
  public nodeGraphic;
  public edgeGraphic;
  public arcGraphic;
  public colorSprites = {};
  public texture;

  public paint = debounce(() => {
    this.glContainerLines.x = this.glContainerArcs.x = this.glContainer.x = this.canvasTransform.x;
    this.glContainerLines.y = this.glContainerArcs.y = this.glContainer.y = this.canvasTransform.y;

    this.glContainer.scale.set(this.canvasTransform.k);
    this.glContainerArcs.scale.set(this.canvasTransform.k);
    this.glContainerLines.scale.set(this.canvasTransform.k);
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

  public build(data: any, centralNode: any) {

    pixiInstall(PIXI);

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
    this.paintEdges = data.edges.filter((d) => (d[3] < 2) ? true : false);

    // Default texture
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(2, PIXI.utils.string2hex("#ffffff"), 1);
    graphics.beginFill(PIXI.utils.string2hex("#555555"), 1);
    graphics.drawCircle(50, 50, 50);
    graphics.endFill();
    this.texture = renderer.generateTexture(graphics, 1, this.hqScale);

    Object.keys(this.paintCluster[this.clusterId].clusters).forEach((clusterKey) => {
      const color = this.paintCluster[this.clusterId].clusters[clusterKey].color;

      const colorGraphics = new PIXI.Graphics();
      colorGraphics.lineStyle(2, PIXI.utils.string2hex("#ffffff"), 1);
      colorGraphics.beginFill(PIXI.utils.string2hex(color), 1);
      colorGraphics.drawCircle(50, 50, 50);
      colorGraphics.endFill();

      this.colorSprites[clusterKey] = renderer.generateTexture(colorGraphics, 1, this.hqScale);
    });

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
          Math.pow((x - this.canvasTransform.x) - (node[11] + this.width / 2) * this.canvasTransform.k, 2)
          + Math.pow((y - this.canvasTransform.y) - (node[12] + this.height / 2) * this.canvasTransform.k, 2),
        );

        if (dist <= node[10] * this.canvasTransform.k) {
          this.tooltip(node, node[11], node[12]);
          hit = true;
        }
      });

      if (!hit) {
        this.container.selectAll("#tooltip").remove();
      }

    });

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
          sprite.x = node[11] + this.width / 2;
          sprite.y = node[12] + this.height / 2;
          sprite.width = node[10] * 2;
          sprite.height = node[10] * 2;
          this.glContainer.addChild(sprite);

          // ---- paint friend arcs
          const arc = new PIXI.Graphics();

          let startAngle = 0;
          let fullCount = 0;
          Object.keys(node[13][this.clusterId]).forEach((clusterKey) => {
            fullCount += node[13][this.clusterId][clusterKey];
          });

          Object.keys(node[13][this.clusterId]).forEach((clusterKey) => {
            const angle = (2 * Math.PI / fullCount) * node[13][this.clusterId][clusterKey];

            let friendColor = "#555555";
            if (clusterKey in this.paintCluster[this.clusterId].clusters) {
              friendColor = this.paintCluster[this.clusterId].clusters[clusterKey].color;
            }

            arc.lineStyle(1, PIXI.utils.string2hex("#ffffff"), 1);
            arc.beginFill(PIXI.utils.string2hex(friendColor));

            arc.arc(0, 0, node[10] + 5, startAngle, startAngle + angle);
            arc.arc(0, 0, node[10] + 1, startAngle + angle, startAngle, true);

            arc.endFill();

            startAngle += angle;
          });

          arc.position.set(node[11] + this.width / 2, node[12] + this.height / 2);
          this.glContainerArcs.addChild(arc);
        }
      }

      window.requestAnimationFrame(() => this.addNodes());
    } else if (this.paintEdgeCount < this.paintEdges.length) {
      // paint edges
      for (let i = 0; i < limit && this.paintEdgeCount < this.paintEdges.length; i += 1) {
        const edge = this.paintEdges[this.paintEdgeCount];
        this.paintEdgeCount += 1;

        this.edgeGraphic.moveTo((this.paintNodes[edge[0]][11] + this.width / 2),
                                (this.paintNodes[edge[0]][12] + this.height / 2));

        this.edgeGraphic.lineTo((this.paintNodes[edge[1]][11] + this.width / 2),
                                (this.paintNodes[edge[1]][12] + this.height / 2));
      }

      window.requestAnimationFrame(() => this.addNodes());
    }
  }

  public update(data: any) {
    d3.select(".centerGroup")
      .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

    d3.selectAll("canvas")
      .attr("width", this.width * this.hqScale)
      .attr("height", this.height * this.hqScale);

    if (data) {
      // rebuild
    }
  }

}

export { NetworkVis };
