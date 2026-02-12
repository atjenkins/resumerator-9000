import { useState, useEffect } from "react";
import { Title, Stack, Card, Text, Badge, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getAnalyses } from "../services/api";

interface Analysis {
  id: string;
  type: "review" | "build";
  content: string;
  created_at: string;
  resume_id?: string;
  company_id?: string;
  job_id?: string;
  metadata?: {
    duration_ms?: number;
    [key: string]: any;
  };
}

export function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = (await getAnalyses()) as any;
      // Backend returns { results: [], pagination: {} }
      const analyses = data.results || data || [];
      setAnalyses(analyses as Analysis[]);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load analysis history",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Loading history...</Text>;
  }

  return (
    <Stack gap="xl">
      <Title order={1}>Analysis History</Title>

      {analyses.length === 0 ? (
        <Card shadow="sm" padding="xl">
          <Text c="dimmed" ta="center">
            No analyses yet. Run resume analyses or tailoring to see history
            here.
          </Text>
        </Card>
      ) : (
        <Stack gap="md">
          {analyses.map((analysis) => {
            const durationMs = analysis.metadata?.duration_ms;
            const durationText = durationMs
              ? durationMs >= 60000
                ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
                : `${Math.floor(durationMs / 1000)}s`
              : null;

            return (
              <Card key={analysis.id} shadow="sm" padding="lg">
                <Group justify="apart" mb="sm">
                  <Group>
                    <Badge color={analysis.type === "review" ? "blue" : "green"}>
                      {analysis.type === "review"
                        ? "Analysis"
                        : "Tailored Resume"}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {new Date(analysis.created_at).toLocaleString()}
                    </Text>
                    {durationText && (
                      <Text size="xs" c="dimmed">
                        • Completed in {durationText}
                      </Text>
                    )}
                  </Group>
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }} lineClamp={3}>
                  {analysis.content}
                </Text>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
