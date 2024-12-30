'use client';

import React from 'react';
import { PaperInput } from '@/components/paper/PaperInput';
import { CitationNetwork } from '@/components/network/CitationNetwork';
import { PaperDetails } from '@/components/paper/PaperDetails';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <PaperInput onSubmit={(data) => { console.log(data); }} />
        </div>
        <div className="lg:col-span-2 min-h-[600px] bg-white rounded-lg shadow">
          <CitationNetwork data={{ nodes: [], links: [] }} onNodeSelect={() => {}} />
        </div>
      </div>
    </main>
  );
}