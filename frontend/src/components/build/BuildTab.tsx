import { Stack } from '@mantine/core';
import { BuildForm } from './BuildForm';
import { BuildResults } from './BuildResults';
import { useState } from 'react';
import type { BuilderResult } from '../../services/types';

export function BuildTab() {
  const [result, setResult] = useState<BuilderResult | null>(null);

  return (
    <Stack gap="xl">
      <BuildForm onResult={setResult} />
      {result && <BuildResults result={result} />}
    </Stack>
  );
}
