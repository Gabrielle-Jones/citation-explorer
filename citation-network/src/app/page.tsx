// src/app/page.tsx
'use client';

import React, { useEffect } from 'react';
import { EnhancedPaperInput } from '@/components/paper/EnhancedPaperInput';
import { TimelineNetwork } from '@/components/network/TimelineNetwork';
import { useNetwork } from '@/hooks/useNetwork';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { networkData, papers, loading, error, progress, processNetwork } = useNetwork();

  // Debug logs
  useEffect(() => {
    console.log('Page mounted');
    console.log('Current state:', {
      hasNetworkData: !!networkData,
      papersCount: papers.length,
      loading,
      error,
      progress
    });
  }, [networkData, papers, loading, error, progress]);

  const handlePaperSubmit = async (identifier: string, type: 'doi' | 'arxiv') => {
    console.log('Handling paper submit:', { identifier, type });
    try {
      if (type === 'arxiv') {
        const doi = `10.48550/arXiv.${identifier}`;
        await processNetwork(doi);
      } else {
        await processNetwork(identifier);
      }
    } catch (err) {
      console.error('Error processing paper:', err);
    }
  };

  // Debug render
  console.log('Rendering page with:', {
    hasNetworkData: !!networkData,
    papersCount: papers.length,
    loading,
    error
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Citation Explorer</h1>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <EnhancedPaperInput onSubmit={handlePaperSubmit} />
            
            {loading && (
              <Card className="mt-4">
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Loading...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}

            {papers.length > 0 && (
              <Card className="mt-4">
                <CardContent>
                  <h3 className="font-medium">Found Papers: {papers.length}</h3>
                  {papers.map(paper => (
                    <div key={paper.id} className="mt-2 p-2 bg-gray-50 rounded">
                      <p>{paper.title}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow min-h-[600px]">
            {networkData && <TimelineNetwork data={networkData} />}
          </div>
        </div>
      </div>
    </div>
  );
}