/**
 * CitationService
 * Handles Semantic Scholar API integration and citation network building
 * Responsible for:
 * - Fetching paper details
 * - Building citation networks
 * - Managing rate limits and data validation
 */

import { Paper } from '@/types';

interface FetchProgress {
  currentPaper: string;
  totalFetched: number;
  depth: number;
}

export class CitationService {
  // API Configuration
  private static readonly S2_API = 'https://api.semanticscholar.org/graph/v1';
  private static readonly RATE_LIMIT_MS = 1000;
  private static readonly FIELDS = 'paperId,title,abstract,authors,year,referenceCount,citationCount,references.paperId,venue,url';
  private static readonly MAX_PAPERS_PER_LEVEL = 10;
  private static readonly MAX_TOTAL_PAPERS = 50;

  static async getCitationNetwork(
    paperId: string,
    maxDepth: number = 2,
    onProgress?: (progress: FetchProgress) => void
  ): Promise<Paper[]> {
    const papers = new Map<string, Paper>();
    await this.fetchPaperRecursive(paperId, 0, maxDepth, papers, onProgress);
    return Array.from(papers.values());
  }

  private static async fetchPaperRecursive(
    paperId: string,
    currentDepth: number,
    maxDepth: number,
    papers: Map<string, Paper>,
    onProgress?: (progress: FetchProgress) => void
  ): Promise<void> {
    if (currentDepth > maxDepth || papers.size >= this.MAX_TOTAL_PAPERS) {
      return;
    }

    await this.delay(this.RATE_LIMIT_DELAY);

    try {
      const paper = await this.fetchPaperDetails(paperId);
      if (!paper) return;

      papers.set(paper.id, paper);
      onProgress?.({
        currentPaper: paper.title,
        totalFetched: papers.size,
        depth: currentDepth
      });

      const referencesToFetch = paper.references
        .slice(0, this.MAX_PAPERS_PER_LEVEL)
        .filter(refId => !papers.has(refId));

      await Promise.all(
        referencesToFetch.map(refId =>
          this.fetchPaperRecursive(refId, currentDepth + 1, maxDepth, papers, onProgress)
        )
      );

    } catch (error) {
      console.error(`Error fetching paper ${paperId}:`, error);
    }
  }

  static async fetchPaperDetails(paperId: string): Promise<Paper | null> {
    try {
      await this.delay(this.RATE_LIMIT_MS);

      const response = await fetch(
        `${this.S2_API}/paper/${paperId}?fields=${this.FIELDS}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_S2_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch paper: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformS2Response(data);

    } catch (error) {
      console.error('Error fetching paper details:', error);
      return null;
    }
  }

  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}