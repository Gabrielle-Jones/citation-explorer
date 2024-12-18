import React, { useState } from 'react';
import PaperInput from './PaperInput';
import CitationNetwork from './CitationNetwork';
import PaperDetails from './PaperDetails';

const MainLayout = () => {
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [selectedPaper, setSelectedPaper] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Citation Explorer</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with paper input */}
          <div className="lg:col-span-1">
            <PaperInput onSubmit={(data) => setNetworkData(data)} />
          </div>
          
          {/* Main content area with network visualization */}
          <div className="lg:col-span-2 min-h-[600px] bg-white rounded-lg shadow">
            <CitationNetwork 
              data={networkData}
              onSelectPaper={setSelectedPaper}
            />
          </div>
          
          {/* Paper details panel (conditionally rendered) */}
          {selectedPaper && (
            <div className="lg:col-span-1">
              <PaperDetails paper={selectedPaper} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;