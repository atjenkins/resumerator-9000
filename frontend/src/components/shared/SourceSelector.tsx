import { Radio, Group, Stack, Select, Textarea, Box } from '@mantine/core';
import { FileUpload } from './FileUpload';

interface SourceSelectorProps {
  label: string;
  source: 'project' | 'text' | 'file';
  onSourceChange: (source: 'project' | 'text' | 'file') => void;
  
  // Project source
  projectOptions?: Array<{ value: string; label: string }>;
  projectValue?: string;
  onProjectChange?: (value: string | null) => void;
  projectPlaceholder?: string;
  
  // Text source
  textValue?: string;
  onTextChange?: (value: string) => void;
  textPlaceholder?: string;
  textRows?: number;
  
  // File source
  fileValue?: File | null;
  onFileChange?: (file: File | null) => void;
  fileAccept?: string;
  
  withFile?: boolean;
}

export function SourceSelector({
  label,
  source,
  onSourceChange,
  projectOptions = [],
  projectValue,
  onProjectChange,
  projectPlaceholder = 'Select...',
  textValue,
  onTextChange,
  textPlaceholder,
  textRows = 4,
  fileValue,
  onFileChange,
  fileAccept,
  withFile = false,
}: SourceSelectorProps) {
  return (
    <Stack gap="sm">
      <Group>
        <Radio
          value="project"
          label="From Project"
          checked={source === 'project'}
          onChange={() => onSourceChange('project')}
        />
        <Radio
          value="text"
          label="Paste Text"
          checked={source === 'text'}
          onChange={() => onSourceChange('text')}
        />
        {withFile && (
          <Radio
            value="file"
            label="Upload File"
            checked={source === 'file'}
            onChange={() => onSourceChange('file')}
          />
        )}
      </Group>

      <Box>
        {source === 'project' && onProjectChange && (
          <Select
            label={label}
            data={projectOptions}
            value={projectValue}
            onChange={onProjectChange}
            placeholder={projectPlaceholder}
            searchable
          />
        )}

        {source === 'text' && onTextChange && (
          <Textarea
            label={label}
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={textPlaceholder}
            rows={textRows}
          />
        )}

        {source === 'file' && onFileChange && (
          <FileUpload
            label={label}
            value={fileValue || null}
            onChange={onFileChange}
            accept={fileAccept}
          />
        )}
      </Box>
    </Stack>
  );
}
