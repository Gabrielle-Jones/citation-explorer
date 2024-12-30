// src/utils/citationParser.ts
interface ParsedCitation {
    authors: string[];
    year?: number;
    title?: string;
    doi?: string;
    venue?: string;
    volume?: string;
    issue?: string;
    pages?: string;
  }
  
  export class CitationParser {
    // Regular expressions for different parts of citations
    private static readonly patterns = {
      doi: /(?:doi:|https?:\/\/doi\.org\/)?10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+/i,
      year: /\b(19|20)\d{2}\b/,
      pages: /(?:p\.?|pages?)\s*(\d+[-–]\d+|\d+)/i,
      // Match authors in format: "LastName1, FirstName1 and LastName2, FirstName2" or "LastName1 FirstName1, LastName2 FirstName2"
      authors: /^([^,.]+(,\s*[^,.]+)?\s*(,|\sand\s|&|\s|$))+/i
    };
  
    static parse(citation: string): ParsedCitation {
      // Clean up the citation text
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
  
      // Extract year
      const yearMatch = cleanCitation.match(this.patterns.year);
      if (yearMatch) {
        result.year = parseInt(yearMatch[0]);
      }
  
      // Extract pages
      const pagesMatch = cleanCitation.match(this.patterns.pages);
      if (pagesMatch) {
        result.pages = pagesMatch[1];
      }
  
      // Extract authors
      const potentialAuthors = cleanCitation.split(/[.?!]\s/)[0]; // Take first sentence
      const authorMatch = potentialAuthors.match(this.patterns.authors);
      if (authorMatch) {
        result.authors = this.parseAuthors(authorMatch[0]);
      }
  
      // Extract title (usually after authors and before year/venue)
      const titlePart = this.extractTitle(cleanCitation, result);
      if (titlePart) {
        result.title = titlePart;
      }
  
      // Extract venue (usually after title and year)
      const venuePart = this.extractVenue(cleanCitation, result);
      if (venuePart) {
        result.venue = venuePart;
      }
  
      return result;
    }
  
    private static parseAuthors(authorString: string): string[] {
      // Split by common author separators
      return authorString
        .split(/(?:,\s*and\s*|,?\s+and\s+|,\s*|\s*&\s*)/g)
        .filter(author => author.trim().length > 0)
        .map(author => author.trim());
    }
  
    private static extractTitle(citation: string, parsed: ParsedCitation): string | undefined {
      // Try to find title between authors and year/venue
      const parts = citation.split(/[.?!]\s/);
      if (parts.length > 1) {
        // Title is usually the second major part after authors
        return parts[1].trim()
          .replace(/^["'](.+)["']$/, '$1') // Remove surrounding quotes
          .replace(/^["""'](.+)["""']$/, '$1'); // Remove fancy quotes
      }
      return undefined;
    }
  
    private static extractVenue(citation: string, parsed: ParsedCitation): string | undefined {
      // Try to find venue after year
      if (parsed.year) {
        const afterYear = citation.split(parsed.year.toString())[1];
        if (afterYear) {
          // Look for text between common venue markers
          const venueMatch = afterYear.match(/in\s+([^,.(]+)/i);
          if (venueMatch) {
            return venueMatch[1].trim();
          }
        }
      }
      return undefined;
    }
  
    // Helper method to format citation in standard format
    static format(parsed: ParsedCitation): string {
      const parts: string[] = [];
  
      // Authors
      if (parsed.authors.length > 0) {
        const authorString = parsed.authors.length > 2
          ? `${parsed.authors[0]} et al.`
          : parsed.authors.join(' and ');
        parts.push(authorString);
      }
  
      // Year
      if (parsed.year) {
        parts.push(`(${parsed.year})`);
      }
  
      // Title
      if (parsed.title) {
        parts.push(`"${parsed.title}"`);
      }
  
      // Venue
      if (parsed.venue) {
        parts.push(`In ${parsed.venue}`);
      }
  
      // Pages
      if (parsed.pages) {
        parts.push(`pp. ${parsed.pages}`);
      }
  
      // DOI
      if (parsed.doi) {
        parts.push(`DOI: ${parsed.doi}`);
      }
  
      return parts.join('. ');
    }
  
    // Test if a string looks like a DOI
    static isDOI(text: string): boolean {
      return this.patterns.doi.test(text);
    }
  }
  
  // Example usage:
  /*
  const examples = [
    'Smith, J., and Jones, M. (2020). Title of the paper. Journal Name, 15(2), 123-145.',
    'Smith J, Jones M. Title. Conference 2020; pp. 1-10. DOI: 10.1234/abc123',
    'Smith et al. "Long Title Here" in Proceedings 2020',
    'https://doi.org/10.1234/abc123'
  ];
  
  examples.forEach(citation => {
    const parsed = CitationParser.parse(citation);
    console.log('Parsed:', parsed);
    console.log('Formatted:', CitationParser.format(parsed));
    console.log('---');
  });
  */