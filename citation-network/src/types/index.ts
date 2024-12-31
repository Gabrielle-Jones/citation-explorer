// src/types/index.ts
export interface Author {
  name: string;
  id?: string;
}

export interface NetworkNode {
  id: string;
  title: string;
  year: number;
  citations: number;
  radius: number;
  importance: number;
  cluster: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  strength: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface Paper {
  uuid: string;          // Internal unique identifier
  id: string;           // API-specific identifier
  title: string;
  authors: Author[];
  year: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citations: number;    // Number of times cited
  references: string[]; // Array of paper IDs this paper cites
  citedPapers: string[]; // Array of UUIDs of papers citing this one
  topics?: string[];
  fetchDepth: number;   // Depth in citation network
}

export interface CitationResponse {
  citations: Paper[];
  error: string | null;
}
