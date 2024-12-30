import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NetworkData } from '@/types';

interface PaperInputProps {
  onSubmit: (data: NetworkData) => void;
}

export const PaperInput: React.FC<PaperInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For MVP, we'll create mock data
      const mockData: NetworkData = {
        nodes: [
          { id: '1', title: 'Main Paper', radius: 20 },
          { id: '2', title: 'Reference 1', radius: 15 },
          { id: '3', title: 'Reference 2', radius: 15 },
        ],
        links: [
          { source: '1', target: '2', strength: 1 },
          { source: '1', target: '3', strength: 1 },
        ],
      };
      onSubmit(mockData);
    } catch (err) {
      setError('Failed to process paper. Please try again.');
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-2 border rounded"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter DOI or paste citation..."
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Processing...' : 'Analyze'}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};