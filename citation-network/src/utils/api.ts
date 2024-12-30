// src/utils/api.ts
import { Paper } from '@/types';

const CROSSREF_API = 'https://api.crossref.org/works/';
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/v1/paper/';

export class CitationAPI {
  // Fetch paper details from DOI
  static async fetchPaperByDOI(doi: string): Promise<Paper> {
    try {
      const response = await fetch(`${CROSSREF_API}${doi}`);
      const data = await response.json();
      
      // Transform CrossRef data to our Paper type
      return this.transformCrossRefData(data.message);
    } catch (error) {
      console.error('Error fetching paper:', error);
      throw new Error('Failed to fetch paper details');
    }
  }

  // Fetch citations for a paper
  static async fetchCitations(doi: string): Promise<Paper[]> {
    try {
      const response = await fetch(`${SEMANTIC_SCHOLAR_API}${doi}/citations`);
      const data = await response.json();
      
      return data.citations.map(this.transformSemanticScholarData);
    } catch (error) {
      console.error('Error fetching citations:', error);
      throw new Error('Failed to fetch citations');
    }
  }

  // Transform CrossRef data to our Paper type
  private static transformCrossRefData(data: any): Paper {
    return {
      id: data.DOI,
      title: data.title[0],
      authors: data.author.map((author: any) => ({
        name: `${author.given} ${author.family}`,
        id: author.ORCID
      })),
      year: new Date(data.created['date-time']).getFullYear(),
      abstract: data.abstract,
      doi: data.DOI,
      citations: data['is-referenced-by-count'],
      references: data['reference-count'] || []
    };
  }

  // Transform Semantic Scholar data to our Paper type
  private static transformSemanticScholarData(data: any): Paper {
    return {
      id: data.paperId,
      title: data.title,
      authors: data.authors.map((author: any) => ({
        name: author.name,
        id: author.authorId
      })),
      year: data.year,
      abstract: data.abstract,
      doi: data.doi,
      citations: data.citationCount,
      references: data.references || []
    };
  }
}

// Mock API for development/testing
export class MockCitationAPI {
  static async fetchPaperByDOI(doi: string): Promise<Paper> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: '1',
      title: 'Example Research Paper',
      authors: [
        { name: 'John Doe', id: '123' },
        { name: 'Jane Smith', id: '456' }
      ],
      year: 2023,
      abstract: 'This is an example research paper abstract...',
      doi: doi,
      citations: 42,
      references: ['2', '3', '4']
    };
  }

  static async fetchCitations(): Promise<Paper[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '2',
        title: 'Related Research A',
        authors: [{ name: 'Alice Johnson' }],
        year: 2022,
        citations: 15,
        references: ['1']
      },
      {
        id: '3',
        title: 'Related Research B',
        authors: [{ name: 'Bob Wilson' }],
        year: 2021,
        citations: 23,
        references: ['1']
      }
    ];
  }
}