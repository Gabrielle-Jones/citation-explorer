// src/components/network/TimelineNetwork.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent } from '@/components/ui/card';

interface CustomNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  year: number;
  citations: number;
  authors: { name: string }[];
  abstract?: string;
  radius: number;
}

interface TimelineNetworkProps {
  data: {
    nodes: CustomNode[];
    links: { source: string; target: string; strength: number }[];
  };
  onNodeSelect?: (node: CustomNode) => void;
}

export const TimelineNetwork: React.FC<TimelineNetworkProps> = ({ 
  data,
  onNodeSelect 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create scales
    const years = data.nodes.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    const xScale = d3.scaleLinear()
      .domain([minYear - 1, maxYear + 1])
      .range([margin.left, width - margin.right]);

    // Create timeline axis
    const timelineAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d}`);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(timelineAxis);

    // Add timeline label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Year");

    // Create node map and process links
    const nodeMap = new Map(data.nodes.map(node => [node.id, { ...node }]));
    const links = data.links.map(link => ({
      source: nodeMap.get(link.source)!,
      target: nodeMap.get(link.target)!,
      strength: link.strength
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .strength(0.1))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("x", d3.forceX().x(d => xScale((d as CustomNode).year)).strength(1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(d => (d as CustomNode).radius + 5));

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
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength || 1));

    // Create nodes
    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d as CustomNode);
        if (onNodeSelect) onNodeSelect(d as CustomNode);
      });

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels
    node.append("text")
      .text(d => d.title)
      .attr("x", 0)
      .attr("y", d => d.radius + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .style("pointer-events", "none");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, onNodeSelect]);

  return (
    <div className="space-y-4">
      <div className="w-full h-[600px] bg-white rounded-lg shadow">
        <svg
          ref={svgRef}
          className="w-full h-full"
        />
      </div>

      {selectedNode && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg mb-2">{selectedNode.title}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {selectedNode.authors.map(a => a.name).join(', ')} ({selectedNode.year})
            </p>
            {selectedNode.abstract && (
              <p className="text-sm mt-2">{selectedNode.abstract}</p>
            )}
            <p className="text-sm text-blue-600 mt-2">
              Citations: {selectedNode.citations}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};