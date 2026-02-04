import { Container, Box } from '@mantine/core';
import { Header } from './Header';
import { Navigation } from './Navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Header />
      <Container size="xl">
        <Box bg="white" p="xl" style={{ borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <Navigation />
          {children}
        </Box>
      </Container>
    </Box>
  );
}
