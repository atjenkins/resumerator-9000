import { Card, Group, Text, Badge, Stack, Progress } from "@mantine/core";
import { IconReportAnalytics } from "@tabler/icons-react";
import type { Analysis } from "../../services/api";
import { formatRelativeDate, getScoreColor, getFitRatingColor } from "../../utils/formatting";

interface AnalysisCardProps {
  analysis: Analysis;
  onClick?: () => void;
  compact?: boolean;
}

export function AnalysisCard({ analysis, onClick, compact = false }: AnalysisCardProps) {

  return (
    <Card
      shadow="sm"
      padding={compact ? "md" : "xl"}
      withBorder
      style={{ 
        cursor: onClick ? "pointer" : "default",
        borderWidth: "1.5px",
      }}
      onClick={onClick}
    >
      <Stack gap={compact ? "xs" : "sm"}>
        <Group justify="apart" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <IconReportAnalytics size={compact ? 16 : 20} />
            <Text size={compact ? "xs" : "sm"} fw={500} truncate>
              {analysis.analysis_type === "job-fit" ? "Job Fit Analysis" : "General Analysis"}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            {formatRelativeDate(analysis.created_at)}
          </Text>
        </Group>

        {!compact && (
          <Group gap="xs">
            <Badge size="xs" variant="light">
              {analysis.source_type === "resume" ? "Resume" : "Profile"}
            </Badge>
            {analysis.source_resume && (
              <Text size="xs" c="dimmed" truncate>
                {analysis.source_resume.title}
              </Text>
            )}
          </Group>
        )}

        {analysis.job && (
          <Text size="xs" c="dimmed" truncate>
            For: {analysis.job.title}
            {analysis.company && ` at ${analysis.company.name}`}
          </Text>
        )}

        {analysis.score !== undefined && (
          <div>
            <Group justify="apart" mb={4}>
              <Text size="xs" fw={500}>
                Score
              </Text>
              <Text size="xs" c={getScoreColor(analysis.score)}>
                {analysis.score}/100
              </Text>
            </Group>
            <Progress
              value={analysis.score}
              color={getScoreColor(analysis.score)}
              size={compact ? "xs" : "sm"}
            />
          </div>
        )}

        {analysis.fit_rating && (
          <Badge size="xs" color={getFitRatingColor(analysis.fit_rating)}>
            {analysis.fit_rating.toUpperCase()}
          </Badge>
        )}

        {!compact && analysis.summary && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {analysis.summary}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
