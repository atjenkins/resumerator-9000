import { Paper, Title, Text, Stack, Card, List, Group, Badge, Textarea, Button, Box } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import type { BuilderResult } from '../../services/types';
import { notifications } from '@mantine/notifications';

interface BuildResultsProps {
  result: BuilderResult;
}

export function BuildResults({ result }: BuildResultsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(result.markdown);
    notifications.show({
      title: 'Copied!',
      message: 'Resume copied to clipboard',
      color: 'green',
    });
  };

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Title order={2} mb="md">
        Resume Generated!
      </Title>

      <Stack gap="lg">
        <Card>
          <Title order={4} mb="sm">
            Tailoring Summary
          </Title>
          <Text>{result.summary}</Text>
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Emphasized Skills
          </Title>
          <Group gap="xs">
            {result.emphasizedSkills.map((skill, i) => (
              <Badge key={i} variant="light" color="violet">
                {skill}
              </Badge>
            ))}
          </Group>
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Selected Experiences
          </Title>
          <List>
            {result.selectedExperiences.map((exp, i) => (
              <List.Item key={i}>{exp}</List.Item>
            ))}
          </List>
        </Card>

        <Box>
          <Group justify="space-between" mb="sm">
            <Title order={3}>Generated Resume</Title>
            <Button leftSection={<IconCopy size={16} />} variant="light" onClick={handleCopy}>
              Copy to Clipboard
            </Button>
          </Group>
          <Textarea
            value={result.markdown}
            readOnly
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: '14px',
                minHeight: '600px',
              },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
