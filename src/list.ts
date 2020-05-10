import * as d3 from "d3";
import { Vis } from "./vis";

class ListVis extends Vis {
  public visType = "list";
  public listContainer;
  public helpData = [
    browser.i18n.getMessage("helpList_1"),
    browser.i18n.getMessage("helpList_2"),
    browser.i18n.getMessage("helpList_3"),
    browser.i18n.getMessage("helpList_4"),
    browser.i18n.getMessage("helpList_5"),
  ];

  public build(data: any, centralNode: any) {
    const clusterKeys = [];
    const clusterSort = [];
    const r = [];

    Object.keys(data.cluster[this.clusterId].clusters).forEach((cluster, ci) => {
      clusterSort.push({
        clusters: [],
        edit: true,
        id: cluster,
        info: data.cluster[this.clusterId].clusters[cluster],
        max: 0,
      });
      clusterKeys[cluster] = ci;
    });

    clusterSort.push({
      clusters: [],
      edit: false,
      info: { name: browser.i18n.getMessage("noCluster"), color: "#555555" },
    });

    data.nodes.forEach((node) => {
      if (node[6][this.clusterId][0] in clusterKeys) {
        if (clusterSort[clusterKeys[node[6][this.clusterId][0]]].max < node[10]) {
          clusterSort[clusterKeys[node[6][this.clusterId][0]]].max = node[10];
        }
        clusterSort[clusterKeys[node[6][this.clusterId][0]]].clusters.push(node);
      } else {
        clusterSort[clusterSort.length - 1].clusters.push(node);
      }
    });

    clusterSort.forEach((cluster) => {
      cluster.clusters.sort((a, b) => {
        return b[10] - a[10];
      });
      r.push(d3.scaleLinear().range([0, 12]).domain([0, cluster.max]));
    });

    this.container.selectAll("*").remove();

    // TODO: add a headline with centralNode in it...

    const legendText = browser.i18n.getMessage("visListLegend").split(";");

    this.container.append("div")
      .attr("id", "clusterList-legend")
      .html(`<div>
      <span><strong>${legendText[0]}:</strong></span>
      <span>${legendText[1]}</span>
      <span><img src="../assets/images/vis--legend--list--circle.png" \
      srcset="../assets/images/vis--legend--list--circle.png 1x, \
      ../assets/images/vis--legend--list--circle@2x.png 2x" ></span>
      <span>${legendText[2]}</span>
      <span class="clusterList-legend-divider"></span>
      <span><strong>${legendText[3]}</strong></span>
      <span><img src="../assets/images/vis--icon--hide.png" \
      srcset="../assets/images/vis--icon--hide.png 1x, \
      ../assets/images/vis--icon--hide@2x.png 2x" ></span>
      <span>${legendText[4]}</span>
      <span><img src="../assets/images/vis--icon--hidden.png" \
      srcset="../assets/images/vis--icon--hidden.png 1x, \
      ../assets/images/vis--icon--hidden@2x.png 2x" ></span>
    </div>`);

    this.listContainer = this.container.append("div")
      .attr("id", "clusterList-wrapper")
      .selectAll("div.clusterList-container")
        .data(clusterSort).enter().append("div")
        .attr("class", "clusterList-container");

    const title = this.listContainer.append("div")
      .attr("class", "clusterList-title")
      .html((d) => `<span><svg width="24" height="24">
  <circle cx="12" cy="12" r="12" style="fill:${d.info.color};" />
</svg></span>
<span><h2>${d.info.name}</h2></span>
<span><a
  style="display:${(d.edit) ? "inline-block" : "none"};"
  class="clusterList-editButton"><img src="../assets/images/vis--icon--edit.png" \
  srcset="../assets/images/vis--icon--edit.png 1x, \
  ../assets/images/vis--icon--edit@2x.png 2x" ></a></span>\
  <span><a
  style="display:${(d.edit) ? "inline-block" : "none"};"
  class="clusterList-hideButton">\
  <img src="../assets/images/vis--icon--${(d.info.modified) ? "hide" : "hidden"}.png" \
  srcset="../assets/images/vis--icon--${(d.info.modified) ? "hide" : "hidden"}.png 1x, \
  ../assets/images/vis--icon--${(d.info.modified) ? "hide" : "hidden"}@2x.png 2x" >\
  </a></span>`);

    title.select(".clusterList-editButton")
      .on("click", (d) => {
        this.editCluster(d, centralNode);
      });

    title.select(".clusterList-hideButton")
      .on("click", (d) => {
        this.hideCluster(d, centralNode);
      });

    const item = this.listContainer.append("ul")
      .style("fill", (d) => d.info.color)
      .selectAll("li").data((d) => d.clusters).enter().append("li");

    item.append("span").append("svg")
      .attr("width", 24)
      .attr("height", 24)
      .style("display", (d) => (clusterKeys[d[6][this.clusterId][0]] in r) ? null : "none")
      .append("circle")
        .attr("cx", 12)
        .attr("cy", 12)
        .attr("r", (d) => {
          if (clusterKeys[d[6][this.clusterId][0]] in r) {
            return r[clusterKeys[d[6][this.clusterId][0]]](d[10]);
          }
          return 0;
        });

    item.append("span").append("img")
      .on("error", (d, i, a) => {
        d3.select(a[i]).attr("src", "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png");
      })
      .attr("src", (d) => d[14]);
    
    item.append("span")
      .attr("class", "actionContainer")
      // TODO: profile generator function in the service module
      .html((d) => `<span class="username">${d[15]}</span><br /><span class="actions"><a href="vis.html?view=cluster&nUuid=${this.stateManager.urlState.nUuid}&subView=level2&subViewId=${d[0]}">${browser.i18n.getMessage("visListUserNetwork")}&nbsp;&raquo;</a><br /><a href="https://www.twitter.com/${d[1]}">${browser.i18n.getMessage("visListUserSocialProfile")}&nbsp;&raquo;</a></span>`);

    this.container.append("div")
    .attr("id", "clusterList-search")
    .append("input")
      .attr("id", "clusterList-search-field")
      .attr("type", "text")
      .attr("placeholder", "Search for Username")
      .on("input", () => {
        const searchWord = d3.select("#clusterList-search-field").property("value").toLowerCase();
        if (searchWord.length === 0) {
          item.style("display", null);
        } else {
          item.style("display", (d) => {
            if (d[15].toLowerCase().indexOf(searchWord) >= 0) {
              return null;
            } else {
              return "none";
            }
          });
        }
      });
  }

}

export { ListVis };
