// src/services/networkProcessor.ts
import { Paper, NetworkData, NetworkNode, NetworkLink } from '../types';

export class NetworkProcessor {
  static processNetwork(papers: Paper[]): NetworkData {
    // Create a map for quick paper lookups
    const paperMap = new Map<string, Paper>();
    papers.forEach(paper => paperMap.set(paper.id, paper));

    // Calculate importance scores using PageRank-like algorithm
    const importanceScores = this.calculateImportance(papers);

    // Identify research clusters using citation patterns
    const clusters = this.identifyClusters(papers);

    // Create nodes with calculated properties
    const nodes: NetworkNode[] = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      year: paper.year,
      citations: paper.citations,
      radius: this.calculateNodeSize(paper.citations),
      importance: importanceScores.get(paper.id) || 0,
      cluster: clusters.get(paper.id) || 0
    }));

    // Create links with meaningful strengths
    const links: NetworkLink[] = [];
    papers.forEach(paper => {
      paper.references.forEach(refId => {
        if (paperMap.has(refId)) {
          links.push({
            source: paper.id,
            target: refId,
            strength: this.calculateLinkStrength(paper, paperMap.get(refId)!)
          });
        }
      });
    });

    return { nodes, links };
  }

  private static calculateNodeSize(citations: number): number {
    const baseSize = 5;
    const scaleFactor = 2;
    return baseSize + scaleFactor * Math.log(citations + 1);
  }

  private static calculateImportance(papers: Paper[]): Map<string, number> {
    const scores = new Map<string, number>();
    const dampingFactor = 0.85;
    const iterations = 20;

    // Initialize scores
    papers.forEach(paper => scores.set(paper.id, 1));

    // Iterate to converge on final scores
    for (let i = 0; i < iterations; i++) {
      // Calculate new scores while keeping the original map
      const currentScores = new Map(scores);

      papers.forEach(paper => {
        let importanceSum = 0;
        paper.citedBy.forEach(citerId => {
          const citingPaper = papers.find(p => p.id === citerId);
          if (citingPaper) {
            importanceSum += (currentScores.get(citerId) || 0) / citingPaper.references.length;
          }
        });

        // Update score using PageRank formula
        const newScore = (1 - dampingFactor) + dampingFactor * importanceSum;
        scores.set(paper.id, newScore);
      });
    }

    return scores;
  }

  private static identifyClusters(papers: Paper[]): Map<string, number> {
    const clusters = new Map<string, number>();
    let currentCluster = 0;

    const areRelated = (paper1: Paper, paper2: Paper): boolean => {
      const commonRefs = paper1.references.filter(ref => 
        paper2.references.includes(ref)
      ).length;
      const threshold = Math.min(
        paper1.references.length, 
        paper2.references.length
      ) * 0.3;
      
      return paper1.references.includes(paper2.id) ||
             paper2.references.includes(paper1.id) ||
             commonRefs > threshold;
    };

    papers.forEach(paper => {
      if (clusters.has(paper.id)) return;

      const relatedPapers = papers.filter(p => 
        !clusters.has(p.id) && areRelated(paper, p)
      );

      currentCluster++;
      clusters.set(paper.id, currentCluster);
      relatedPapers.forEach(p => clusters.set(p.id, currentCluster));
    });

    return clusters;
  }

  private static calculateLinkStrength(source: Paper, target: Paper): number {
    const timeDistance = Math.abs(source.year - target.year);
    const commonRefs = source.references.filter(ref => 
      target.references.includes(ref)
    ).length;
    
    const baseStrength = 1;
    const timeDecay = Math.exp(-timeDistance / 10);
    const refBonus = commonRefs * 0.1;
    
    return baseStrength * timeDecay + refBonus;
  }
}