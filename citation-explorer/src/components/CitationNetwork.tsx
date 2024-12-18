import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Define TypeScript interfaces for our data structures
interface Paper {
  id: string;
  title: string;
  citations: number;
  year: number;
}

interface Citation {
  source: string;
  target: string;
}

interface NetworkData {
  nodes: Paper[];
  links: Citation[];
}

const CitationNetwork = ({ data }: { data: NetworkData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up the SVG container
    const width = 800;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "border rounded-lg");

    // Create a force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create the links (citations)
    const links = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    // Create the nodes (papers)
    const nodes = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => Math.sqrt(d.citations) * 2 + 5) // Size based on citation count
      .attr("fill", d => d3.interpolateBlues(d.year / 2024)) // Color based on year
      .call(drag(simulation) as any);

    // Add titles on hover
    nodes.append("title")
      .text(d => d.title);

    // Handle node click events
    nodes.on("click", (event, d) => {
      setSelectedPaper(d);
    });

    // Update positions on each simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      nodes
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    // Enable dragging behavior
    function drag(simulation: d3.Simulation<any, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, [data]);

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      {selectedPaper && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold">{selectedPaper.title}</h3>
          <p>Citations: {selectedPaper.citations}</p>
          <p>Year: {selectedPaper.year}</p>
        </div>
      )}
    </div>
  );
};

export default CitationNetwork;