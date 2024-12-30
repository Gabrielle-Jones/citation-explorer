// src/components/paper/PaperInput.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen } from 'lucide-react';
import { CitationParser } from '@/utils/citationParser';

interface PaperInputProps {
  onPapersFound: (papers: any[]) => void;
}

export const PaperInput: React.FC<PaperInputProps> = ({ onPapersFound }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedCitation, setParsedCitation] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setParsedCitation(null);

    try {
      // Parse the input
      const parsed = CitationParser.parse(input);
      setParsedCitation(parsed);

      // If no DOI found in citation, show error
      if (!parsed.doi) {
        throw new Error('No DOI found in citation. Please include a DOI.');
      }

      // Clean DOI (remove https://doi.org/ if present)
      const cleanDoi = parsed.doi.replace('https://doi.org/', '');

      // Fetch from Semantic Scholar API
      const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/${cleanDoi}?fields=title,abstract,authors,year,citationCount,citations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch paper data');
      }

      const data = await response.json();
      
      // Fetch citations
      const citationsResponse = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${cleanDoi}/citations?fields=title,authors,year,citationCount&limit=10`
      );
      const citationsData = await citationsResponse.json();

      // Combine paper with its citations
      const fullData = {
        ...data,
        citations: citationsData.data
      };

      onPapersFound([fullData]);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze paper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Add Paper
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <textarea
            className="w-full p-3 border rounded-md"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste citation text including DOI..."
            rows={4}
          />
          
          <Button 
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedCitation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Parsed Citation:</h3>
              <div className="mt-2 space-y-1 text-sm">
                {parsedCitation.authors.length > 0 && (
                  <p><span className="font-medium">Authors:</span> {parsedCitation.authors.join(', ')}</p>
                )}
                {parsedCitation.year && (
                  <p><span className="font-medium">Year:</span> {parsedCitation.year}</p>
                )}
                {parsedCitation.title && (
                  <p><span className="font-medium">Title:</span> {parsedCitation.title}</p>
                )}
                {parsedCitation.venue && (
                  <p><span className="font-medium">Venue:</span> {parsedCitation.venue}</p>
                )}
                {parsedCitation.doi && (
                  <p><span className="font-medium">DOI:</span> {parsedCitation.doi}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};