import { Stack, Select } from '@mantine/core';
import { useState } from 'react';
import { ResultsList } from './ResultsList';

export function ResultsTab() {
  const [typeFilter, setTypeFilter] = useState<string>('');

  return (
    <Stack gap="lg">
      <Select
        label="Filter by Type"
        placeholder="All Types"
        data={[
          { value: '', label: 'All Types' },
          { value: 'general', label: 'General Review' },
          { value: 'company', label: 'Company Review' },
          { value: 'job', label: 'Job Review' },
          { value: 'review', label: 'Full Review' },
          { value: 'build', label: 'Build' },
        ]}
        value={typeFilter}
        onChange={(value) => setTypeFilter(value || '')}
        clearable
      />

      <ResultsList typeFilter={typeFilter} />
    </Stack>
  );
}
