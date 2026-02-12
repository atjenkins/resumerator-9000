import { Card, Group, Text, Badge, Stack } from "@mantine/core";
import { IconFileText, IconStar } from "@tabler/icons-react";
import type { Resume } from "../../services/api";
import { formatRelativeDate, getOriginColor, shouldShowUpdated } from "../../utils/formatting";

interface ResumeCardProps {
  resume: Resume;
  onClick?: () => void;
  compact?: boolean;
  companyName?: string;
  jobTitle?: string;
  showHoverEffect?: boolean;
}

export function ResumeCard({ 
  resume, 
  onClick, 
  compact = false,
  companyName,
  jobTitle,
  showHoverEffect = false,
}: ResumeCardProps) {
  const showUpdated = shouldShowUpdated(resume.created_at, resume.updated_at);

  return (
    <Card
      shadow="sm"
      padding={compact ? "md" : "xl"}
      withBorder
      style={{
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        transition: showHoverEffect ? "transform 0.2s, box-shadow 0.2s" : undefined,
        borderWidth: "1.5px",
      }}
      onClick={onClick}
      onMouseEnter={showHoverEffect ? (e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      } : undefined}
      onMouseLeave={showHoverEffect ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      } : undefined}
    >
      <Stack gap={compact ? "xs" : "sm"}>
        <Group justify="apart" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {!compact && <IconFileText size={20} />}
            <Text size={compact ? "xs" : "sm"} fw={500} truncate>
              {resume.title}
            </Text>
          </Group>
          {resume.is_primary && (
            <Badge
              size="xs"
              color="yellow"
              leftSection={<IconStar size={12} />}
            >
              Primary
            </Badge>
          )}
        </Group>

        {!compact && (companyName || jobTitle) && (
          <Group gap="xs">
            {companyName && (
              <Badge variant="light" color="blue" size="sm">
                {companyName}
              </Badge>
            )}
            {jobTitle && (
              <Badge variant="light" color="grape" size="sm">
                {jobTitle}
              </Badge>
            )}
          </Group>
        )}

        {compact && (
          <Group gap="xs" wrap="wrap">
            <Badge size="xs" color={getOriginColor(resume.origin)}>
              {resume.origin}
            </Badge>
            {resume.is_edited && (
              <Badge size="xs" variant="outline">
                Edited
              </Badge>
            )}
          </Group>
        )}

        {!compact && resume.generation_summary && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {resume.generation_summary}
          </Text>
        )}

        <Stack gap="xs" mt={compact ? undefined : "auto"}>
          <Text size="xs" c="dimmed">
            {compact ? formatRelativeDate(resume.updated_at) : `Created: ${new Date(resume.created_at).toLocaleString()}`}
          </Text>
          {!compact && showUpdated && (
            <Text size="xs" c="dimmed">
              Updated: {new Date(resume.updated_at).toLocaleString()}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
