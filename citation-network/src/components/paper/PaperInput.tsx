// src/components/paper/PaperInput.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { CitationParser } from '@/utils/citationParser';

interface PaperInputProps {
  onSubmit: (doi: string) => void;
}

export const PaperInput: React.FC<PaperInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedCitation, setParsedCitation] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');

    try {
      // Parse the citation
      const parsed = CitationParser.parse(input);
      setParsedCitation(parsed);

      if (!parsed.doi) {
        throw new Error('No DOI found in citation. Please include a DOI.');
      }

      // Call the parent's onSubmit with the DOI
      await onSubmit(parsed.doi);
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
        <CardTitle>Add Paper</CardTitle>
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
                <p><span className="font-medium">Authors:</span> {parsedCitation.authors.join(', ')}</p>
                {parsedCitation.year && (
                  <p><span className="font-medium">Year:</span> {parsedCitation.year}</p>
                )}
                {parsedCitation.title && (
                  <p><span className="font-medium">Title:</span> {parsedCitation.title}</p>
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