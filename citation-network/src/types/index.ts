export interface Author {
    name: string;
    id?: string;
  }
  
  export interface Paper {
    id: string;
    title: string;
    authors: Author[];
    year: number;
    abstract?: string;
    doi?: string;
    citations: number;
    references: string[];
  }
  
  export interface NetworkNode {
    id: string;
    title: string;
    radius: number;
    x?: number;
    y?: number;
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