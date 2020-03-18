import * as d3 from "d3";
import { Vis } from "./vis";

class ClusterVis extends Vis {
  public visType = "cluster";
  public svg;
  public imageSize = 48;
  public paintCentralNode;
  public canvas;
  public ctx;
  public showEdges = false;
  public showProxies = false;
  public outerSvg;
  public level = 0;
  public graph = {
    links: [],
    nodeMap: {},
    nodes: [],
    proxieLinks: [],
  };
  public zoomObj;
  public edgeToggle;
  public proxyToggle;

  public helpData = [
  ];

  public zoom(_this) {
    this.container.selectAll("#tooltip").remove();
    _this.canvasTransform = d3.event.transform;
    this.paint();
  }

  public hitTest(x: number, y: number): any {
    for (const node of this.graph.nodes) {
      const dist = Math.sqrt(
        Math.pow(x - (node.x * this.canvasTransform.k + this.canvasTransform.x), 2)
        + Math.pow(y - (node.y * this.canvasTransform.k + this.canvasTransform.y), 2),
      );
      if (dist <= node.r * this.canvasTransform.k) {
        return node;
      }
    }

    return false;
  }

  public build(data: any, centralNode: any) {
    this.paintCluster = data.cluster;
    this.paintNodes = data.nodes;
    this.paintEdges = data.edges;
    this.paintCentralNode = centralNode;

    this.canvas = this.container.append("canvas");
    this.ctx = this.canvas.node().getContext("2d");

    this.zoomObj = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", () => { this.zoom(this); });

    this.outerSvg = this.container.append("svg")
      .call(this.zoomObj);

    const defs = this.outerSvg.append("defs");

    defs.append("clipPath")
      .attr("id", "userClip")
      .append("circle")
        .attr("cx", this.imageSize / 2)
        .attr("cy", this.imageSize / 2)
        .attr("r", (this.imageSize - 4) / 2)
        .style("fill", "black");

    this.svg = this.outerSvg.append("g");

    this.edgeToggle = this.outerSvg.append("g")
      .attr("id", "cluster-vis-showEdges-toggle")
      .on("click", () => {
        if (this.showEdges) {
          edgeToggleG.select("text")
            .html(browser.i18n.getMessage("visClusterToggleOff"));
        } else {
          edgeToggleG.select("text")
            .html(browser.i18n.getMessage("visClusterToggleOn"));
        }
        this.showEdges = !this.showEdges;
        this.edgeToggle.classed("active", this.showEdges);
        this.paint();
      });

    const edgeToggleG = this.edgeToggle.append("g");

    edgeToggleG.append("image")
      .attr("class", "cluster-vis-showEdges-normal")
      .attr("width", 51)
      .attr("height", 33)
      .attr("xlink:href", "../assets/images/vis--cluster--showEdges-normal@2x.png");

    edgeToggleG.append("image")
      .attr("class", "cluster-vis-showEdges-active")
      .attr("width", 51)
      .attr("height", 33)
      .attr("xlink:href", "../assets/images/vis--cluster--showEdges-active@2x.png");

    edgeToggleG.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "translate(-4, 20)")
      .html(browser.i18n.getMessage("visClusterToggleOff"));

    this.proxyToggle = this.outerSvg.append("g")
      .attr("id", "cluster-vis-showProxies-toggle")
      .on("click", () => {
        if (this.showProxies) {
          proxyToggleG.select("text")
            .html(browser.i18n.getMessage("visProxiesToggleOff"));
        } else {
          edgeToggleG.select("text")
            .html(browser.i18n.getMessage("visProxiesToggleOn"));
        }
        this.showProxies = !this.showProxies;
        this.proxyToggle.classed("active", this.showProxies);
        this.paint();
      });

    const proxyToggleG = this.proxyToggle.append("g");

    proxyToggleG.append("image")
      .attr("class", "cluster-vis-showProxies-normal")
      .attr("width", 51)
      .attr("height", 33)
      .attr("xlink:href", "../assets/images/vis--cluster--showProxies-normal@2x.png");

