import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Group,
  Text,
  Button,
  MultiSelect,
  SimpleGrid,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { ActivityCard } from "../components/shared/ActivityCard";
import { getActivityLog, type ActivityLogEntry } from "../services/api";

interface HistoryPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Multi-select filters with defaults (all except "update")
  const [filterActions, setFilterActions] = useState<string[]>([
    "create",
    "delete",
    "analyze",
    "generate",
    "upload",
    "enrich",
    "parse",
  ]);
  const [filterEntityTypes, setFilterEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    loadActivity();
  }, [filterActions, filterEntityTypes]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      
      // Get all activities
      const { activities: allData } = await getActivityLog({ limit: 1000 });
      
      // Filter client-side for multi-select support
      let filtered = allData;
      
      if (filterActions.length > 0) {
        filtered = filtered.filter((a) => filterActions.includes(a.action));
      }
      
      if (filterEntityTypes.length > 0) {
        filtered = filtered.filter((a) => filterEntityTypes.includes(a.entity_type));
      }
      
      setActivities(filtered);
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


  return (
    <Stack gap="xl">
      <Group justify="apart">
        <Title order={1}>Activity History</Title>
        <Button onClick={loadActivity} loading={loading}>
          Refresh
        </Button>
      </Group>

      <Card shadow="sm" padding={isMobile ? "md" : "lg"}>
        <Stack gap="md">
          <Text fw={500} size="sm">Filters</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <MultiSelect
              label="Actions"
              placeholder="Select actions to show"
              value={filterActions}
              onChange={setFilterActions}
              data={[
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
            />
            <MultiSelect
              label="Entity Types"
              placeholder="All entity types"
              value={filterEntityTypes}
              onChange={setFilterEntityTypes}
              data={[
                { value: "resume", label: "Resume" },
                { value: "profile", label: "Profile" },
                { value: "company", label: "Company" },
                { value: "job", label: "Job" },
                { value: "analysis", label: "Analysis" },
              ]}
              clearable
            />
          </SimpleGrid>
        </Stack>
      </Card>

      <Stack gap="md">
        {loading && <Text c="dimmed">Loading...</Text>}

        {!loading && activities.length === 0 && (
          <Card shadow="sm" padding={isMobile ? "md" : "lg"}>
            <Text c="dimmed">No activity found</Text>
          </Card>
        )}

        {!loading &&
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onNavigate={onNavigate}
            />
          ))}
      </Stack>
    </Stack>
  );
}
