// src/hooks/useNetwork.ts
import { useState } from 'react';
import { MultiCitationService } from '@/services/multiCitationService';
import { Paper } from '@/types';

export function useNetwork() {
  const [networkData, setNetworkData] = useState<any>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processNetwork = async (identifier: string) => {
    console.log('Processing network for:', identifier);
    setLoading(true);
    setError(null);
    setPapers([]);
    setNetworkData(null);

    try {
      const result = await MultiCitationService.processNetwork(identifier);
      setPapers(result.papers);
      setNetworkData(result.networkData);
      console.log('Network processed:', {
        paperCount: result.papers.length,
        nodeCount: result.networkData.nodes.length,
        linkCount: result.networkData.links.length
      });
    } catch (err) {
      console.error('Error processing network:', err);
      setError(err instanceof Error ? err.message : 'Failed to process citation network');
    } finally {
      setLoading(false);
    }
  };

  return {
    networkData,
    papers,
    loading,
    error,
    processNetwork
  };
}