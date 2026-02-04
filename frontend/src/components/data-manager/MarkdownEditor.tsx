import { useEffect, useState } from 'react';
import {
  Paper,
  Stack,
  Group,
  Radio,
  Select,
  Button,
  Textarea,
  Box,
  Text,
  Grid,
  SegmentedControl,
  Code,
} from '@mantine/core';
import { IconEdit, IconEye, IconColumns } from '@tabler/icons-react';
import { marked } from 'marked';
import { useProject } from '../../hooks/useProject';
import { useAppStore } from '../../store';
import {
  getPersonFile,
  getCompanyFile,
  getJobFile,
  updatePersonFile,
  updateCompanyFile,
  updateJobFile,
  getPersonResumes,
  getResumeFile,
  updateResumeFile,
} from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertMessage } from '../shared/AlertMessage';

type ViewMode = 'split' | 'edit' | 'preview';

export function MarkdownEditor() {
  const { people, companies, jobs, loadJobsForCompany } = useProject();
  const { editor, setEditorFileType, setEditorFile, setEditorContent, resetEditor, markEditorClean } =
    useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileOptions, setFileOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  
  // Person-specific state
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personFileType, setPersonFileType] = useState<'profile' | 'resume'>('profile');
  const [availableResumes, setAvailableResumes] = useState<string[]>([]);
  const [selectedResume, setSelectedResume] = useState('');

  // Update file options when file type changes
  useEffect(() => {
    let options: Array<{ value: string; label: string }> = [];

    if (editor.fileType === 'person') {
      options = people.map((p) => ({ value: p.name, label: p.name }));
    } else if (editor.fileType === 'company') {
      options = companies.map((c) => ({ value: c.name, label: c.name }));
    } else if (editor.fileType === 'job') {
      options = Object.entries(jobs).flatMap(([company, jobList]) =>
        jobList.map((job) => ({
          value: `${company}/${job.name}`,
          label: `${company} - ${job.name}`,
        }))
      );
    }

    setFileOptions(options);
  }, [editor.fileType, people, companies, jobs]);

  // Load all companies' jobs
  useEffect(() => {
    companies.forEach((company) => {
      loadJobsForCompany(company.name);
    });
  }, [companies, loadJobsForCompany]);

  const handlePersonSelect = async (value: string | null) => {
    if (!value) return;
    
    setSelectedPerson(value);
    setSelectedResume('');
    setPersonFileType('profile');
    
    // Load available resumes for this person
    try {
      const { resumes } = await getPersonResumes(value);
      setAvailableResumes(resumes);
    } catch (err) {
      setAvailableResumes([]);
    }
  };

  const handleFileLoad = async () => {
    if (editor.fileType === 'person') {
      if (!selectedPerson) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let content = '';
        let fileId = '';
        
        if (personFileType === 'profile') {
          const response = await getPersonFile(selectedPerson);
          content = response.content;
          fileId = `${selectedPerson}:profile`;
        } else {
          if (!selectedResume) {
            setError('Please select a resume');
            setLoading(false);
            return;
          }
          const response = await getResumeFile(selectedPerson, selectedResume);
          content = response.content;
          fileId = `${selectedPerson}:resume:${selectedResume}`;
        }
        
        setEditorFile(fileId, content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileSelect = async (value: string | null) => {
    if (!value) return;

    setLoading(true);
    setError(null);

    try {
      let content = '';

      if (editor.fileType === 'company') {
        const response = await getCompanyFile(value);
        content = response.content;
        setEditorFile(value, content);
      } else if (editor.fileType === 'job') {
        const [company, job] = value.split('/');
        const response = await getJobFile(company, job);
        content = response.content;
        setEditorFile(value, content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editor.selectedFile) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (editor.fileType === 'person') {
        if (personFileType === 'profile') {
          await updatePersonFile(selectedPerson, editor.content);
        } else {
          await updateResumeFile(selectedPerson, selectedResume, editor.content);
        }
      } else if (editor.fileType === 'company') {
        await updateCompanyFile(editor.selectedFile, editor.content);
      } else if (editor.fileType === 'job') {
        const [company, job] = editor.selectedFile.split('/');
        await updateJobFile(company, job, editor.content);
      }

      markEditorClean();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const previewHtml = editor.content ? marked(editor.content) : '<p>No content to preview</p>';

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Stack gap="md">
        <Group>
          <Radio
            label="Person Profile"
            checked={editor.fileType === 'person'}
            onChange={() => setEditorFileType('person')}
          />
          <Radio
            label="Company"
            checked={editor.fileType === 'company'}
            onChange={() => setEditorFileType('company')}
          />
          <Radio label="Job" checked={editor.fileType === 'job'} onChange={() => setEditorFileType('job')} />
        </Group>

        {editor.fileType === 'person' && (
          <Box p="sm" bg="blue.0" style={{ borderRadius: '4px' }}>
            <Text size="sm" c="blue.9">
              <strong>Note:</strong> The <Code>person.md</Code> file is your comprehensive profile - a complete collection of all your experience, skills, and projects. This is the <em>source material</em> that the AI uses to generate tailored resumes. Individual generated resumes are saved to the person's <Code>resumes/</Code> folder.
            </Text>
          </Box>
        )}

        {editor.fileType === 'company' && (
          <Box p="sm" bg="blue.0" style={{ borderRadius: '4px' }}>
            <Text size="sm" c="blue.9">
              <strong>Note:</strong> The <Code>company.md</Code> file contains research about the company - culture, tech stack, values, recent news. This context helps tailor your resume to the company.
            </Text>
          </Box>
        )}

        {editor.fileType === 'job' && (
          <Box p="sm" bg="blue.0" style={{ borderRadius: '4px' }}>
            <Text size="sm" c="blue.9">
              <strong>Note:</strong> The <Code>job.md</Code> file contains the structured job description. The AI uses this to understand requirements and tailor your resume.
            </Text>
          </Box>
        )}

        {editor.fileType === 'person' ? (
          <Stack gap="md">
            <Select
              label="Select Person"
              placeholder="Choose person..."
              data={people.map((p) => ({ value: p.name, label: p.name }))}
              value={selectedPerson}
              onChange={handlePersonSelect}
              searchable
            />

            {selectedPerson && (
              <>
                <Group grow>
                  <Radio.Group
                    value={personFileType}
                    onChange={(value) => {
                      setPersonFileType(value as 'profile' | 'resume');
                      setSelectedResume('');
                    }}
                    label="What to edit?"
                  >
                    <Group mt="xs">
                      <Radio value="profile" label="Person Profile (person.md)" />
                      <Radio value="resume" label="Generated Resume" disabled={availableResumes.length === 0} />
                    </Group>
                  </Radio.Group>
                </Group>

                {personFileType === 'resume' && availableResumes.length > 0 && (
                  <Select
                    label="Select Resume"
                    placeholder="Choose resume..."
                    data={availableResumes.map((r) => ({ value: r, label: r }))}
                    value={selectedResume}
                    onChange={(value) => setSelectedResume(value || '')}
                    searchable
                  />
                )}

                <Button onClick={handleFileLoad} disabled={personFileType === 'resume' && !selectedResume}>
                  Load File
                </Button>
              </>
            )}

            {editor.selectedFile && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Editing: {personFileType === 'profile' ? `${selectedPerson}/person.md` : `${selectedPerson}/resumes/${selectedResume}.md`}
                </Text>
                <Group gap="xs">
                  {editor.isDirty && (
                    <Text size="sm" c="yellow" fs="italic">
                      Unsaved changes
                    </Text>
                  )}
                  {!editor.isDirty && (
                    <Text size="sm" c="dimmed" fs="italic">
                      Saved
                    </Text>
                  )}
                </Group>
              </Group>
            )}
          </Stack>
        ) : (
          <Group grow>
            <Select
              label="Select a file to edit"
              placeholder="Choose file..."
              data={fileOptions}
              value={editor.selectedFile}
              onChange={handleFileSelect}
              searchable
            />

            <Group justify="flex-end" align="flex-end">
              {editor.isDirty && (
                <Text size="sm" c="yellow" fs="italic">
                  Unsaved changes
                </Text>
              )}
              {!editor.isDirty && editor.selectedFile && (
                <Text size="sm" c="dimmed" fs="italic">
                  Saved
                </Text>
              )}
            </Group>
          </Group>
        )}

        {loading && <LoadingSpinner message="Loading..." />}
        {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
        {success && (
          <AlertMessage type="success" message="File saved successfully!" onClose={() => setSuccess(false)} />
        )}

        {editor.selectedFile && !loading && (
          <>
            <Group justify="space-between" mb="md">
              <SegmentedControl
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
                data={[
                  {
                    label: (
                      <Group gap="xs">
                        <IconEdit size={16} />
                        <span>Edit</span>
                      </Group>
                    ),
                    value: 'edit',
                  },
                  {
                    label: (
                      <Group gap="xs">
                        <IconColumns size={16} />
                        <span>Split</span>
                      </Group>
                    ),
                    value: 'split',
                  },
                  {
                    label: (
                      <Group gap="xs">
                        <IconEye size={16} />
                        <span>Preview</span>
                      </Group>
                    ),
                    value: 'preview',
                  },
                ]}
              />

              <Group>
                <Button onClick={handleSave} loading={loading} disabled={!editor.isDirty}>
                  Save Changes
                </Button>
                <Button variant="default" onClick={resetEditor} disabled={!editor.isDirty}>
                  Discard
                </Button>
              </Group>
            </Group>

            <Box style={{ height: '800px' }}>
              {viewMode === 'split' && (
                <Grid gutter="md" style={{ height: '100%' }}>
                  <Grid.Col span={6}>
                    <Stack gap={0} style={{ height: '100%' }}>
                      <Box
                        p="sm"
                        bg="gray.1"
                        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
                      >
                        <Text fw={600} size="sm">
                          Markdown Editor
                        </Text>
                      </Box>
                      <Textarea
                        value={editor.content}
                        onChange={(e) => setEditorContent(e.target.value)}
                        styles={{
                          input: {
                            height: 'calc(800px - 40px)',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                          },
                        }}
                      />
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack gap={0} style={{ height: '100%' }}>
                      <Box
                        p="sm"
                        bg="gray.1"
                        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
                      >
                        <Text fw={600} size="sm">
                          Live Preview
                        </Text>
                      </Box>
                      <Box
                        p="md"
                        style={{
                          height: 'calc(800px - 40px)',
                          overflow: 'auto',
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderTop: 'none',
                          backgroundColor: 'white',
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      </Box>
                    </Stack>
                  </Grid.Col>
                </Grid>
              )}

              {viewMode === 'edit' && (
                <Stack gap={0} style={{ height: '100%' }}>
                  <Box
                    p="sm"
                    bg="gray.1"
                    style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
                  >
                    <Text fw={600} size="sm">
                      Markdown Editor
                    </Text>
                  </Box>
                  <Textarea
                    value={editor.content}
                    onChange={(e) => setEditorContent(e.target.value)}
                    styles={{
                      input: {
                        height: 'calc(800px - 40px)',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      },
                    }}
                  />
                </Stack>
              )}

              {viewMode === 'preview' && (
                <Stack gap={0} style={{ height: '100%' }}>
                  <Box
                    p="sm"
                    bg="gray.1"
                    style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
                  >
                    <Text fw={600} size="sm">
                      Live Preview
                    </Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      height: 'calc(800px - 40px)',
                      overflow: 'auto',
                      border: '1px solid var(--mantine-color-gray-3)',
                      borderTop: 'none',
                      backgroundColor: 'white',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </Box>
                </Stack>
              )}
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
}
