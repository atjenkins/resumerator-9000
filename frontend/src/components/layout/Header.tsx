import { Box, Title, Text, Container } from '@mantine/core';
import { useThemeStore } from '../../theme/useThemeStore';
import { getTheme } from '../../theme/themes';

export function Header() {
  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);

  return (
    <Box
      style={{
        background: appTheme.headerGradient,
        padding: '2rem 0',
        marginBottom: '2rem',
      }}
    >
      <Container size="xl">
        <Title order={1} c="white" ta="center" mb="xs">
          Resumerator 9000
        </Title>
        <Text c="white" ta="center" opacity={0.9} size="lg">
          AI-Powered Resume Analysis & Building
        </Text>
      </Container>
    </Box>
  );
}
