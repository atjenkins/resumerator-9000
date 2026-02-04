import { Card, Text, Group, Badge } from '@mantine/core';
import type { SavedResult } from '../../services/types';

interface ResultCardProps {
  result: SavedResult;
  onClick: () => void;
}

export function ResultCard({ result, onClick }: ResultCardProps) {
  const date = new Date(result.metadata.timestamp).toLocaleDateString();

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      withBorder 
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Group>
          <Badge color={getTypeColor(result.metadata.type)}>{getTypeLabel(result.metadata.type)}</Badge>
          <Text size="sm" c="dimmed">
            {date}
          </Text>
        </Group>
      </Group>

      <Group gap="xs" mt="xs">
        {result.metadata.person && (
          <Text size="sm" c="dimmed">
            Person: {result.metadata.person}
          </Text>
        )}
        {result.metadata.company && (
          <Text size="sm" c="dimmed">
            | Company: {result.metadata.company}
          </Text>
        )}
        {result.metadata.job && (
          <Text size="sm" c="dimmed">
            | Job: {result.metadata.job}
          </Text>
        )}
      </Group>
    </Card>
  );
}

function getTypeColor(type: string) {
  switch (type) {
    case 'general':
      return 'gray';
    case 'job':
      return 'blue';
    case 'company':
      return 'green';
    case 'review':
      return 'purple';
    case 'build':
      return 'cyan';
    default:
      return 'gray';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'general':
      return 'General Review';
    case 'job':
      return 'Job Review';
    case 'company':
      return 'Company Review';
    case 'review':
      return 'Full Review';
    case 'build':
      return 'Build';
    default:
      return type;
  }
}
