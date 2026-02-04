import { useState } from 'react';
import { Stack, Alert, Tabs } from '@mantine/core';
import { IconInfoCircle, IconFileUpload, IconBriefcase, IconBuilding, IconEdit } from '@tabler/icons-react';
import { ResumeImport } from './ResumeImport';
import { JobProcessor } from './JobProcessor';
import { CompanyProcessor } from './CompanyProcessor';
import { MarkdownEditor } from './MarkdownEditor';

export function DataManagerTab() {
  const [activeTab, setActiveTab] = useState<string | null>('import-resume');

  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        <strong>Tip:</strong> You can do research externally (company websites, job postings, LinkedIn,
        etc.) and paste the information here. The AI will structure it into clean markdown files for you.
      </Alert>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="import-resume" leftSection={<IconFileUpload size={16} />}>
            Import Resume
          </Tabs.Tab>
          <Tabs.Tab value="process-job" leftSection={<IconBriefcase size={16} />}>
            Process Job Description
          </Tabs.Tab>
          <Tabs.Tab value="process-company" leftSection={<IconBuilding size={16} />}>
            Process Company Information
          </Tabs.Tab>
          <Tabs.Tab value="markdown-editor" leftSection={<IconEdit size={16} />}>
            Markdown Editor
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="import-resume" pt="md">
          <ResumeImport />
        </Tabs.Panel>

        <Tabs.Panel value="process-job" pt="md">
          <JobProcessor />
        </Tabs.Panel>

        <Tabs.Panel value="process-company" pt="md">
          <CompanyProcessor />
        </Tabs.Panel>

        <Tabs.Panel value="markdown-editor" pt="md">
          <MarkdownEditor />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
