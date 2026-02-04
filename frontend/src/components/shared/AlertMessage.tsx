import { Alert } from '@mantine/core';
import { IconInfoCircle, IconCheck, IconAlertCircle } from '@tabler/icons-react';

interface AlertMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export function AlertMessage({ type, message, onClose }: AlertMessageProps) {
  const icons = {
    success: <IconCheck size={16} />,
    error: <IconAlertCircle size={16} />,
    info: <IconInfoCircle size={16} />,
  };

  const colors = {
    success: 'green',
    error: 'red',
    info: 'blue',
  };

  return (
    <Alert
      icon={icons[type]}
      color={colors[type]}
      withCloseButton={!!onClose}
      onClose={onClose}
      mb="md"
    >
      {message}
    </Alert>
  );
}
