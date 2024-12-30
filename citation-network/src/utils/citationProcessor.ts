// src/utils/citationParser.ts
interface ParsedCitation {
    authors: string[];
    year?: number;
    title?: string;
    doi?: string;
    venue?: string;
    pages?: string;
  }
  
  export class CitationParser {
    private static readonly patterns = {
      doi: /(?:doi:|https?:\/\/doi\.org\/)?10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+/i,
      year: /\b(19|20)\d{2}\b/,
      pages: /\(pp\.\s*(\d+[-–]\d+|\d+)\)/i,
      authors: /^([^,.]+(,\s*[^,.]+)?(\s+and\s+|\s*,\s*(?:and\s+)?)?)+/i
    };
  
    static parse(citation: string): ParsedCitation {
      const cleanCitation = citation.trim().replace(/\s+/g, ' ');
      
      // Initialize result
      const result: ParsedCitation = {
        authors: []
      };
  
      // Extract DOI
      const doiMatch = cleanCitation.match(this.patterns.doi);
      if (doiMatch) {
        result.doi = doiMatch[0];
      }
  
      // Split citation into parts
      const parts = cleanCitation.split(/,\s(?=[A-Z])/);
      
      // First part should contain authors
      if (parts[0]) {
        // Split authors by 'and' or ','
        result.authors = parts[0]
          .split(/(?:,\s*|\s+and\s+|&\s*)/)
          .map(author => author.trim())
          .filter(author => author && !author.match(/^(and|&)$/i));
      }
  
      // Extract year
      const yearMatch = cleanCitation.match(this.patterns.year);
      if (yearMatch) {
        result.year = parseInt(yearMatch[0]);
      }
  
      // Extract title
      // Look for text between authors and "In" or year
      let titleStart = parts[0]?.length || 0;
      let titleEnd = cleanCitation.toLowerCase().indexOf(' in ');
      if (titleEnd === -1) {
        titleEnd = yearMatch ? cleanCitation.indexOf(yearMatch[0]) : cleanCitation.length;
      }
      if (titleStart < titleEnd) {
        result.title = cleanCitation
          .slice(titleStart, titleEnd)
          .replace(/^[,.\s]+/, '')  // Remove leading punctuation
          .replace(/[,.\s]+$/, '')  // Remove trailing punctuation
          .trim();
      }
  
      // Extract venue
      const venueMatch = cleanCitation.match(/In\s+([^,]+)/i);
      if (venueMatch) {
        result.venue = venueMatch[1].trim();
      }
  
      // Extract pages
      const pagesMatch = cleanCitation.match(this.patterns.pages);
      if (pagesMatch) {
        result.pages = pagesMatch[1];
      }
  
      return result;
    }
  
    static format(parsed: ParsedCitation): string {
      const parts: string[] = [];
  
      if (parsed.authors.length > 0) {
        parts.push(parsed.authors.join(', '));
      }
  
      if (parsed.year) {
        parts.push(`(${parsed.year})`);
      }
  
      if (parsed.title) {
        parts.push(parsed.title);
      }
  
      if (parsed.venue) {
        parts.push(`In ${parsed.venue}`);
      }
  
      if (parsed.pages) {
        parts.push(`pp. ${parsed.pages}`);
      }
  
      if (parsed.doi) {
        parts.push(`DOI: ${parsed.doi}`);
      }
  
      return parts.join('. ');
    }
  }