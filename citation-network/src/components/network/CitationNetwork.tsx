import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NetworkData, Paper } from '@/types';

interface CitationNetworkProps {
  data: NetworkData;
  onNodeSelect: (paper: Paper) => void;
}

export const CitationNetwork: React.FC<CitationNetworkProps> = ({ data, onNodeSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create SVG elements
    const svg = d3.select(svgRef.current);

    const links = svg.selectAll("line")
      .data(data.links)
      .join("line")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6);

    const nodes = svg.selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => d.radius)
      .style("fill", "#69b3a2")
      .call(drag(simulation) as any);

    // Add titles
    nodes.append("title")
      .text(d => d.title);

    // Update positions
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });
  }, [data]);

  // Drag functionality
  const drag = (simulation: any) => {
    const dragstarted = (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: any) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: "600px" }}
    />
  );
};