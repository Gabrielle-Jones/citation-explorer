import { v4 as uuidv4 } from 'uuid';
import { Paper, Author, CitationResponse } from '@/types';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/v1/paper';
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

export class SemanticScholarAPI {
  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async fetchPaperByDOI(doi: string): Promise<Paper | null> {
    try {
      await this.delay(RATE_LIMIT_DELAY);
      const response = await fetch(`${SEMANTIC_SCHOLAR_API}/DOI:${doi}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch paper: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformPaperData(data);
    } catch (error) {
      console.error('Error fetching from Semantic Scholar:', error);
      return null;
    }
  }

  static async fetchCitations(paperId: string): Promise<CitationResponse> {
    try {
      await this.delay(RATE_LIMIT_DELAY);
      const response = await fetch(`${SEMANTIC_SCHOLAR_API}/${paperId}/citations`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch citations: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        citations: data.citations.map(this.transformPaperData),
        error: null
      };
    } catch (error) {
      return {
        citations: [],
        error: `Failed to fetch citations: ${error.message}`
      };
    }
  }

  private static transformPaperData(data: any): Paper {
    return {
      uuid: uuidv4(),
      id: data.paperId,
      title: data.title,
      authors: data.authors.map((author: any): Author => ({
        name: author.name,
        id: author.authorId
      })),
      year: data.year,
      abstract: data.abstract,
      doi: data.doi,
      url: data.url,
      venue: data.venue,
      citations: data.citationCount || 0,
      references: data.references || [],
      topics: data.topics || [],
      citedPapers: [], // Will be populated during network building
      fetchDepth: 0 // Track depth in citation network
    };
  }
}
