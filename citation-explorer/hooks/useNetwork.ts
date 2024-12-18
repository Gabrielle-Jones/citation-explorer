// hooks/useNetwork.ts

import { useState, useEffect } from 'react';
import { CitationService } from '../services/citationService';
import { NetworkProcessor } from '../services/networkProcessor';

export function useNetwork(rootPaperId: string | null) {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rootPaperId) return;

    async function buildNetwork() {
      setLoading(true);
      setError(null);
      
      try {
        // First, fetch the citation data
        const rawNetwork = await CitationService.getCitationNetwork(rootPaperId, 2);
        
        // Then process it into our visualization format
        const processedNetwork = NetworkProcessor.processNetwork(rawNetwork);
        
        setNetworkData(processedNetwork);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    buildNetwork();
  }, [rootPaperId]);

  return { networkData, loading, error };
}