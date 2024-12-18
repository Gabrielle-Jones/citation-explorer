import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Hash, Brain } from 'lucide-react';

interface PaperDetails {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  citations: number;
  doi?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  fullText?: string;
}

interface KeywordData {
  word: string;
  frequency: number;
}

const PaperDetails = ({ paper }: { paper: PaperDetails }) => {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Generate full citation in APA format
  const getFullCitation = () => {
    const authors = paper.authors.length > 0 
      ? paper.authors.join(', ').replace(/,(?=[^,]*$)/, ' &')
      : 'No authors listed';
    
    return `${authors} (${paper.year}). ${paper.title}. ${
      paper.journal ? `${paper.journal}` : ''
    }${paper.volume ? `, ${paper.volume}` : ''}${
      paper.issue ? `(${paper.issue})` : ''
    }${paper.pages ? `, ${paper.pages}` : ''}.${
      paper.doi ? ` https://doi.org/${paper.doi}` : ''
    }`;
  };

  // Extract keywords from text (simplified version)
  useEffect(() => {
    if (paper.fullText || paper.abstract) {
      const text = (paper.fullText || paper.abstract).toLowerCase();
      const words = text.match(/\b\w+\b/g) || [];
      const stopWords = new Set(['the', 'is', 'at', 'which', 'on']); // Add more stop words
      
      const frequency: { [key: string]: number } = {};
      words.forEach(word => {
        if (!stopWords.has(word) && word.length > 3) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });

      const sortedKeywords = Object.entries(frequency)
        .map(([word, count]) => ({ word, frequency: count }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      setKeywords(sortedKeywords);
    }
  }, [paper.fullText, paper.abstract]);

  // Generate AI summary
  const generateAiSummary = async () => {
    setIsLoadingSummary(true);
    try {
      // In future: Implement connection to HuggingFace API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiSummary("AI summary will be implemented using HuggingFace's free API");
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{paper.title}</CardTitle>
        <div className="text-sm text-gray-500">
          {paper.authors.join(', ')} • {paper.year}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="citation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="citation">Citation</TabsTrigger>
            <TabsTrigger value="abstract">Abstract</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="citation" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Full Citation</h4>
              <p className="text-sm text-gray-700">{getFullCitation()}</p>
            </div>
            
            <div className="flex gap-4">
              <div>
                <h4 className="font-semibold">Citations</h4>
                <p className="text-2xl font-bold text-blue-600">{paper.citations}</p>
              </div>
              {paper.doi && (
                <div>
                  <h4 className="font-semibold">DOI</h4>
                  <a 
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {paper.doi}
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="abstract">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {paper.abstract}
            </p>
          </TabsContent>

          <TabsContent value="keywords">
            <div className="space-y-2">
              {keywords.map(({ word, frequency }) => (
                <div 
                  key={word}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{word}</span>
                  <span className="text-gray-500">
                    Frequency: {frequency}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-summary">
            {aiSummary ? (
              <p className="text-sm text-gray-700">{aiSummary}</p>
            ) : (
              <div className="text-center space-y-4">
                <Button
                  onClick={generateAiSummary}
                  disabled={isLoadingSummary}
                >
                  {isLoadingSummary ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaperDetails;