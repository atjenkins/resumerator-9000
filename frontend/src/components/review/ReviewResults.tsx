import { Paper, Title, Text, Stack, Group, Badge, Card, List, Progress } from '@mantine/core';
import type { ReviewResult, JobFitResult } from '../../services/types';

interface ReviewResultsProps {
  result: ReviewResult | JobFitResult;
}

export function ReviewResults({ result }: ReviewResultsProps) {
  const isJobFit = 'fitRating' in result;

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Title order={2} mb="md">
        Review Results
      </Title>

      <Stack gap="lg">
        <Group justify="center">
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={700} c="violet">
              Score: {result.score}/100
            </Text>
            {isJobFit && (
              <Badge size="lg" color={getFitColor(result.fitRating)} mt="xs">
                {result.fitRating.toUpperCase()}
              </Badge>
            )}
          </div>
        </Group>

        <Card>
          <Title order={4} mb="sm">
            Summary
          </Title>
          <Text>{result.summary}</Text>
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Strengths
          </Title>
          <List>
            {result.strengths.map((s, i) => (
              <List.Item key={i}>{s}</List.Item>
            ))}
          </List>
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Suggested Improvements
          </Title>
          <List>
            {result.improvements.map((s, i) => (
              <List.Item key={i}>{s}</List.Item>
            ))}
          </List>
        </Card>

        {isJobFit && result.missingKeywords && result.missingKeywords.length > 0 && (
          <Card>
            <Title order={4} mb="sm">
              Missing Keywords
            </Title>
            <Group gap="xs">
              {result.missingKeywords.map((k, i) => (
                <Badge key={i} variant="light" color="red">
                  {k}
                </Badge>
              ))}
            </Group>
          </Card>
        )}

        <Title order={3} mt="xl">
          Category Breakdown
        </Title>
        {result.categories.map((cat, i) => (
          <Card key={i}>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>{cat.name}</Text>
              <Text fw={600} c="violet">
                {cat.score}/100
              </Text>
            </Group>
            <Progress value={cat.score} color="violet" mb="xs" />
            <Text size="sm" c="dimmed">
              {cat.feedback}
            </Text>
          </Card>
        ))}
      </Stack>
    </Paper>
  );
}

function getFitColor(rating: string) {
  switch (rating) {
    case 'excellent':
      return 'green';
    case 'good':
      return 'blue';
    case 'moderate':
      return 'yellow';
    case 'poor':
      return 'red';
    default:
      return 'gray';
  }
}
