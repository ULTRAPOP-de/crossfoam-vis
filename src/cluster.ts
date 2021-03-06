import { event as d3event, extent,
  forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation,
  min as d3min, scaleLinear, selectAll, zoom, zoomIdentity } from "d3";
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
  public showUserEdges = false;
  public outerSvg;
  public edgeScale;
  public edgeProxyScale;
  public eMin;
  public eMax;
  public ePMin;
  public ePMax;
  public level = 0;
  public graph = {
    links: [],
    nodeMap: {},
    nodes: [],
    proxieLinks: [],
    userLinks: [],
    userProxyLinks: [],
  };
  public zoomObj;
  public edgeToggle;
  public proxyToggle;
  public simulation = null;

  public helpData = [
    browser.i18n.getMessage("helpCluster_1"),
    browser.i18n.getMessage("helpCluster_2"),
    browser.i18n.getMessage("helpCluster_3"),
    browser.i18n.getMessage("helpCluster_4"),
  ];

  constructor(stateManager: any) {
    super(stateManager);
    this.asyncGetIxState();
  }

  public zoom(_this) {
    this.container.selectAll("#tooltip").remove();
    _this.canvasTransform = d3event.transform;
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

  public updateView() {
    if (!("subView" in this.stateManager.urlState)) {
      this.stateManager.urlState.subView = "level0";
      this.stateManager.urlState.subViewId = 0;
      this.stateManager.update();
    } else if (this.stateManager.urlState.subView === "level0") {
      this.buildLevel0();
    } else if (this.stateManager.urlState.subView === "level1") {
      this.buildLevel1(parseInt(this.stateManager.urlState.subViewId, 10));
    } else if (this.stateManager.urlState.subView === "level2") {
      this.buildLevel2(parseInt(this.stateManager.urlState.subViewId, 10));
    }
  }

  public build(data: any, centralNode: any) {
    this.paintCluster = data.cluster;
    this.paintNodes = data.nodes;
    this.paintEdges = data.edges;
    this.paintCentralNode = centralNode;

    this.canvas = this.container.append("canvas");
    this.ctx = this.canvas.node().getContext("2d");

    this.zoomObj = zoom()
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
        this.showEdges = !this.showEdges;
        if (this.showEdges) {
          this.showUserEdges = false;
        }
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
        this.showProxies = !this.showProxies;
        if (this.showProxies) {
          this.showEdges = true;
        }
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

    this.updateView();
  }

  public buildLevel0() {
    this.resetCluster();
    this.showEdges = true;
    this.showProxies = false;
    this.level = 0;

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
    this.eMax = 0;
    this.eMin = Number.MAX_VALUE;
    this.ePMax = 0;
    this.ePMin = Number.MAX_VALUE;
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
        if (eCluster in this.paintCluster[this.clusterId].clusters[cluster].edges &&
            cluster !== eCluster &&
            cluster < eCluster) {

          const eCount = this.paintCluster[this.clusterId].clusters[cluster].edges[eCluster][0];
          if (eCount > this.eMax) {
            this.eMax = eCount;
          }
          if (eCount < this.eMin) {
            this.eMin = eCount;
          }

          const ePCount = this.paintCluster[this.clusterId].clusters[cluster].edges[eCluster][1] + eCount;
          if (ePCount > this.ePMax) {
            this.ePMax = ePCount;
          }
          if (ePCount < this.ePMin) {
            this.ePMin = ePCount;
          }

          edgeList.push([cluster, eCluster, eCount, ePCount]);
        }
      });
    });

    const clusterScale = scaleLinear().domain([1, max]).range([5, 40]);
    this.edgeScale = scaleLinear().domain([0, this.eMax]).range([0, 20]);
    this.edgeProxyScale = scaleLinear().domain([0, this.ePMax]).range([0, 20]);

    // draw edges
    centerGroup.selectAll("line").data(edgeList).enter().append("line")
      .attr("x1", (d) => clusterPos[d[0]][0])
      .attr("x2", (d) => clusterPos[d[1]][0])
      .attr("y1", (d) => clusterPos[d[0]][1])
      .attr("y2", (d) => clusterPos[d[1]][1])
      .style("stroke", "rgba(0,0,0,0.3)");

    // draw cluster circles
    const clusterGroups = centerGroup.selectAll("g").data(clusters).enter()
      .append("g")
        .attr("class", "cluster-vis-entry")
        .attr("transform", (d) => `translate(${clusterPos[d].join(",")})`);

    clusterGroups.append("circle")
      .style("fill", (d) => this.paintCluster[this.clusterId].clusters[d].color)
      .attr("r", (d) => clusterScale(clusterCounts[d]));

    const clusterText = clusterGroups.append("text")
      .attr("transform", (d) => `translate(0,${clusterScale(clusterCounts[d]) + 15})`);

    clusterText.append("tspan")
      .attr("x", 0)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .text((d) => this.paintCluster[this.clusterId].clusters[d].name);

    clusterText.append("tspan")
      .attr("x", 0)
      .attr("dy", 15)
      .attr("text-anchor", "middle")
      .text((d) => `(${clusterCounts[d]})`);

    clusterGroups.on("click", (d) => {
      this.setSubView("level1", d);
    });

    this.circleLegend(min, max, browser.i18n.getMessage("visLegendNumberOfUsers"));
    this.paint();
  }

  public setSubView(subView: string, subViewId: number) {
    this.stateManager.urlState.subView = subView;
    this.stateManager.urlState.subViewId = subViewId;

    this.stateManager.update();
  }

  public resetCluster() {
    this.svg.selectAll("*").remove();
    this.edgeToggle.classed("active", false);
    this.showEdges = false;
    this.proxyToggle.classed("active", false);
    this.showProxies = false;

    if (this.simulation !== null) {
      this.simulation.stop();
    }

    this.outerSvg.call(this.zoomObj.transform, zoomIdentity);

    this.graph = {
      links: [],
      nodeMap: {},
      nodes: [],
      proxieLinks: [],
      userLinks: [],
      userProxyLinks: [],
    };
  }

  public setupClick() {
    this.outerSvg.on("click", () => {
      if (this.level > 0) {
        const x = d3event.pageX;
        const y = d3event.pageY;
        const hit = this.hitTest(x, y);

        if (hit && hit[1] !== "cluster") {
          let color = "#555555";
          this.showUserEdges = true;
          this.showEdges = false;
          this.graph.userLinks = [];
          this.graph.userProxyLinks = [];
          this.graph.links.forEach((link) => {
            if (link.source[0] === hit[0] || link.target[0] === hit[0]) {
              this.graph.userLinks.push(link);
            }
          });
          this.graph.proxieLinks.forEach((link) => {
            if (link.source === hit.index || link.target === hit.index) {
              this.graph.userProxyLinks.push(link);
            }
          });

          if ("color" in hit) {
            color = hit.color;
          }
          this.tooltip(
            hit,
            hit.x * this.canvasTransform.k + this.canvasTransform.x,
            hit.y * this.canvasTransform.k + this.canvasTransform.y,
            color,
            [{
              callback: (d) => {
                this.container.selectAll("#tooltip").remove();
                this.setSubView("level2", d[0]);
              },
              label: "Show connections to this user &raquo;",
            }],
          );
          this.paint();
        } else {
          this.container.selectAll("#tooltip").remove();
        }
      }
    });
  }

  public setupSimulation(selector: (d: any) => number) {
    this.simulation = forceSimulation()
      .force("link", forceLink().id((d) => d[0]))
      .force("charge", forceManyBody().strength(-250)) // modify in order to reduce outlier rockets
      .force("collide", forceCollide().radius((d) => d.r + 20).iterations(2))
      .force("center", forceCenter(this.width / 2, this.height / 2 + 20));

    const rScale = scaleLinear().range([5, this.imageSize / 4]).domain(extent(this.graph.nodes, selector));

    this.graph.nodes.forEach((node) => {
      let r = 20;
      if (13 in node) {
        r = rScale(selector(node));
      }
      node.r = r;
    });

    const ticked = () => {
      this.paint();
    };

    this.simulation
      .nodes(this.graph.nodes)
      .on("tick", ticked);

    this.simulation.force("link")
      .links(this.graph.links);
  }

  public buildLevel1(detailId: number) {
    this.resetCluster();
    this.setupClick();

    this.level = 1;

    let min = Number.MAX_VALUE;
    let max = 0;

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

    this.paintNodes.forEach((node) => {
      if (node[6][this.clusterId][0].toString() === detailId.toString()) {
        if (node[13][this.clusterId][detailId][0] > max) {
          max = node[13][this.clusterId][detailId][0];
        }
        if (node[13][this.clusterId][detailId][0] < min) {
          min = node[13][this.clusterId][detailId][0];
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
            ci,
            color: this.paintCluster[this.clusterId].clusters[cluster].color,
            fixed: true,
            fx: radius * Math.cos(ci * theta) + this.width / 2,
            fy: radius * Math.sin(ci * theta) + this.height / 2,
            r: 20,
            theta,
        });
        clusterMap[cluster] = clusterTempId;
        this.graph.nodeMap[clusterTempId] = this.graph.nodes.length - 1;
        ci += 1;
      }
    });

    const clusterEdgeMap = {};
    this.paintEdges.forEach((edge) => {
      const sourceCluster = this.paintNodes[edge[0]][6][this.clusterId][0];
      const targetCluster = this.paintNodes[edge[1]][6][this.clusterId][0];

      if (sourceCluster.toString() === detailId.toString() &&
          targetCluster.toString() === detailId.toString()) {

        if (edge[2] >= 2) {
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

        if (edge[2] >= 2) {
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

    this.setupSimulation((d) => {
      if (13 in d) {
        return d[13][this.clusterId][detailId][0];
      }
      return this.graph.nodes.length;
    });

    this.circleLegend(min, max, browser.i18n.getMessage("visLegendNumberOfConnections"));
  }

  public buildLevel2(detailId: number) {
    this.resetCluster();
    this.setupClick();

    this.level = 2;

    let max = 0;

    this.paintEdges.forEach((edge) => {
      if (edge[0] === detailId || edge[1] === detailId) {
        [edge[0], edge[1]].forEach((nodeId) => {
          if (!(nodeId in this.graph.nodeMap)) {
            if (this.paintNodes[nodeId][14] !== undefined && this.paintNodes[nodeId][14] !== null) {
              const img = document.createElement("img");
              img.onerror = (event: any) => {
                event.path[0].src = "../assets/images/twitter_default_profile_normal.png";
              };
              img.onload = (event: any) => {
                this.paintNodes[nodeId].imageLoad = true;
              };
              img.width = this.imageSize;
              img.height = this.imageSize;
              this.paintNodes[nodeId].imageLoad = false;
              this.paintNodes[nodeId].image = img;
              img.src = this.paintNodes[nodeId][14];
            }
            this.paintNodes[nodeId].rUserCount = 0;
            this.paintNodes[nodeId].isCentral = false;
            if (nodeId === detailId) {
              this.paintNodes[nodeId].isCentral = true;
            }
            this.graph.nodes.push(this.paintNodes[nodeId]);
            this.graph.nodeMap[nodeId] = this.graph.nodes.length - 1;
          }
        });
      }
    });

    this.paintEdges.forEach((edge) => {
      if (edge[0] in this.graph.nodeMap && edge[1] in this.graph.nodeMap) {
        if (edge[2] >= 2) {
          this.graph.links.push({
            source: edge[0],
            target: edge[1],
          });
          [edge[0], edge[1]].forEach((nodeId) => {
            this.graph.nodes[this.graph.nodeMap[nodeId]].rUserCount += 1;
            if (this.graph.nodes[this.graph.nodeMap[nodeId]].rUserCount > max) {
              max = this.graph.nodes[this.graph.nodeMap[nodeId]].rUserCount;
            }
          });
        } else {
          this.graph.proxieLinks.push({
            source: this.graph.nodeMap[edge[0]],
            target: this.graph.nodeMap[edge[1]],
          });
        }
      }
    });

    this.setupSimulation((d) => d.rUserCount);
    this.circleLegend(d3min(this.graph.nodes, (d) => d.rUserCount), max, browser.i18n.getMessage("visLegendNumberOfConnections"));
  }

  // TODO: Add debouncer
  public paint() {
    if (this.showIxMessage) {
      this.ixMessage(browser.i18n.getMessage("visClusterIntro"));
    }

    this.ctx.clearRect(0, 0, this.width * 2, this.height * 2);

    if (this.showProxies) {
      this.proxyToggle.select("text")
        .html(browser.i18n.getMessage("visProxiesToggleOn"));
    } else {
      this.proxyToggle.select("text")
        .html(browser.i18n.getMessage("visProxiesToggleOff"));
    }
    this.proxyToggle.classed("active", this.showProxies);

    if (this.showEdges) {
      this.edgeToggle.select("text")
        .html(browser.i18n.getMessage("visClusterToggleOn"));
    } else {
      this.edgeToggle.select("text")
        .html(browser.i18n.getMessage("visClusterToggleOff"));
    }
    this.edgeToggle.classed("active", this.showEdges);

    if (this.level === 0) {
      if (!this.showEdges) {
        this.svg.selectAll(".centerGroup line")
          .style("opacity", 0);
      } else {
        if (!this.showProxies) {
          this.lineLegend(this.eMin, this.eMax);
        } else {
          this.lineLegend(this.ePMin, this.ePMax);
        }

        this.svg.selectAll(".centerGroup line")
          .style("opacity", 1)
          .style("stroke-width", (d) => {
            if (!this.showProxies) {
              return this.edgeScale(d[2]);
            } else {
              return this.edgeProxyScale(d[3]);
            }
          });
      }
    } else if (this.level >= 1) {
      selectAll("#line-legend").remove();

      this.ctx.save();
      this.ctx.translate(this.canvasTransform.x * 2, this.canvasTransform.y * 2);
      this.ctx.scale(this.canvasTransform.k, this.canvasTransform.k);

      this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
      if (this.showUserEdges) {
        this.graph.userLinks.forEach((link) => {
          this.positionLink(link, true);
        });
        if (this.showProxies) {
          this.graph.userProxyLinks.forEach((link) => {
            this.positionLink({
              source: this.graph.nodes[link.source],
              target: this.graph.nodes[link.target],
            }, true);
          });
        }
      } else if (this.showEdges) {
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

          let extraRadius = 1;
          if (this.level === 2) {
            extraRadius = 2;
            this.ctx.fillStyle = this.paintCluster[this.clusterId].clusters[node[6][this.clusterId][0]].color;
            if (node.isCentral) {
              extraRadius = 4;
            }
          }

          this.ctx.beginPath();
          this.ctx.arc(
            node.x * 2,
            node.y * 2,
            node.r * 2 + extraRadius,
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

    let radius = this.height;
    if (radius > this.width) {
        radius = this.width;
    }
    radius = radius / 2 - 70;

    if (this.simulation) {
      this.graph.nodes.forEach((node) => {
        if ("ci" in node) {
          node.fx = radius * Math.cos(node.ci * node.theta) + this.width / 2;
          node.fy = radius * Math.sin(node.ci * node.theta) + this.height / 2;
        }
      });

      this.simulation
        .force("center", forceCenter(this.width / 2, this.height / 2 + 20))
        .alpha(0)
        .restart();
    }
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
