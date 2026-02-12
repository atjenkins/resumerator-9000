import { Card, Group, Text, Stack, Badge } from "@mantine/core";
import { IconClipboard } from "@tabler/icons-react";
import { formatRelativeDate, shouldShowUpdated } from "../../utils/formatting";

interface Job {
  id: string;
  title: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface JobCardProps {
  job: Job;
  companyName?: string;
  onClick?: () => void;
  compact?: boolean;
  showHoverEffect?: boolean;
}

export function JobCard({ 
  job, 
  companyName, 
  onClick, 
  compact = false,
  showHoverEffect = false,
}: JobCardProps) {
  const showUpdated = job.created_at && job.updated_at 
    ? shouldShowUpdated(job.created_at, job.updated_at)
    : false;

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
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <IconClipboard size={compact ? 16 : 24} />
          <Text size={compact ? "xs" : "sm"} fw={500} truncate>
            {job.title}
          </Text>
        </Group>

        {companyName && (
          compact ? (
            <Text size="xs" c="dimmed" truncate>
              at {companyName}
            </Text>
          ) : (
            <Badge variant="light" color="blue" size="sm">
              {companyName}
            </Badge>
          )
        )}

        {(job.created_at || job.updated_at) && (
          <Stack gap="xs" mt={compact ? undefined : "auto"}>
            <Text size="xs" c="dimmed">
              {compact 
                ? formatRelativeDate(job.updated_at || job.created_at!) 
                : `Created: ${new Date(job.created_at!).toLocaleString()}`
              }
            </Text>
            {!compact && showUpdated && job.updated_at && (
              <Text size="xs" c="dimmed">
                Updated: {new Date(job.updated_at).toLocaleString()}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
