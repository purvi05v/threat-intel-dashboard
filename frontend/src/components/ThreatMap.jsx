import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ThreatMap = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return;

    const width = 800;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "#0f172a")
      .style("border-radius", "8px");
    
    svg.selectAll("*").remove();
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));
    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => d.type === 'Actor' ? 14 : 10)
      .attr("fill", d => {
        if (d.risk >= 90) return "#ef4444"; 
        if (d.type === 'Actor') return "#a855f7"; 
        return "#3b82f6";
      })
      .style("cursor", "pointer") 
      .on("click", (event, d) => {
        if (data.onNodeClick) {
          data.onNodeClick(d); 
        }
      })
      .call(drag(simulation));
    const labels = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text(d => d.id)
      .attr("font-size", "12px")
      .attr("fill", "#f8fafc")
      .attr("dx", 15)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });
    function drag(sim) {
      return d3.drag()
        .on("start", (event) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) sim.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }
  }, [data]);

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef} style={{ width: '100%', maxWidth: '800px', height: '600px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} />
    </div>
  );
};

export default ThreatMap;