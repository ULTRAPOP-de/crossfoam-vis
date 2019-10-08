import * as d3 from "d3";
import { Vis } from "./vis";

class ClusterVis extends Vis {
  public visType = "cluster";
  public svg;
  public nodes;
  public edges = [];
  public labels = [];
  public node;
  public edge;
  public label;

  public helpData = [
  ];

  public build(data: any, centralNode: any) {

    this.svg = this.container.append("svg");

    this.update(null);

    let maxEdge = 0;
    let maxNodeSize = 0;

    this.nodes = Object.keys(data.cluster[this.clusterId].clusters).map((cluster) => {
      const clusterData = data.cluster[this.clusterId].clusters[cluster];

      let nodeSize = 0;

      Object.keys(clusterData.edges).forEach((edgeId) => {
        const edge = clusterData.edges[edgeId];
        if (edgeId === cluster) {
          if (nodeSize > maxNodeSize) {
            maxNodeSize = nodeSize;
          }
          nodeSize = edge[1];
        } else {
          if (edge[1] > maxEdge) {
            maxEdge = edge[1];
          }

          this.edges.push({
            source: cluster,
            target: edgeId,
            value: edge[1],
          });
        }
      });

      return {
        color: clusterData.color,
        id: cluster,
        name: clusterData.name,
        size: nodeSize,
      };
    });

    const labels = {
      links: [],
      nodes: [],
    };

    this.nodes.forEach((d, i) => {
      labels.nodes.push({node: d});
      labels.nodes.push({node: d});
      labels.links.push({
          source: i * 2,
          target: i * 2 + 1,
      });
    });

    const rScale = d3.scaleLinear().range([0, 50]).domain([0, maxNodeSize]);
    const sScale = d3.scaleLinear().range([0, 10]).domain([0, maxEdge]);

    const simulation = d3.forceSimulation(this.nodes)
      .force("charge", d3.forceManyBody())
      .force("link", d3.forceLink(this.edges).id((d) => d.id).distance(200))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("charge", d3.forceCollide().radius((d) => rScale(d.size)));

    const labelSimulation = d3.forceSimulation(labels.nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("link", d3.forceLink(labels.links).distance(55).strength(2));

    this.edge = this.svg.append("g").attr("class", "links")
      .selectAll("line")
      .data(this.edges)
      .enter()
      .append("line")
      .attr("stroke", "#aaa")
      .attr("stroke-width", (d) => sScale(d.value));

    this.node = this.svg.append("g").attr("class", "nodes")
      .selectAll("g")
      .data(this.nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => rScale(d.size))
      .attr("fill", (d) => d.color);

    this.label = this.svg.append("g").attr("class", "labelNodes")
      .selectAll("text")
      .data(labels.nodes)
      .enter()
      .append("text")
      .text((d, i) => (i % 2 === 0) ? "" : d.node.name)
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 12)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      this.edge
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      this.node
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      labelSimulation.alphaTarget(0.3).restart();

      this.label.each((d, i, a) => {
          if (i % 2 === 0) {
              d.x = d.node.x;
              d.y = d.node.y;
          } else {
              const b = d3.select(a[i]).node().getBBox();

              const diffX = d.x - d.node.x;
              const diffY = d.y - d.node.y;

              const dist = Math.sqrt(diffX * diffX + diffY * diffY);

              let shiftX = b.width * (diffX - dist) / (dist * 2);
              shiftX = Math.max(-b.width, Math.min(0, shiftX));
              const shiftY = 16;
              d3.select(a[i]).attr("transform", "translate(" + shiftX + "," + shiftY + ")");
          }
      });

      this.label.attr("transform", (d) => `translate(${d.x},${d.y})`);

    });
  }

  public fixna(x) {
    if (isFinite(x)) {
      return x;
    } else {
      return 0;
    }
  }

  public update(data: any) {
    this.svg
      .attr("width", this.width)
      .attr("height", this.height);
  }

}

export { ClusterVis };
