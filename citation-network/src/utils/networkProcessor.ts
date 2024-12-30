// src/utils/networkProcessor.ts
import { NetworkData, NetworkNode, NetworkLink, Paper } from '@/types';

export class NetworkProcessor {
  // Convert paper data into network format
  static processNetworkData(papers: Paper[]): NetworkData {
    const nodes: NetworkNode[] = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      radius: this.calculateNodeRadius(paper.citations),
      x: undefined,
      y: undefined
    }));

    const links: NetworkLink[] = [];
    papers.forEach(paper => {
      paper.references.forEach(refId => {
        if (papers.find(p => p.id === refId)) {
          links.push({
            source: paper.id,
            target: refId,
            strength: this.calculateLinkStrength(paper)
          });
        }
      });
    });

    return { nodes, links };
  }

  // Calculate node size based on citations
  private static calculateNodeRadius(citations: number): number {
    const minRadius = 5;
    const maxRadius = 20;
    const scaleFactor = 2;
    return Math.min(
      maxRadius,
      minRadius + Math.log(citations + 1) * scaleFactor
    );
  }

  // Calculate link strength based on various factors
  private static calculateLinkStrength(paper: Paper): number {
    const baseLinkStrength = 1;
    const citationFactor = Math.log(paper.citations + 1) * 0.1;
    return baseLinkStrength + citationFactor;
  }

  // Layout algorithms
  static applyCircularLayout(data: NetworkData): NetworkData {
    const radius = 200;
    const centerX = 400;
    const centerY = 300;
    
    const nodes = data.nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / data.nodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return { nodes, links: data.links };
  }

  static applyHierarchicalLayout(data: NetworkData): NetworkData {
    const levels = this.findHierarchicalLevels(data);
    const levelHeight = 100;
    const centerX = 400;

    const nodes = data.nodes.map(node => {
      const level = levels.get(node.id) || 0;
      const nodesInLevel = Array.from(levels.entries())
        .filter(([_, l]) => l === level).length;
      const indexInLevel = Array.from(levels.entries())
        .filter(([_, l]) => l === level)
        .findIndex(([id, _]) => id === node.id);
      
      return {
        ...node,
        x: centerX + (indexInLevel - nodesInLevel / 2) * 100,
        y: level * levelHeight + 50
      };
    });

    return { nodes, links: data.links };
  }

  // Helper method to find hierarchical levels
  private static findHierarchicalLevels(data: NetworkData): Map<string, number> {
    const levels = new Map<string, number>();
    
    // Find root nodes (nodes with no incoming edges)
    const rootNodes = data.nodes.filter(node => 
      !data.links.some(link => link.target === node.id)
    );
    
    // Assign levels through BFS
    const queue = rootNodes.map(node => ({ id: node.id, level: 0 }));
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (levels.has(current.id)) continue;
      
      levels.set(current.id, current.level);
      
      // Add children to queue
      data.links
        .filter(link => link.source === current.id)
        .forEach(link => {
          queue.push({
            id: typeof link.target === 'string' ? link.target : (link.target as NetworkNode).id,
            level: current.level + 1
          });
        });
    }
    
    return levels;
  }

  // Force-directed layout parameters
  static getForceParameters(data: NetworkData) {
    return {
      linkDistance: 100,
      charge: -300,
      gravity: 0.1,
      friction: 0.9
    };
  }
}