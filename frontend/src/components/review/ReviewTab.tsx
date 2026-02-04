import { Stack } from '@mantine/core';
import { ReviewForm } from './ReviewForm';
import { ReviewResults } from './ReviewResults';
import { useState } from 'react';
import type { ReviewResult, JobFitResult } from '../../services/types';

export function ReviewTab() {
  const [result, setResult] = useState<ReviewResult | JobFitResult | null>(null);

  return (
    <Stack gap="xl">
      <ReviewForm onResult={setResult} />
      {result && <ReviewResults result={result} />}
    </Stack>
  );
}
