// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { PaperInput } from '@/components/paper/PaperInput';
import { CitationNetwork } from '@/components/network/CitationNetwork';

export default function Home() {
  const [papers, setPapers] = useState<any[]>([]);

  const handlePapersFound = (newPapers: any[]) => {
    setPapers(newPapers);
    console.log('Received papers:', newPapers); // Debug log
  };

  // Process papers into network data format
  const processNetworkData = () => {
    if (!papers.length) return { nodes: [], links: [] };

    const mainPaper = papers[0];
    const citations = mainPaper.citations || [];

    // Create nodes array
    const nodes = [
      {
        id: mainPaper.paperId || 'main',
        title: mainPaper.title,
        radius: 30,
        citations: mainPaper.citationCount || 0
      },
      ...citations.map((citation: any) => ({
        id: citation.paperId || `citation-${Math.random()}`,
        title: citation.title,
        radius: 20,
        citations: citation.citationCount || 0
      }))
    ];

    // Create links array
    const links = citations.map((citation: any) => ({
      source: mainPaper.paperId || 'main',
      target: citation.paperId || `citation-${Math.random()}`,
      strength: 1
    }));

    return { nodes, links };
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <PaperInput onPapersFound={handlePapersFound} />
          {/* Debug display of papers */}
          {papers.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-md shadow">
              <h3 className="font-medium">Found Papers:</h3>
              <div className="mt-2 space-y-2">
                {papers.map((paper, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{paper.title}</p>
                    <p className="text-gray-600">Citations: {paper.citationCount || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 min-h-[600px] bg-white rounded-lg shadow">
          {papers.length > 0 && (
            <CitationNetwork data={processNetworkData()} />
          )}
        </div>
      </div>
    </main>
  );
}