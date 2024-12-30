// src/components/network/CitationNetwork.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Extended SimulationNodeDatum to include our custom properties
interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  radius?: number;
  citations?: number;
}

// Define our link type that extends SimulationLinkDatum
interface CustomLink extends d3.SimulationLinkDatum<CustomNode> {
  strength?: number;
}

interface CitationNetworkProps {
  data: {
    nodes: CustomNode[];
    links: CustomLink[];
  };
}

export const CitationNetwork: React.FC<CitationNetworkProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create node map for link references
    const nodeMap = new Map(data.nodes.map(node => [node.id, node]));

    // Process links to use node objects
    const processedLinks = data.links
      .filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
        return sourceId && targetId && nodeMap.has(sourceId) && nodeMap.has(targetId);
      })
      .map(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
        return {
          source: nodeMap.get(sourceId!)!,
          target: nodeMap.get(targetId!)!,
          strength: link.strength || 1
        };
      });

    // Create force simulation with properly typed nodes
    const simulation = d3.forceSimulation<CustomNode>()
      .nodes(data.nodes)
      .force("link", d3.forceLink<CustomNode, CustomLink>(processedLinks)
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody<CustomNode>().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<CustomNode>().radius(d => (d.radius || 20) + 5));

    // Create container group with zoom
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = g.append("g")
      .selectAll<SVGLineElement, CustomLink>("line")
      .data(processedLinks)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength || 1));

    // Create nodes
    const node = g.append("g")
      .selectAll<SVGGElement, CustomNode>("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation));

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.radius || 20)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels
    node.append("text")
      .text(d => d.title)
      .attr("x", 0)
      .attr("y", d => (d.radius || 20) + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as CustomNode).x || 0)
        .attr("y1", d => (d.source as CustomNode).y || 0)
        .attr("x2", d => (d.target as CustomNode).x || 0)
        .attr("y2", d => (d.target as CustomNode).y || 0);

      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<CustomNode, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, CustomNode, CustomNode>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, CustomNode, CustomNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, CustomNode, CustomNode>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGGElement, CustomNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: "600px" }}
      />
    </div>
  );
};