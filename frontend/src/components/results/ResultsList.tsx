import { useEffect, useState } from 'react';
import { Stack, Text, Modal, Box } from '@mantine/core';
import { marked } from 'marked';
import { getResults, getResult } from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertMessage } from '../shared/AlertMessage';
import { ResultCard } from './ResultCard';
import type { SavedResult } from '../../services/types';

interface ResultsListProps {
  typeFilter?: string;
}

export function ResultsList({ typeFilter }: ResultsListProps) {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null);
  const [resultContent, setResultContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadResults();
  }, [typeFilter]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResults(typeFilter ? { type: typeFilter } : undefined);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = async (result: SavedResult) => {
    setSelectedResult(result);
    setLoadingContent(true);
    try {
      const data = await getResult(result.filename);
      setResultContent(data.content || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedResult(null);
    setResultContent('');
  };

  if (loading) return <LoadingSpinner message="Loading results..." />;
  if (error) return <AlertMessage type="error" message={error} onClose={() => setError(null)} />;
  if (results.length === 0) return <Text c="dimmed">No results found.</Text>;

  const renderedHtml = resultContent ? marked(resultContent) : '';

  return (
    <>
      <Stack gap="md">
        {results.map((result) => (
          <ResultCard key={result.filename} result={result} onClick={() => handleResultClick(result)} />
        ))}
      </Stack>

      <Modal
        opened={selectedResult !== null}
        onClose={handleCloseModal}
        title={selectedResult ? `Result: ${selectedResult.filename}` : ''}
        size="xl"
      >
        {loadingContent ? (
          <LoadingSpinner message="Loading result..." />
        ) : (
          <Box
            style={{
              maxHeight: '70vh',
              overflow: 'auto',
              padding: '1rem',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </Box>
        )}
      </Modal>
    </>
  );
}
