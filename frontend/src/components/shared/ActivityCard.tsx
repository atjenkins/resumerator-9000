import { Card, Group, Text, Badge, Stack } from "@mantine/core";
import { getActionColor, formatDuration } from "../../utils/formatting";

interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  duration_ms?: number;
  display_title: string;
  details?: Record<string, any>;
  created_at: string;
}

interface ActivityCardProps {
  activity: ActivityLogEntry;
  onNavigate: (page: string, state?: any) => void;
}

export function ActivityCard({ activity, onNavigate }: ActivityCardProps) {
  const handleClick = () => {
    if (!activity.entity_id) return;

    // Navigate based on entity type
    switch (activity.entity_type) {
      case "resume":
        onNavigate("resume-detail", { id: activity.entity_id });
        break;
      case "company":
        onNavigate("company-detail", { id: activity.entity_id });
        break;
      case "job":
        onNavigate("job-detail", { id: activity.entity_id });
        break;
      case "analysis":
        onNavigate("analysis-detail", { id: activity.entity_id });
        break;
    }
  };

  return (
    <Card
      shadow="sm"
      padding="xl"
      withBorder
      style={{ 
        cursor: activity.entity_id ? "pointer" : "default",
        borderWidth: "1.5px",
      }}
      onClick={handleClick}
    >
      <Stack gap="xs">
        <Group justify="apart" align="start">
          <Group gap="sm">
            <Badge color={getActionColor(activity.action)}>
              {activity.action.toUpperCase()}
            </Badge>
            <Badge variant="light">{activity.entity_type}</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {new Date(activity.created_at).toLocaleString()}
          </Text>
        </Group>

        <Text fw={500}>{activity.display_title}</Text>

        {activity.duration_ms && (
          <Text size="xs" c="dimmed">
            Completed in {formatDuration(activity.duration_ms)}
          </Text>
        )}

        {activity.details && Object.keys(activity.details).length > 0 && (
          <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(activity.details, null, 2)}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
