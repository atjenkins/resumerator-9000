import { Box, Title, Text, Container } from '@mantine/core';

export function Header() {
  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        marginBottom: '2rem',
      }}
    >
      <Container size="xl">
        <Title order={1} c="white" ta="center" mb="xs">
          Resume Reviewer
        </Title>
        <Text c="white" ta="center" opacity={0.9} size="lg">
          AI-Powered Resume Analysis & Building
        </Text>
      </Container>
    </Box>
  );
}
