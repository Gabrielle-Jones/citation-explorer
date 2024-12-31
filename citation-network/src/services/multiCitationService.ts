import { Paper, NetworkData } from '@/types';
import { ArxivService } from './arxivService';
import { CitationService } from './citationService';

export class MultiCitationService {
  private static readonly MAX_PAPERS = 50;
  private static readonly MAX_DEPTH = 2;

  static async processNetwork(identifier: string): Promise<{papers: Paper[], networkData: NetworkData}> {
    let paperId = identifier;

    // Handle arXiv identifiers
    if (ArxivService.isArxivId(identifier)) {
      const paper = await ArxivService.fetchPaperByArxivId(identifier);
      paperId = paper?.id || identifier;
    }

    // Build citation network using S2 API
    const papers = await CitationService.getCitationNetwork(
      paperId, 
      this.MAX_DEPTH
    );

    return {
      papers,
      networkData: this.processNetworkData(papers)
    };
  }

  private static async buildCitationNetwork(rootId: string): Promise<Paper[]> {
    const papers = new Map<string, Paper>();
    const toProcess = new Set<string>();
    let processing = new Set<string>();

    toProcess.add(rootId);

    while (toProcess.size > 0 && papers.size < this.MAX_PAPERS) {
      processing = new Set(Array.from(toProcess).slice(0, 5));
      toProcess.clear();

      await this.delay(this.RATE_LIMIT_DELAY);

      const promises = Array.from(processing).map(async (id) => {
        try {
          const paper = await this.fetchPaperDetails(id);
          if (!paper) return;

          papers.set(paper.id, paper);

          // Add references to process queue
          if (paper.references) {
            paper.references.forEach(refId => {
              if (!papers.has(refId) && !processing.has(refId)) {
                toProcess.add(refId);
              }
            });
          }

          // Add citing papers
          const citingPapers = await this.fetchCitingPapers(id);
          citingPapers.forEach(citingPaper => {
            if (!papers.has(citingPaper.id) && !processing.has(citingPaper.id)) {
              toProcess.add(citingPaper.id);
            }
          });
        } catch (error) {
          console.error(`Error processing paper ${id}:`, error);
        }
      });

      await Promise.all(promises);
    }

    return Array.from(papers.values());
  }

  private static async fetchPaperDetails(paperId: string): Promise<Paper | null> {
    try {
      const response = await fetch(
        `${this.SEMANTIC_SCHOLAR_API}/arXiv:${paperId}?fields=paperId,title,abstract,authors,year,citations,references,citationCount`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch paper: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.paperId,
        title: data.title || 'Unknown Title',
        authors: data.authors?.map((author: any) => ({
          name: author.name || 'Unknown Author',
          id: author.authorId
        })) || [],
        year: data.year || new Date().getFullYear(),
        abstract: data.abstract || '',
        doi: data.doi,
        url: data.url,
        venue: data.venue || '',
        citations: data.citationCount || 0,
        references: (data.references || [])
          .map((ref: any) => ref.paperId)
          .filter(Boolean),
        citedBy: []
      };
    } catch (error) {
      console.error('Error fetching paper details:', error);
      return null;
    }
  }

  private static async fetchCitingPapers(paperId: string): Promise<Paper[]> {
    try {
      const response = await fetch(
        `${this.SEMANTIC_SCHOLAR_API}/${paperId}/citations?fields=paperId,title,authors,year&limit=100`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.data
        .filter((citation: any) => citation.citingPaper)
        .map((citation: any) => ({
          id: citation.citingPaper.paperId,
          title: citation.citingPaper.title,
          authors: citation.citingPaper.authors?.map((author: any) => ({
            name: author.name,
            id: author.authorId
          })) || [],
          year: citation.citingPaper.year,
          citations: citation.citingPaper.citationCount || 0,
          references: [],
          citedBy: []
        }));
    } catch (error) {
      console.error('Error fetching citing papers:', error);
      return [];
    }
  }

  private static processNetworkData(papers: Paper[]): NetworkData {
    const nodes = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      year: paper.year,
      citations: paper.citations,
      radius: Math.log(paper.citations + 1) * 5 + 10,
      importance: 1,
      cluster: 1
    }));

    const links = papers.flatMap(paper => 
      paper.references
        .filter(refId => papers.some(p => p.id === refId))
        .map(refId => ({
          source: paper.id,
          target: refId,
          strength: 1
        }))
    );

    return { nodes, links };
  }

  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}