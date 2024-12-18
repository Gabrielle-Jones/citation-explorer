// services/citationService.ts

interface PaperData {
    paperId: string;
    title: string;
    abstract: string;
    year: number;
    authors: Array<{ name: string }>;
    citations: Array<{ paperId: string }>;
    references: Array<{ paperId: string }>;
  }
  
  export class CitationService {
    private static BASE_URL = 'https://api.semanticscholar.org/v1';
    
    // Helper method to handle API errors
    private static async handleResponse(response: Response) {
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
  
    // Fetch paper by DOI
    static async getPaperByDoi(doi: string): Promise<PaperData> {
      const response = await fetch(`${this.BASE_URL}/paper/${encodeURIComponent(doi)}`);
      return this.handleResponse(response);
    }
  
    // Search for papers by title or keywords
    static async searchPapers(query: string): Promise<PaperData[]> {
      const response = await fetch(
        `${this.BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=10`
      );
      return this.handleResponse(response);
    }
  
    // Get citation network for a paper
    static async getCitationNetwork(paperId: string, depth: number = 1): Promise<{
      nodes: PaperData[];
      links: Array<{ source: string; target: string }>;
    }> {
      // Start with the root paper
      const rootPaper = await this.getPaperByDoi(paperId);
      const nodes = new Map([[rootPaper.paperId, rootPaper]]);
      const links = new Set<string>();
  
      // Recursively fetch citations up to specified depth
      async function fetchCitations(paper: PaperData, currentDepth: number) {
        if (currentDepth >= depth) return;
  
        // Fetch both citations and references
        const promises = [
          ...paper.citations.map(citation => 
            CitationService.getPaperByDoi(citation.paperId)),
          ...paper.references.map(reference => 
            CitationService.getPaperByDoi(reference.paperId))
        ];
  
        const relatedPapers = await Promise.all(
          promises.map(p => p.catch(e => null))
        );
  
        for (const relatedPaper of relatedPapers) {
          if (!relatedPaper) continue;
          
          nodes.set(relatedPaper.paperId, relatedPaper);
          links.add(`${paper.paperId}-${relatedPaper.paperId}`);
          
          // Recursively fetch next level
          await fetchCitations(relatedPaper, currentDepth + 1);
        }
      }
  
      await fetchCitations(rootPaper, 0);
  
      // Convert to the format expected by the visualization component
      return {
        nodes: Array.from(nodes.values()),
        links: Array.from(links).map(link => {
          const [source, target] = link.split('-');
          return { source, target };
        })
      };
    }
  }