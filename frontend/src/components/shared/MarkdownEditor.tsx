import { Textarea, Button, Group, Stack } from "@mantine/core";
import { useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
  placeholder?: string;
  minRows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  saving = false,
  placeholder = "Enter markdown content...",
  minRows = 20,
}: MarkdownEditorProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <Stack gap="md">
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        minRows={minRows}
        autosize
        styles={{
          input: {
            fontFamily: "monospace",
            fontSize: "14px",
          },
        }}
      />
      <Group justify="flex-end">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges || saving}
        >
          Save Changes
        </Button>
      </Group>
    </Stack>
  );
}
