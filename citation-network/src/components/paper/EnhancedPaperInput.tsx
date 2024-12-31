// src/components/paper/EnhancedPaperInput.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Book, FileText } from 'lucide-react';
import { ArxivService } from '../../services/arxivService';

interface PaperInputProps {
  onSubmit: (identifier: string, type: 'doi' | 'arxiv') => void;
}

interface StructuredCitation {
  authors: string[];
  year?: number;
  title?: string;
  journal?: string;
  doi?: string;
  arxivId?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

export const EnhancedPaperInput: React.FC<PaperInputProps> = ({ onSubmit }) => {
  const [inputMode, setInputMode] = useState<'raw' | 'structured'>('raw');
  const [rawInput, setRawInput] = useState('');
  const [structuredInput, setStructuredInput] = useState<StructuredCitation>({
    authors: [],
    year: undefined,
    title: '',
    journal: '',
    doi: '',
    arxivId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedCitation, setParsedCitation] = useState<StructuredCitation | null>(null);

  // Update DOI when arXiv ID changes
  useEffect(() => {
    if (structuredInput.arxivId && ArxivService.isArxivId(structuredInput.arxivId)) {
      const doi = ArxivService.arxivIdToDoi(structuredInput.arxivId);
      setStructuredInput(prev => ({
        ...prev,
        doi
      }));
    }
  }, [structuredInput.arxivId]);

  const parseArxivId = (text: string): string | null => {
    // Match various arXiv formats
    const arxivPatterns = [
      /arxiv:(\d{4}\.\d{4,5}v?\d*)/i,
      /arxiv\.org\/abs\/(\d{4}\.\d{4,5}v?\d*)/i,
      /\b(\d{4}\.\d{4,5}v?\d*)\b/,  // Raw arXiv ID
    ];

    for (const pattern of arxivPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Remove version number if present
        return match[1].split('v')[0];
      }
    }
    return null;
  };

  const parseDOI = (text: string): string | null => {
    // Match various DOI formats
    const doiPatterns = [
      /\b(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)\b/i,  // Standard DOI
      /doi\.org\/(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)/i,  // DOI URL
      /doi:\s*(10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+)/i,  // DOI with prefix
    ];

    for (const pattern of doiPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const parseAuthors = (text: string): string[] => {
    // Remove et al. and surrounding text
    text = text.replace(/\bet\s+al\b.*$/, '').trim();
    
    let authors: string[] = [];
    
    if (text.includes(' and ')) {
      // Split on "and" and commas
      authors = text.split(/,\s*(?:and\s+)?|\s+and\s+/);
    } else if (text.includes(';')) {
      authors = text.split(';');
    } else if (text.includes(',')) {
      authors = text.split(',');
    } else {
      authors = [text];
    }

    return authors
      .map(a => a.trim())
      .filter(a => a.length > 0 && a !== 'and');
  };

  const parseRawCitation = (text: string): StructuredCitation => {
    const arxivId = parseArxivId(text);
    const doi = parseDOI(text);
    
    // Extract year - handle ranges and pick latest
    const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
    const year = yearMatches ? Math.max(...yearMatches.map(y => parseInt(y))) : undefined;

    // Extract title
    let title = '';
    // Try quoted title first
    const quotedTitle = text.match(/["'""]([^"'""]+)["'""]/);
    if (quotedTitle) {
      title = quotedTitle[1];
    } else {
      // Try to find title between author and journal/year
      const parts = text.split(/\.\s+/);
      if (parts.length > 1) {
        title = parts[1].split(/\bin\b|\(/)[0].trim();
      }
    }

    // Extract authors from the first part
    const firstPart = text.split(/[.?!]\s/)[0];
    const authors = parseAuthors(firstPart);

    // Extract journal
    const journalMatch = text.match(/\bin\b\s+([^,.(]+)/i);
    const journal = journalMatch ? journalMatch[1].trim() : undefined;

    return {
      authors,
      year,
      title,
      journal,
      doi,
      arxivId
    };
  };

  const handleRawSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const parsed = parseRawCitation(rawInput);
      setParsedCitation(parsed);

      if (!parsed.doi && !parsed.arxivId) {
        throw new Error('No DOI or arXiv ID found. Please include one in the citation.');
      }

      if (parsed.arxivId) {
        await onSubmit(parsed.arxivId, 'arxiv');
      } else if (parsed.doi) {
        await onSubmit(parsed.doi, 'doi');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process citation');
    } finally {
      setLoading(false);
    }
  };

  const handleStructuredSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (structuredInput.arxivId && ArxivService.isArxivId(structuredInput.arxivId)) {
        await onSubmit(structuredInput.arxivId, 'arxiv');
      } else if (structuredInput.doi) {
        await onSubmit(structuredInput.doi, 'doi');
      } else {
        throw new Error('Please provide a valid DOI or arXiv ID');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process citation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Add Paper
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="raw" onValueChange={(v) => setInputMode(v as 'raw' | 'structured')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="raw">Paste Citation</TabsTrigger>
            <TabsTrigger value="structured">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="raw">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Citation Text</Label>
                <Textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Paste citation text here..."
                  rows={4}
                />
              </div>
              
              <Button
                onClick={handleRawSubmit}
                disabled={loading || !rawInput.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="structured">
            <div className="space-y-4">
              <div>
                <Label>DOI</Label>
                <Input
                  value={structuredInput.doi || ''}
                  onChange={(e) => setStructuredInput({
                    ...structuredInput,
                    doi: e.target.value
                  })}
                  placeholder="10.1234/example"
                />
              </div>

              <div>
                <Label>arXiv ID</Label>
                <Input
                  value={structuredInput.arxivId || ''}
                  onChange={(e) => setStructuredInput({
                    ...structuredInput,
                    arxivId: e.target.value
                  })}
                  placeholder="2412.14955"
                />
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={structuredInput.title || ''}
                  onChange={(e) => setStructuredInput({
                    ...structuredInput,
                    title: e.target.value
                  })}
                  placeholder="Paper title"
                />
              </div>

              <div>
                <Label>Authors (comma-separated)</Label>
                <Input
                  value={structuredInput.authors.join(', ')}
                  onChange={(e) => setStructuredInput({
                    ...structuredInput,
                    authors: e.target.value.split(',').map(a => a.trim())
                  })}
                  placeholder="Author1, Author2"
                />
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={structuredInput.year || ''}
                  onChange={(e) => setStructuredInput({
                    ...structuredInput,
                    year: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="2024"
                />
              </div>

              <Button
                onClick={handleStructuredSubmit}
                disabled={loading || (!structuredInput.doi && !structuredInput.arxivId)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsedCitation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Parsed Citation:</h3>
            <div className="space-y-1 text-sm">
              {parsedCitation.authors.length > 0 && (
                <p><span className="font-medium">Authors:</span> {parsedCitation.authors.join(', ')}</p>
              )}
              {parsedCitation.year && (
                <p><span className="font-medium">Year:</span> {parsedCitation.year}</p>
              )}
              {parsedCitation.title && (
                <p><span className="font-medium">Title:</span> {parsedCitation.title}</p>
              )}
              {parsedCitation.doi && (
                <p><span className="font-medium">DOI:</span> {parsedCitation.doi}</p>
              )}
              {parsedCitation.arxivId && (
                <p><span className="font-medium">arXiv ID:</span> {parsedCitation.arxivId}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};