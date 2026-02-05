import { Box, Title, Text, Container, Group, Button, Menu, Avatar } from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        marginBottom: '2rem',
      }}
    >
      <Container size="xl">
        <Group justify="space-between" align="center" mb="xs">
          <Box style={{ flex: 1 }} />
          <Title order={1} c="white" ta="center" style={{ flex: 1 }}>
            Resumerator 9000
          </Title>
          <Group justify="flex-end" style={{ flex: 1 }}>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="white"
                  leftSection={<Avatar size="sm" radius="xl" color="blue" />}
                >
                  {profile?.display_name || 'User'}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />} disabled>
                  {profile?.display_name}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={() => signOut()}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
        <Text c="white" ta="center" opacity={0.9} size="lg">
          AI-Powered Resume Analysis & Building
        </Text>
      </Container>
    </Box>
  );
}
