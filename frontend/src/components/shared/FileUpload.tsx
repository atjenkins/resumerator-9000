import { FileInput } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value: File | null;
  description?: string;
}

export function FileUpload({ label, accept, onChange, value, description }: FileUploadProps) {
  return (
    <FileInput
      label={label}
      description={description}
      placeholder="Choose file or drag and drop"
      accept={accept}
      value={value}
      onChange={onChange}
      leftSection={<IconUpload size={16} />}
    />
  );
}
