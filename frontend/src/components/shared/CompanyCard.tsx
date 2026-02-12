import { Card, Group, Text, Stack } from "@mantine/core";
import { IconBriefcase } from "@tabler/icons-react";
import { formatRelativeDate, shouldShowUpdated } from "../../utils/formatting";

interface Company {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
  compact?: boolean;
  showHoverEffect?: boolean;
}

export function CompanyCard({ 
  company, 
  onClick, 
  compact = false,
  showHoverEffect = false,
}: CompanyCardProps) {
  const showUpdated = company.created_at && company.updated_at
    ? shouldShowUpdated(company.created_at, company.updated_at)
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
          <IconBriefcase size={compact ? 16 : 24} />
          <Text size={compact ? "xs" : "sm"} fw={500} truncate>
            {company.name}
          </Text>
        </Group>

        {(company.created_at || company.updated_at) && (
          <Stack gap="xs" mt={compact ? undefined : "auto"}>
            <Text size="xs" c="dimmed">
              {compact 
                ? formatRelativeDate(company.updated_at || company.created_at!) 
                : `Created: ${new Date(company.created_at!).toLocaleString()}`
              }
            </Text>
            {!compact && showUpdated && company.updated_at && (
              <Text size="xs" c="dimmed">
                Updated: {new Date(company.updated_at).toLocaleString()}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
