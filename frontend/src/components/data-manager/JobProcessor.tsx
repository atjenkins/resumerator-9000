import { useState } from 'react';
import {
  Paper,
  Stack,
  Radio,
  Group,
  Select,
  TextInput,
  Textarea,
  Button,
  Box,
  Text,
} from '@mantine/core';
import { useProject } from '../../hooks/useProject';
import { useApi } from '../../hooks/useApi';
import { importJob } from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertMessage } from '../shared/AlertMessage';

export function JobProcessor() {
  const { companies, jobs, loadJobsForCompany } = useProject();
  const api = useApi(importJob);

  const [mode, setMode] = useState<'create' | 'append'>('create');
  const [company, setCompany] = useState('');
  const [newJobName, setNewJobName] = useState('');
  const [existingJob, setExistingJob] = useState('');
  const [jobText, setJobText] = useState('');

  const handleCompanyChange = async (value: string | null) => {
    setCompany(value || '');
    setExistingJob('');
    if (value) {
      await loadJobsForCompany(value);
    }
  };

  const handleSubmit = async () => {
    if (!company || !jobText) return;

    const jobName = mode === 'create' ? newJobName : existingJob;
    if (!jobName) return;

    try {
      await api.execute({ mode, company, jobName, jobText });
      // Reset form
      setNewJobName('');
      setExistingJob('');
      setJobText('');
    } catch (error) {
      // Error handled by useApi
    }
  };

  const currentJobs = company ? jobs[company] || [] : [];

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <Group>
          <Radio
            label="Create New Job"
            checked={mode === 'create'}
            onChange={() => setMode('create')}
          />
          <Radio
            label="Add to Existing Job"
            checked={mode === 'append'}
            onChange={() => setMode('append')}
          />
        </Group>

        <Select
          label="Company"
          placeholder="Select company..."
          data={companies.map((c) => ({ value: c.name, label: c.name }))}
          value={company}
          onChange={handleCompanyChange}
          searchable
        />

        {mode === 'create' ? (
          <TextInput
            label="Job Title"
            placeholder="e.g., Senior Software Engineer"
            value={newJobName}
            onChange={(e) => setNewJobName(e.target.value)}
          />
        ) : (
          <Select
            label="Select Job"
            placeholder="Choose job..."
            data={currentJobs.map((j) => ({ value: j.name, label: j.name }))}
            value={existingJob}
            onChange={(value) => setExistingJob(value || '')}
            searchable
            disabled={!company}
          />
        )}

        <Textarea
          label="Paste Job Description"
          placeholder="Paste the full job description here..."
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={10}
          description="Copy the entire job posting from the company's website or job board."
        />

        <Button
          onClick={handleSubmit}
          loading={api.loading}
          disabled={!company || !jobText || (!newJobName && !existingJob)}
        >
          Process with AI
        </Button>

        {api.loading && <LoadingSpinner message="Processing job description with AI..." />}

        {api.error && <AlertMessage type="error" message={api.error} onClose={api.reset} />}

        {api.data && (
          <>
            <AlertMessage
              type="success"
              message={`✓ Job description processed successfully! Job: ${api.data.jobName}`}
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
