import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaperInput = () => {
  const [inputMethod, setInputMethod] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // For now, just log the input
      console.log('Processing citation:', textInput);
      // TODO: Add API call to citation service
    } catch (err) {
      setError('Failed to process citation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && !uploadedFile.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    setFile(uploadedFile);
    // TODO: Add PDF processing logic
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Add a Paper</h2>
        <p className="text-gray-600">
          Enter a DOI, paste a citation, or upload a PDF to begin exploring its citation network
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            inputMethod === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setInputMethod('text')}
        >
          Enter Text
        </button>
        <button
          className={`px-4 py-2 rounded ${
            inputMethod === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setInputMethod('file')}
        >
          Upload PDF
        </button>
      </div>

      {inputMethod === 'text' ? (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <textarea
            className="w-full p-3 border rounded min-h-[100px]"
            placeholder="Enter DOI or paste citation text here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !textInput.trim()}
            className="w-full py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : 'Analyze Citation'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="w-full p-3 border rounded"
          />
          {file && (
            <button
              className="w-full py-2 bg-blue-500 text-white rounded"
              onClick={() => console.log('Processing PDF...')}
            >
              Process PDF
            </button>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaperInput;