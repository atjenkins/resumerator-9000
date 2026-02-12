import { Modal, Stack, Text, Button, Group, FileButton } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";

interface UploadResumeModalProps {
  opened: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function UploadResumeModal({
  opened,
  onClose,
  onUpload,
  title = "Upload Resume",
  description,
  loading = false,
}: UploadResumeModalProps) {
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    onUpload(file);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        <Text size="sm" fw={500}>
          PDF and DOCX files supported (up to 10MB).
        </Text>
        <Group justify="space-between" mt="md">
          <FileButton
            onChange={handleFileChange}
            accept="application/pdf,.pdf,.docx"
            disabled={loading}
          >
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={16} />}
                loading={loading}
                disabled={loading}
              >
                Choose file
              </Button>
            )}
          </FileButton>
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
