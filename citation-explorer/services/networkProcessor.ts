// services/networkProcessor.ts

interface Author {
    name: string;
    id?: string;
  }
  
  interface Paper {
    id: string;
    title: string;
    authors: Author[];
    year: number;
    citations: number;
    references: string[];  // Array of paper IDs this paper cites
    citedBy: string[];    // Array of paper IDs that cite this paper
  }
  
  interface NetworkNode {
    id: string;
    title: string;
    year: number;
    citations: number;
    radius: number;      // Visual size of node
    importance: number;  // Calculated measure of paper's importance
    cluster: number;     // Research area cluster
  }
  
  interface NetworkLink {
    source: string;
    target: string;
    strength: number;    // Visual strength of connection
  }
  
  export class NetworkProcessor {
    // Convert raw paper data into processed network data
    static processNetwork(papers: Paper[]) {
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
  
    // Calculate node size based on citation count using a logarithmic scale
    private static calculateNodeSize(citations: number): number {
      // Use log scale to prevent extremely large nodes
      const baseSize = 5;  // Minimum node size
      const scaleFactor = 2;  // Controls how quickly size increases
      return baseSize + scaleFactor * Math.log(citations + 1);
    }
  
    // Calculate importance scores using a simplified PageRank algorithm
    private static calculateImportance(papers: Paper[]): Map<string, number> {
      const scores = new Map<string, number>();
      const dampingFactor = 0.85;  // Standard PageRank damping factor
      const iterations = 20;        // Number of iterations for convergence
  
      // Initialize scores
      papers.forEach(paper => scores.set(paper.id, 1));
  
      // Iterate to converge on final scores
      for (let i = 0; i < iterations; i++) {
        const newScores = new Map<string, number>();
        
        papers.forEach(paper => {
          // Calculate incoming importance from papers that cite this one
          let importanceSum = 0;
          paper.citedBy.forEach(citerId => {
            const citingPaper = papers.find(p => p.id === citerId);
            if (citingPaper) {
              importanceSum += (scores.get(citerId) || 0) / citingPaper.references.length;
            }
          });
  
          // Update score using PageRank formula
          const newScore = (1 - dampingFactor) + dampingFactor * importanceSum;
          newScores.set(paper.id, newScore);
        });
  
        scores = newScores;
      }
  
      return scores;
    }
  
    // Identify research clusters using a simple community detection algorithm
    private static identifyClusters(papers: Paper[]): Map<string, number> {
      const clusters = new Map<string, number>();
      let currentCluster = 0;
  
      // Helper function to check if papers are closely related
      const areRelated = (paper1: Paper, paper2: Paper): boolean => {
        // Papers are related if they cite each other or share many references
        const commonRefs = paper1.references.filter(ref => 
          paper2.references.includes(ref)
        ).length;
        const threshold = Math.min(
          paper1.references.length, 
          paper2.references.length
        ) * 0.3;  // 30% shared references threshold
        
        return paper1.references.includes(paper2.id) ||
               paper2.references.includes(paper1.id) ||
               commonRefs > threshold;
      };
  
      // Group related papers into clusters
      papers.forEach(paper => {
        if (clusters.has(paper.id)) return;
  
        const relatedPapers = papers.filter(p => 
          !clusters.has(p.id) && areRelated(paper, p)
        );
  
        // Create new cluster for this group
        currentCluster++;
        clusters.set(paper.id, currentCluster);
        relatedPapers.forEach(p => clusters.set(p.id, currentCluster));
      });
  
      return clusters;
    }
  
    // Calculate the visual strength of a citation link
    private static calculateLinkStrength(source: Paper, target: Paper): number {
      // Links are stronger if:
      // 1. Papers are closer in time
      // 2. Papers share more references
      // 3. Papers are in the same research cluster
      
      const timeDistance = Math.abs(source.year - target.year);
      const commonRefs = source.references.filter(ref => 
        target.references.includes(ref)
      ).length;
      
      const baseStrength = 1;
      const timeDecay = Math.exp(-timeDistance / 10);  // Decay over time
      const refBonus = commonRefs * 0.1;  // Bonus for shared references
      
      return baseStrength * timeDecay + refBonus;
    }
  }