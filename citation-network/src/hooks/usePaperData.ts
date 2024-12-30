// src/hooks/usePaperData.ts
import { useState, useCallback } from 'react';
import { Paper, NetworkData } from '@/types';
import { CitationAPI, MockCitationAPI } from '@/utils/api';
import { NetworkProcessor } from '@/utils/networkProcessor';

export const usePaperData = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaperData = useCallback(async (doi: string, useMock = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use mock API for development
      const api = useMock ? MockCitationAPI : CitationAPI;
      
      // Fetch main paper
      const paper = await api.fetchPaperByDOI(doi);
      
      // Fetch citations
      const citations = await api.fetchCitations(doi);
      
      // Combine all papers
      const allPapers = [paper, ...citations];
      setPapers(allPapers);
      
      // Process network data
      const network = NetworkProcessor.processNetworkData(allPapers);
      setNetworkData(network);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch paper data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLayout = useCallback((layoutType: 'force' | 'circular' | 'hierarchical') => {
    if (networkData.nodes.length === 0) return;

    let updatedNetwork: NetworkData;
    switch (layoutType) {
      case 'circular':
        updatedNetwork = NetworkProcessor.applyCircularLayout(networkData);
        break;
      case 'hierarchical':
        updatedNetwork = NetworkProcessor.applyHierarchicalLayout(networkData);
        break;
      default:
        updatedNetwork = networkData; // Force layout is handled by D3
    }
    setNetworkData(updatedNetwork);
  }, [networkData]);

  return {
    papers,
    networkData,
    loading,
    error,
    fetchPaperData,
    updateLayout
  };
};