    proxyToggleG.append("image")
      .attr("class", "cluster-vis-showProxies-active")
      .attr("width", 51)
      .attr("height", 33)
      .attr("xlink:href", "../assets/images/vis--cluster--showProxies-active@2x.png");

    proxyToggleG.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "translate(-4, 23)")
      .html(browser.i18n.getMessage("visProxiesToggleOff"));

    this.resize(true);

    this.buildLevel0();
  }

  public buildLevel0() {
    this.svg.selectAll("*").remove();
    this.edgeToggle.classed("invisible", true);
    this.proxyToggle.classed("invisible", true);

    this.outerSvg.on("click", null);

    // generate first level data
    const clusterCounts = {};
    this.paintNodes.forEach((node) => {
      const clusterGroupId = node[6][this.clusterId];
      if (!(clusterGroupId in clusterCounts)) {
        clusterCounts[clusterGroupId] = 0;
      }
      clusterCounts[clusterGroupId] += 1;
    });

    // centroid user icon
    const centerGroup = this.svg.append("g")
        .attr("class", "centerGroup")
        .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);

    centerGroup.append("image")
      .attr("transform", `translate(-${this.imageSize / 2}, -${this.imageSize / 2})`)
      .attr("xlink:href", this.paintCentralNode.image)
      .style("width", this.imageSize)
      .style("height", this.imageSize)
      .attr("clip-path", "url(#userClip)");

    centerGroup.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", this.imageSize / 2 + 2)
      .style("fill", "transparent")
      .style("stroke", "rgba(0,0,0,0.2)");

    const clusters = Object.keys(this.paintCluster[this.clusterId].clusters);

    // position the cluster evenly in a circle around the centroid
    const radius = this.height / 4;
    const theta = 2 * Math.PI / clusters.length;

    // calc cluster positions
    const clusterPos = {};

    // get min and max number of nodes in cluster
    let max = 0;
    let min = Number.MAX_VALUE;

    // get min and max number of edges between cluster
    let eMax = 0;
    let eMin = Number.MAX_VALUE;
    const edgeList = [];

    clusters.forEach((cluster, i) => {
      if (clusterCounts[cluster] > max) {
        max = clusterCounts[cluster];
      }
      if (clusterCounts[cluster] < min) {
        min = clusterCounts[cluster];
      }
      clusterPos[cluster] =  [
        radius * Math.cos(i * theta),
        radius * Math.sin(i * theta),
      ];

      clusters.forEach((eCluster) => {
        const eCount = this.paintCluster[this.clusterId].clusters[cluster].edges[eCluster][0];
        if (eCount > eMax) {
          eMax = eCount;
        }
        if (eCount < eMin) {
          eMin = eCount;
        }
        if (cluster !== eCluster && cluster < eCluster) {
          edgeList.push([cluster, eCluster, eCount]);
        }
      });
    });
    const clusterScale = d3.scaleLinear().domain([min, max]).range([20, 40]);
    const edgeScale = d3.scaleLinear().domain([eMin, eMax]).range([1, 20]);

    // draw edges
    centerGroup.selectAll("line").data(edgeList).enter().append("line")
      .attr("x1", (d) => clusterPos[d[0]][0])
      .attr("x2", (d) => clusterPos[d[1]][0])
      .attr("y1", (d) => clusterPos[d[0]][1])
      .attr("y2", (d) => clusterPos[d[1]][1])
      .style("stroke", "rgba(0,0,0,0.3)")
      .style("stroke-width", (d) => edgeScale(d[2]));

    // draw cluster circles
    const clusterGroups = centerGroup.selectAll("g").data(clusters).enter()
      .append("g")
        .attr("transform", (d) => `translate(${clusterPos[d].join(",")})`);

    clusterGroups.append("circle")
      .style("fill", (d) => this.paintCluster[this.clusterId].clusters[d].color)
      .style("stroke", "none")
      .attr("r", (d) => clusterScale(clusterCounts[d]));

    clusterGroups.append("text")
      .attr("transform", (d) => `translate(0,${clusterScale(clusterCounts[d]) + 15})`)
      .attr("text-anchor", "middle")
      .text((d) => this.paintCluster[this.clusterId].clusters[d].name);

    clusterGroups.on("click", (d) => {
      this.buildLevel1(d);
    });

    // Create the legend
    // TODO: Move legend to lower right
    const legendWidth = clusterScale(max) * 2;
    const legend = this.svg.append("g")
      .attr("transform", "translate(20,20)");

    let legendY = 20;

    legend.append("text")
      .text("Number of connections:")
      .attr("transform", "translate(0,0)");

    legend.append("line")
      .style("stroke", "black")
      .style("stroke-width", edgeScale(eMin))
      .attr("x1", 0)
      .attr("x2", legendWidth)
      .attr("y1", legendY)
      .attr("y2", legendY);

    legend.append("text")
      .attr("dy", 5)
      .style("font-size", 10)
      .text(eMin)
      .attr("transform", `translate(${legendWidth + 5}, ${legendY})`);

    legendY += 20;
    legend.append("line")
      .style("stroke", "black")
      .style("stroke-width", edgeScale(eMax))
      .attr("x1", 0)
      .attr("x2", legendWidth)
      .attr("y1", legendY)
      .attr("y2", legendY);

    legend.append("text")
      .text(eMax)
      .attr("dy", 5)
      .style("font-size", 10)
      .attr("transform", `translate(${legendWidth + 5}, ${legendY})`);

    legendY += 40;

    legend.append("text")
      .text("Number of Users:")
      .attr("transform", `translate(0,${legendY})`);

    legend.append("circle")
      .attr("transform", `translate(0,${legendY})`)
      .style("fill", "black")
      .attr("r", clusterScale(min))
      .attr("cx", legendWidth / 2)
      .attr("cy", legendWidth / 2);

    legend.append("text")
      .attr("dy", legendWidth / 2 + 5)
      .style("font-size", 10)
      .text(min)
      .attr("transform", `translate(${legendWidth + 5}, ${legendY})`);

    legendY += 25 + clusterScale(min) * 2;
    legend.append("circle")
      .attr("transform", `translate(0,${legendY})`)
      .style("fill", "black")
      .attr("r", clusterScale(max))
      .attr("cx", legendWidth / 2)
      .attr("cy", legendWidth / 2);

    legend.append("text")
      .text(max)
      .attr("dy", legendWidth / 2 + 5)
      .style("font-size", 10)
      .attr("transform", `translate(${legendWidth + 5}, ${legendY})`);
  }

  public buildLevel1(detailId: number) {
    this.svg.selectAll("*").remove();
    this.edgeToggle.classed("invisible", false);
    this.edgeToggle.classed("active", false);
    this.showEdges = false;
    this.proxyToggle.classed("invisible", false);
    this.proxyToggle.classed("active", false);
    this.showProxies = false;

    this.outerSvg.on("click", () => {
      if (this.level > 0) {
        const x = d3.event.pageX;
        const y = d3.event.pageY;
        const hit = this.hitTest(x, y);

        if (hit && hit[1] !== "cluster") {
          let color = "#555555";
          if ("color" in hit) {
            color = hit.color;
          }
          this.tooltip(
            hit,
            hit.x * this.canvasTransform.k + this.canvasTransform.x,
            hit.y * this.canvasTransform.k + this.canvasTransform.y,
            color,
            [],
          );
        } else {
          this.container.selectAll("#tooltip").remove();
        }
      }
    });

    // Reset zoom
    this.outerSvg.call(this.zoomObj.transform, d3.zoomIdentity);
    this.level = 1;

    this.graph = {
      links: [],
      nodeMap: {},
      nodes: [],
      proxieLinks: [],
    };

    const clusterMap = {};
    let emptyCluster = 0;
    const clusters = Object.keys(this.paintCluster[this.clusterId].clusters);
    clusters.forEach((cluster) => {
      if (cluster.toString() === detailId.toString() ||
          this.paintCluster[this.clusterId].clusters[cluster].edges[cluster][0] === 0) {
        emptyCluster += 1;
      }
    });

    const theta = 2 * Math.PI / (clusters.length - emptyCluster);

    let radius = this.height;
    if (radius > this.width) {
        radius = this.width;
    }
    radius = radius / 2 - 70;
    let rScaleMax = 0;

    this.paintNodes.forEach((node) => {
      if (node[6][this.clusterId][0].toString() === detailId.toString()) {
        if (node[13][this.clusterId][detailId][0] > rScaleMax) {
          rScaleMax = node[13][this.clusterId][detailId][0];
        }

        if (node[14] !== undefined && node[14] !== null) {
          const img = document.createElement("img");
          img.onerror = (event: any) => {
            event.path[0].src = "../assets/images/twitter_default_profile_normal.png";
          };
          img.onload = (event: any) => {
            node.imageLoad = true;
          };
          img.width = this.imageSize;
          img.height = this.imageSize;
          node.imageLoad = false;
          node.image = img;
          img.src = node[14];
        }

        this.graph.nodes.push(node);
        this.graph.nodeMap[node[0]] = this.graph.nodes.length - 1;
      }
    });

    const idOffset = 1000000000;

    let ci = 0;
    clusters.forEach((cluster) => {
      if (cluster.toString() !== detailId.toString()
        && this.paintCluster[this.clusterId].clusters[cluster].edges[cluster][0] > 0) {

        const clusterTempId = idOffset + parseInt(cluster.toString(), 10);
        this.graph.nodes.push({
            0: clusterTempId,
            1: "cluster",
            2: this.paintCluster[this.clusterId].clusters[cluster].name,
            color: this.paintCluster[this.clusterId].clusters[cluster].color,
            fixed: true,
            fx: radius * Math.cos(ci * theta) + this.width / 2,
            fy: radius * Math.sin(ci * theta) + this.height / 2,
            r: 20,
        });
        clusterMap[cluster] = clusterTempId;
        this.graph.nodeMap[clusterTempId] = this.graph.nodes.length - 1;
        ci += 1;
      }
    });

    console.log(this.paintNodes, this.paintEdges);

    const clusterEdgeMap = {};
    this.paintEdges.forEach((edge) => {
      const sourceCluster = this.paintNodes[edge[0]][6][this.clusterId][0];
      const targetCluster = this.paintNodes[edge[1]][6][this.clusterId][0];

      // The radi in this vis are also taken from the wrong numbers !!!!
      // TODO: The numbers in the cluster links are likely calculated including the proxies,
      // turn into array one number for proxie one for not!!!

      if (sourceCluster.toString() === detailId.toString() &&
          targetCluster.toString() === detailId.toString()) {

        if (edge[2] >= 1) {
          this.graph.links.push({
            source: edge[0],
            target: edge[1],
          });
        } else {
          this.graph.proxieLinks.push({
            source: this.graph.nodeMap[edge[0]],
            target: this.graph.nodeMap[edge[1]],
          });
        }

      } else if (sourceCluster.toString() === detailId.toString() ||
          targetCluster.toString() === detailId.toString()) {

        let foreignId = edge[1];
        let nodeId = edge[0];
        if (targetCluster.toString() === detailId.toString()) {
          foreignId = edge[0];
          nodeId = edge[1];
        }

        const foreignMappedIndex = clusterMap[this.paintNodes[foreignId][6][this.clusterId][0]];
        const edgeIndex = `${nodeId}-${foreignMappedIndex}`;

        if (edge[2] >= 1) {
          if (!(edgeIndex in clusterEdgeMap)) {
              clusterEdgeMap[edgeIndex] = 1;
              this.graph.links.push({
                source: nodeId,
                target: foreignMappedIndex,
              });
          } else {
              clusterEdgeMap[edgeIndex] += 1;
          }
        } else {
          if (!(edgeIndex in clusterEdgeMap)) {
            clusterEdgeMap[edgeIndex] = 1;
            this.graph.proxieLinks.push({
              source: this.graph.nodeMap[nodeId],
              target: this.graph.nodeMap[foreignMappedIndex],
            });
          } else {
              clusterEdgeMap[edgeIndex] += 1;
          }
        }
      }
    });

    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d) => d[0]))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("collide", d3.forceCollide().radius((d) => d.r + 20).iterations(2))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2 + 20));

    const rScale = d3.scaleLinear().range([5, this.imageSize / 4]).domain([1, rScaleMax]);

    this.graph.nodes.forEach((node) => {
      let r = 20;
      if (13 in node) {
        r = rScale(node[13][this.clusterId][detailId][0]);
      }
      node.r = r;
    });

    const ticked = () => {
      this.paint();
    };

    simulation
      .nodes(this.graph.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(this.graph.links);
  }

  // TODO: Add debouncer
  public paint() {
    if (this.level === 1) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.width * 2, this.height * 2);
      this.ctx.translate(this.canvasTransform.x * 2, this.canvasTransform.y * 2);
      this.ctx.scale(this.canvasTransform.k, this.canvasTransform.k);

      if (this.showEdges) {
        this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
        this.graph.links.forEach((link) => {
          this.positionLink(link, true);
        });
        if (this.showProxies) {
          this.graph.proxieLinks.forEach((link) => {
            this.positionLink({
              source: this.graph.nodes[link.source],
              target: this.graph.nodes[link.target],
            }, true);
          });
        }
      }

      this.graph.nodes.forEach((node) => {
        this.ctx.fillStyle = "#000000";
        if ("image" in node && node.imageLoad && node.image.complete) {

          this.ctx.beginPath();
          this.ctx.arc(
            node.x * 2,
            node.y * 2,
            node.r * 2 + 1,
            0,
            2 * Math.PI,
          );
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(
            node.x * 2,
            node.y * 2,
            node.r * 2,
            0,
            2 * Math.PI,
          );
          this.ctx.closePath();
          this.ctx.clip();
          this.ctx.drawImage(
            node.image,
            node.x * 2 - node.r * 2,
            node.y * 2 - node.r * 2,
            node.r * 4,
            node.r * 4,
          );
          this.ctx.restore();
        } else {
          if ("color" in node) {
            this.ctx.fillStyle = node.color;
          }
          this.ctx.beginPath();
          this.ctx.arc(
            node.x * 2,
            node.y * 2,
            node.r * 2,
            0,
            2 * Math.PI,
          );
          this.ctx.closePath();
          this.ctx.fill();
        }
      });
      this.ctx.restore();
    } else if (this.level === 2) {
      // Draw an individual user's network
    }
  }

  public update(data: any) {
    this.outerSvg
      .attr("width", this.width)
      .attr("height", this.height);

    this.edgeToggle
      .attr("transform", `translate(${this.width - 73}, 67)`);

    this.proxyToggle
      .attr("transform", `translate(${this.width - 73}, 127)`);

    this.canvas
      .style("width", this.width + "px")
      .style("height", this.height + "px")
      .attr("width", this.width * 2)
      .attr("height", this.height * 2);

    this.svg.selectAll(".centerGroup")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);
  }

  // TODO: Move to utils
  public circlePath(x: number, y: number, r: number, direction: boolean): string {
    return `M${x},${y} \
     m${-r}, 0 \
     a${r},${r} 0 ${(direction) ? "0" : "1"},${(direction) ? "1" : "0"} ${r * 2},0 \
     a${r},${r} 0 ${(direction) ? "0" : "1"},${(direction) ? "1" : "0"} ${-r * 2},0Z`;
  }

  public positionLink(d, draw = false): any {
    const offset = Math.sqrt(Math.pow(d.source.x - d.target.x, 2) + Math.pow(d.source.y - d.target.y, 2)) / 10;

    const midpointX = (d.source.x + d.target.x) / 2;
    const midpointY = (d.source.y + d.target.y) / 2;

    const dx = (d.target.x - d.source.x);
    const dy = (d.target.y - d.source.y);

    const normalise = Math.sqrt((dx * dx) + (dy * dy));

    const offSetX = midpointX + offset * (dy / normalise);
    const offSetY = midpointY - offset * (dx / normalise);

    if (draw) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        d.source.x * 2,
        d.source.y * 2,
      );
      this.ctx.bezierCurveTo(
        offSetX * 2,
        offSetY * 2,
        offSetX * 2,
        offSetY * 2,
        d.target.x * 2,
        d.target.y * 2,
      );
      this.ctx.stroke();
    } else {
      return `M${d.source.x}, ${d.source.y}S${offSetX}, ${offSetY} ${d.target.x}, ${d.target.y}`;
    }
  }

}

export { ClusterVis };
