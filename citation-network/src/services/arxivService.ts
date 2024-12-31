import { Paper } from '@/types';

export class ArxivService {
    private static readonly ARXIV_API = 'http://export.arxiv.org/api/query';
    private static readonly ARXIV_DOI_PREFIX = '10.48550/arXiv.';
    private static readonly RATE_LIMIT_MS = 3000; // arXiv recommends 3s between requests

  static async fetchPaperByArxivId(arxivId: string): Promise<Paper | null> {
    try {
      const cleanId = this.cleanArxivId(arxivId);
      await this.delay(this.RATE_LIMIT_MS);

      const params = new URLSearchParams({
        id_list: cleanId,
        max_results: '1'
      });
      
      const response = await fetch(`${this.ARXIV_API}?${params}`);
      
      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const text = await response.text();
      return this.transformArxivResponse(text, cleanId);

    } catch (error) {
      console.error('Error in fetchPaperByArxivId:', error);
      return null;
    }
  }

  private static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private static cleanArxivId(id: string): string {
    return id.split('v')[0].trim();
  }

  private static transformArxivResponse(xmlText: string | null, arxivId: string): Paper {
    if (!xmlText) {
      throw new Error('No XML response received');
    }

    const getXmlValue = (xml: string, tag: string): string => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : '';
    };

    const getAuthors = (xml: string) => {
      const authorRegex = /<author[^>]*><name>([^<]+)<\/name><\/author>/g;
      const authors = [];
      let match;
      while ((match = authorRegex.exec(xml)) !== null) {
        authors.push({
          name: match[1].trim(),
          id: null
        });
      }
      return authors;
    };

    const title = getXmlValue(xmlText, 'title');
    const abstract = getXmlValue(xmlText, 'summary');
    const published = getXmlValue(xmlText, 'published');
    const year = published ? new Date(published).getFullYear() : new Date().getFullYear();
    const authors = getAuthors(xmlText);

    if (!title) {
      throw new Error('Could not parse arXiv response - no title found');
    }

    return {
      id: arxivId,
      title,
      authors,
      year,
      abstract,
      doi: `${this.ARXIV_DOI_PREFIX}${arxivId}`,
      url: `https://arxiv.org/abs/${arxivId}`,
      venue: 'arXiv',
      citations: 0,
      references: [],
      citedBy: []
    };
  }

  static isArxivId(id: string): boolean {
    return /^\d{4}\.\d{4,5}(v\d+)?$/.test(id);
  }

  static arxivIdToDoi(arxivId: string): string {
    const cleanId = this.cleanArxivId(arxivId);
    return `${this.ARXIV_DOI_PREFIX}${cleanId}`;
  }
}