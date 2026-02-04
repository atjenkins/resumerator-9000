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
import { importResume } from '../../services/api';
import { FileUpload } from '../shared/FileUpload';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertMessage } from '../shared/AlertMessage';

export function ResumeImport() {
  const { people, loadPeople } = useProject();
  const api = useApi(importResume);

  const [mode, setMode] = useState<'create' | 'merge'>('create');
  const [newPersonName, setNewPersonName] = useState('');
  const [existingPerson, setExistingPerson] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('mode', mode);

    if (mode === 'create') {
      if (!newPersonName) {
        return;
      }
      formData.append('newPersonName', newPersonName);
    } else {
      if (!existingPerson) {
        return;
      }
      formData.append('personName', existingPerson);
    }

    if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    } else if (resumeText) {
      formData.append('resumeText', resumeText);
    } else {
      return;
    }

    try {
      await api.execute(formData);
      await loadPeople();
      // Reset form
      setNewPersonName('');
      setExistingPerson('');
      setResumeFile(null);
      setResumeText('');
    } catch (error) {
      // Error is handled by useApi
    }
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <Group>
          <Radio
            label="Create New Person"
            checked={mode === 'create'}
            onChange={() => setMode('create')}
          />
          <Radio
            label="Merge with Existing"
            checked={mode === 'merge'}
            onChange={() => setMode('merge')}
          />
        </Group>

        {mode === 'create' ? (
          <TextInput
            label="New Person Name"
            placeholder="e.g., John Doe"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
          />
        ) : (
          <Select
            label="Select Person"
            placeholder="Choose person..."
            data={people.map((p) => ({ value: p.name, label: p.name }))}
            value={existingPerson}
            onChange={(value) => setExistingPerson(value || '')}
            searchable
          />
        )}

        <FileUpload
          label="Upload Resume (PDF/DOCX)"
          value={resumeFile}
          onChange={setResumeFile}
          accept=".pdf,.docx"
          description="Or paste resume text below"
        />

        <Textarea
          label="Or Paste Resume Text"
          placeholder="Paste resume text here..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={6}
        />

        <Button
          onClick={handleSubmit}
          loading={api.loading}
          disabled={
            (!newPersonName && !existingPerson) || (!resumeFile && !resumeText)
          }
        >
          Import & Process with AI
        </Button>

        {api.loading && <LoadingSpinner message="Processing resume with AI..." />}

        {api.error && <AlertMessage type="error" message={api.error} onClose={api.reset} />}

        {api.data && (
          <>
            <AlertMessage
              type="success"
              message={`✓ Resume processed successfully! Person: ${api.data.personName}`}
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
