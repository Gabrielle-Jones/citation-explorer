import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkData, Paper } from '@/types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, MousePointer, Move } from 'lucide-react';

interface CitationNetworkProps {
  data: NetworkData;
  onNodeSelect: (paper: Paper) => void;
}

export const CitationNetwork: React.FC<CitationNetworkProps> = ({
  data,
  onNodeSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG container with zoom support
    const svg = d3.select(svgRef.current);
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody()
        .strength(-200)
        .distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.radius + 10));

    // Create arrow markers for links
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Create links
    const links = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.strength))
      .attr("marker-end", "url(#arrow)");

    // Create nodes
    const nodes = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation) as any);

    // Add circles to nodes
    nodes.append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels to nodes
    nodes.append("text")
      .text((d) => d.title)
      .attr("x", 0)
      .attr("y", (d) => d.radius + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666");

    // Add hover effects
    nodes
      .on("mouseover", function(event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.radius * 1.2);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.radius);
      })
      .on("click", (event, d) => {
        if (tool === 'select') {
          onNodeSelect(d as any);
        }
      });

    // Update positions on each tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag behavior function
    function drag(simulation: any) {
      return d3.drag()
        .on("start", (event: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event: any) => {
          if (tool === 'pan') {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          }
        })
        .on("end", (event: any) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, tool]);

  const handleZoom = (direction: 'in' | 'out') => {
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svg.node() as any);
    const newScale = direction === 'in' ? currentTransform.k * 1.2 : currentTransform.k / 1.2;
    
    svg.transition()
      .duration(300)
      .call(
        (d3.zoom() as any).transform,
        d3.zoomIdentity.scale(newScale)
      );
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          variant={tool === 'select' ? 'default' : 'outline'}
          onClick={() => setTool('select')}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={tool === 'pan' ? 'default' : 'outline'}
          onClick={() => setTool('pan')}
        >
          <Move className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => handleZoom('in')}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => handleZoom('out')}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: "600px" }}
      />
    </div>
  );
};