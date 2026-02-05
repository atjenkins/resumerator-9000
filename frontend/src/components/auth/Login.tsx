import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Anchor,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onSwitchToSignUp: () => void;
}

export function Login({ onSwitchToSignUp }: LoginProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    setShowReset(true);
  };

  if (showReset) {
    return <ResetPassword onBack={() => setShowReset(false)} />;
  }

  return (
    <Container size={420} my={40}>
      <Center>
        <Stack gap="md" align="center" mb="xl">
          <Title order={1}>Resumerator 9000</Title>
          <Text c="dimmed" size="sm">
            AI-powered resume builder and reviewer
          </Text>
        </Stack>
      </Center>

      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center" mb="md">
          Welcome back
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>

        <Stack gap="sm" mt="lg">
          <Text c="dimmed" size="sm" ta="center">
            <Anchor component="button" type="button" c="dimmed" onClick={handleResetPassword} size="sm">
              Forgot password?
            </Anchor>
          </Text>

          <Text c="dimmed" size="sm" ta="center">
            Don't have an account?{' '}
            <Anchor component="button" type="button" onClick={onSwitchToSignUp}>
              Sign up
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}

// Reset Password Component
function ResetPassword({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack gap="md" align="center">
            <Title order={2}>Check your email</Title>
            <Text c="dimmed" size="sm" ta="center">
              We've sent you a password reset link. Click the link in your email to create a new
              password.
            </Text>
            <Button variant="subtle" onClick={onBack}>
              Back to login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center" mb="md">
          Reset password
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="lg">
          Enter your email and we'll send you a reset link
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>

            <Button variant="subtle" fullWidth onClick={onBack}>
              Back to login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
