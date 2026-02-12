import { useState } from "react";
import { Menu, Button } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { exportProfile, exportEntity } from "../../services/api";

type EntityType = "profile" | "resume" | "company" | "job";

interface ExportMenuProps {
  entityType: EntityType;
  entityId?: string;
  entityName: string;
}

export function ExportMenu({
  entityType,
  entityId,
  entityName,
}: ExportMenuProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    try {
      setLoading(format);
      if (entityType === "profile") {
        await exportProfile(format);
      } else if (entityId) {
        await exportEntity(entityType, entityId, format, entityName);
      } else {
        throw new Error("Missing entity ID");
      }
      notifications.show({
        title: "Export started",
        message: `Downloading as ${format}...`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Export failed",
        message: error instanceof Error ? error.message : "Failed to export",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          loading={loading !== null}
        >
          Export
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => handleExport("markdown")}>
          Markdown (.md)
        </Menu.Item>
        <Menu.Item onClick={() => handleExport("pdf")}>PDF (.pdf)</Menu.Item>
        <Menu.Item onClick={() => handleExport("docx")}>Word (.docx)</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
