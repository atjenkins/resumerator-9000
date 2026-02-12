import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Group,
  Button,
  Text,
  Progress,
  Badge,
  Divider,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import { getAnalysis, deleteAnalysis, type Analysis } from "../services/api";
import { getScoreColor, getFitRatingColor } from "../utils/formatting";

interface AnalysisDetailPageProps {
  onNavigate: (page: string, state?: any) => void;
  analysisId: string;
}

export function AnalysisDetailPage({
  onNavigate,
  analysisId,
}: AnalysisDetailPageProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getAnalysis(analysisId);
      setAnalysis(data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load analysis",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      setDeleting(true);
      await deleteAnalysis(analysisId);
      notifications.show({
        title: "Success",
        message: "Analysis deleted",
        color: "green",
      });
      onNavigate("dashboard");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete analysis",
        color: "red",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Stack gap="xl">
        <Title order={1}>Loading...</Title>
      </Stack>
    );
  }

  if (!analysis) {
    return (
      <Stack gap="xl">
        <Title order={1}>Analysis Not Found</Title>
        <Button onClick={() => onNavigate("dashboard")}>Back to Dashboard</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="apart">
        <Group>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => onNavigate("dashboard")}
          >
            <IconArrowLeft />
          </ActionIcon>
          <div>
            <Title order={1}>Analysis Details</Title>
            <Text size="sm" c="dimmed">
              {new Date(analysis.created_at).toLocaleString()}
            </Text>
          </div>
        </Group>
        <Group>
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            loading={deleting}
          >
            Delete
          </Button>
        </Group>
      </Group>

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <Group justify="apart">
            <div>
              <Text fw={500} size="sm" c="dimmed">
                Source
              </Text>
              <Text>{analysis.source_type === "resume" ? "Resume" : "Profile"}</Text>
              {analysis.source_resume && (
                <Text size="xs" c="dimmed">
                  {analysis.source_resume.title}
                </Text>
              )}
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed">
                Type
              </Text>
              <Badge>{analysis.analysis_type}</Badge>
            </div>
          </Group>

          {(analysis.job || analysis.company) && (
            <>
              <Divider />
              <Group>
                {analysis.company && (
                  <div>
                    <Text fw={500} size="sm" c="dimmed">
                      Company
                    </Text>
                    <Text>{analysis.company.name}</Text>
                  </div>
                )}
                {analysis.job && (
                  <div>
                    <Text fw={500} size="sm" c="dimmed">
                      Job
                    </Text>
                    <Text>{analysis.job.title}</Text>
                  </div>
                )}
              </Group>
            </>
          )}
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <Group justify="apart" align="start">
            <div>
              <Title order={2}>Results</Title>
              {analysis.duration_ms && (
                <Text size="xs" c="dimmed">
                  Completed in {(analysis.duration_ms / 1000).toFixed(1)}s
                </Text>
              )}
            </div>
            {analysis.score !== undefined && (
              <Badge size="xl" color={getScoreColor(analysis.score)}>
                Score: {analysis.score}/100
              </Badge>
            )}
          </Group>

          {analysis.fit_rating && (
            <div>
              <Text fw={500} size="sm" c="dimmed">
                Fit Rating
              </Text>
              <Badge size="lg" color={getFitRatingColor(analysis.fit_rating)}>
                {analysis.fit_rating.toUpperCase()}
              </Badge>
            </div>
          )}

          {analysis.summary && (
            <div>
              <Text fw={500} mb="xs">
                Summary
              </Text>
              <Text>{analysis.summary}</Text>
            </div>
          )}

          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
              <Text fw={500} mb="xs">
                Strengths
              </Text>
              <Stack gap="xs">
                {analysis.strengths.map((strength: any, i: number) => (
                  <Text key={i} size="sm">
                    ✓ {typeof strength === "string" ? strength : strength.text || JSON.stringify(strength)}
                  </Text>
                ))}
              </Stack>
            </div>
          )}

          {analysis.improvements && analysis.improvements.length > 0 && (
            <div>
              <Text fw={500} mb="xs">
                Areas for Improvement
              </Text>
              <Stack gap="xs">
                {analysis.improvements.map((improvement: any, i: number) => (
                  <Text key={i} size="sm">
                    • {typeof improvement === "string" ? improvement : improvement.text || JSON.stringify(improvement)}
                  </Text>
                ))}
              </Stack>
            </div>
          )}

          {analysis.categories && analysis.categories.length > 0 && (
            <>
              <Divider />
              <div>
                <Text fw={500} mb="md">
                  Category Scores
                </Text>
                <Stack gap="md">
                  {analysis.categories.map((category: any, i: number) => (
                    <div key={i}>
                      <Group justify="apart" mb="xs">
                        <Text size="sm" fw={500}>
                          {category.name}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {category.score}/100
                        </Text>
                      </Group>
                      <Progress
                        value={category.score}
                        color={getScoreColor(category.score)}
                        mb="xs"
                      />
                      {category.feedback && (
                        <Text size="xs" c="dimmed">
                          {category.feedback}
                        </Text>
                      )}
                    </div>
                  ))}
                </Stack>
              </div>
            </>
          )}

          {analysis.analysis_type === "job-fit" && (
            <>
              {analysis.missing_keywords && analysis.missing_keywords.length > 0 && (
                <div>
                  <Text fw={500} mb="xs">
                    Missing Keywords
                  </Text>
                  <Group gap="xs">
                    {analysis.missing_keywords.map((keyword: any, i: number) => (
                      <Badge key={i} color="red" variant="light">
                        {typeof keyword === "string" ? keyword : keyword.text || JSON.stringify(keyword)}
                      </Badge>
                    ))}
                  </Group>
                </div>
              )}

              {analysis.transferable_skills && analysis.transferable_skills.length > 0 && (
                <div>
                  <Text fw={500} mb="xs">
                    Transferable Skills
                  </Text>
                  <Group gap="xs">
                    {analysis.transferable_skills.map((skill: any, i: number) => (
                      <Badge key={i} color="blue" variant="light">
                        {typeof skill === "string" ? skill : skill.text || JSON.stringify(skill)}
                      </Badge>
                    ))}
                  </Group>
                </div>
              )}

              {analysis.targeted_suggestions && analysis.targeted_suggestions.length > 0 && (
                <div>
                  <Text fw={500} mb="xs">
                    Targeted Suggestions
                  </Text>
                  <Stack gap="xs">
                    {analysis.targeted_suggestions.map((suggestion: any, i: number) => (
                      <Text key={i} size="sm">
                        → {typeof suggestion === "string" ? suggestion : suggestion.text || JSON.stringify(suggestion)}
                      </Text>
                    ))}
                  </Stack>
                </div>
              )}
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
