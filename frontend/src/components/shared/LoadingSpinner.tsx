import { Loader, Center, Stack, Text } from '@mantine/core';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">{message}</Text>
      </Stack>
    </Center>
  );
}
