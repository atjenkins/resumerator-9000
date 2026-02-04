import { useState } from 'react';
import {
  Paper,
  Stack,
  Radio,
  Group,
  TextInput,
  Select,
  Textarea,
  Button,
  Box,
  Text,
} from '@mantine/core';
import { useProject } from '../../hooks/useProject';
import { useApi } from '../../hooks/useApi';
import { importCompany } from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertMessage } from '../shared/AlertMessage';

export function CompanyProcessor() {
  const { companies, loadCompanies } = useProject();
  const api = useApi(importCompany);

  const [mode, setMode] = useState<'create' | 'append'>('create');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [existingCompany, setExistingCompany] = useState('');
  const [companyText, setCompanyText] = useState('');

  const handleSubmit = async () => {
    if (!companyText) return;

    const companyName = mode === 'create' ? newCompanyName : existingCompany;
    if (!companyName) return;

    try {
      await api.execute({ mode, companyName, companyText });
      await loadCompanies();
      // Reset form
      setNewCompanyName('');
      setExistingCompany('');
      setCompanyText('');
    } catch (error) {
      // Error handled by useApi
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <Group>
          <Radio
            label="Create New Company"
            checked={mode === 'create'}
            onChange={() => setMode('create')}
          />
          <Radio
            label="Add to Existing Company"
            checked={mode === 'append'}
            onChange={() => setMode('append')}
          />
        </Group>

        {mode === 'create' ? (
          <TextInput
            label="Company Name"
            placeholder="e.g., Acme Corp"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
          />
        ) : (
          <Select
            label="Select Company"
            placeholder="Choose company..."
            data={companies.map((c) => ({ value: c.name, label: c.name }))}
            value={existingCompany}
            onChange={(value) => setExistingCompany(value || '')}
            searchable
          />
        )}

        <Textarea
          label="Paste Company Information"
          placeholder="Paste company information here (from website, Glassdoor, LinkedIn, news articles, etc.)..."
          value={companyText}
          onChange={(e) => setCompanyText(e.target.value)}
          rows={10}
          description="Include: company description, tech stack, culture, values, recent news, anything relevant for resume tailoring."
        />

        <Button
          onClick={handleSubmit}
          loading={api.loading}
          disabled={!companyText || (!newCompanyName && !existingCompany)}
        >
          Process with AI
        </Button>

        {api.loading && <LoadingSpinner message="Processing company information with AI..." />}

        {api.error && <AlertMessage type="error" message={api.error} onClose={api.reset} />}

        {api.data && (
          <>
            <AlertMessage
              type="success"
              message={`✓ Company information processed successfully! Company: ${api.data.companyName}`}
              onClose={api.reset}
            />
            <Box>
              <Text fw={600} size="sm" mb="xs">
                Document Preview:
              </Text>
              <Textarea
                value={api.data.preview}
                readOnly
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    minHeight: '300px',
                  },
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
}
