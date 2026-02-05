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

interface SignUpProps {
  onSwitchToLogin: () => void;
}

export function SignUp({ onSwitchToLogin }: SignUpProps) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      displayName: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value, values) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, values.displayName);
      // User will be automatically logged in after sign up
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

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
          Create account
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              {...form.getInputProps('displayName')}
            />

            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              required
              {...form.getInputProps('password')}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps('confirmPassword')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Create account
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="lg">
          Already have an account?{' '}
          <Anchor component="button" type="button" onClick={onSwitchToLogin}>
            Sign in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
