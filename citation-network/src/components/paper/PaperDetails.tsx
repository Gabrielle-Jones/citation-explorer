import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Paper } from '@/types';

interface PaperDetailsProps {
  paper: Paper;
}

export const PaperDetails: React.FC<PaperDetailsProps> = ({ paper }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{paper.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Authors</h4>
            <p>{paper.authors.map(author => author.name).join(', ')}</p>
          </div>
          <div>
            <h4 className="font-semibold">Year</h4>
            <p>{paper.year}</p>
          </div>
          {paper.abstract && (
            <div>
              <h4 className="font-semibold">Abstract</h4>
              <p className="text-sm">{paper.abstract}</p>
            </div>
          )}
          <div>
            <h4 className="font-semibold">Citations</h4>
            <p>{paper.citations}</p>
          </div>
          {paper.doi && (
            <div>
              <h4 className="font-semibold">DOI</h4>
              <p>{paper.doi}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};