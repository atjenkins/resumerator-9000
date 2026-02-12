import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Select,
  Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getActivityLog, type ActivityLogEntry } from "../services/api";

interface HistoryPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterEntityType, setFilterEntityType] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
  }, [filterAction, filterEntityType]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const filters: any = { limit: 100 };
      if (filterAction) filters.action = filterAction;
      if (filterEntityType) filters.entityType = filterEntityType;

      const { activities: data } = await getActivityLog(filters);
      setActivities(data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load activity history",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "green";
      case "update":
        return "blue";
      case "delete":
        return "red";
      case "analyze":
        return "purple";
      case "generate":
        return "orange";
      case "upload":
        return "cyan";
      case "enrich":
        return "teal";
      case "parse":
        return "grape";
      default:
        return "gray";
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="apart">
        <Title order={1}>Activity History</Title>
        <Button onClick={loadActivity} loading={loading}>
          Refresh
        </Button>
      </Group>

      <Card shadow="sm" padding="lg">
        <Group gap="md">
          <Select
            placeholder="Filter by action"
            value={filterAction}
            onChange={setFilterAction}
            data={[
              { value: "", label: "All Actions" },
              { value: "create", label: "Create" },
              { value: "update", label: "Update" },
              { value: "delete", label: "Delete" },
              { value: "analyze", label: "Analyze" },
              { value: "generate", label: "Generate" },
              { value: "upload", label: "Upload" },
              { value: "enrich", label: "Enrich" },
              { value: "parse", label: "Parse" },
            ]}
            clearable
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by entity type"
            value={filterEntityType}
            onChange={setFilterEntityType}
            data={[
              { value: "", label: "All Entities" },
              { value: "resume", label: "Resume" },
              { value: "profile", label: "Profile" },
              { value: "company", label: "Company" },
              { value: "job", label: "Job" },
              { value: "analysis", label: "Analysis" },
            ]}
            clearable
            style={{ flex: 1 }}
          />
        </Group>
      </Card>

      <Stack gap="md">
        {loading && <Text c="dimmed">Loading...</Text>}

        {!loading && activities.length === 0 && (
          <Card shadow="sm" padding="lg">
            <Text c="dimmed">No activity found</Text>
          </Card>
        )}

        {!loading &&
          activities.map((activity) => (
            <Card
              key={activity.id}
              shadow="sm"
              padding="lg"
              style={{ cursor: activity.entity_id ? "pointer" : "default" }}
              onClick={() => {
                if (activity.entity_id) {
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
                }
              }}
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
                    Completed in {(activity.duration_ms / 1000).toFixed(1)}s
                  </Text>
                )}

                {activity.details && Object.keys(activity.details).length > 0 && (
                  <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(activity.details, null, 2)}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
      </Stack>
    </Stack>
  );
}
