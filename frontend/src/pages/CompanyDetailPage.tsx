import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Card,
  Text,
  Loader,
} from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getCompany, updateCompany } from "../services/api";

interface CompanyDetailPageProps {
  onNavigate: (page: string) => void;
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function CompanyDetailPage({
  onNavigate,
  companyId,
}: CompanyDetailPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = (await getCompany(companyId)) as Company;
      setCompany(data);
      setName(data.name);
      setContent(data.content);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load company",
        color: "red",
      });
      onNavigate("companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCompany(companyId, { name, content });
      notifications.show({
        title: "Success",
        message: "Company saved",
        color: "green",
      });
      await loadCompany();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save company",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text c="dimmed">Loading company...</Text>
      </Stack>
    );
  }

  if (!company) {
    return (
      <Stack>
        <Text>Company not found</Text>
        <Button onClick={() => onNavigate("companies")}>
          Back to Companies
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => onNavigate("companies")}
          >
            Back
          </Button>
          <Title order={1}>Edit Company</Title>
        </Group>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSave}
          loading={saving}
        >
          Save Changes
        </Button>
      </Group>

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <TextInput
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Company Information (Markdown)"
            description="Add details about the company, culture, values, etc."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            minRows={20}
            styles={{ input: { fontFamily: "monospace", fontSize: "13px" } }}
          />
        </Stack>
      </Card>

      <Text size="xs" c="dimmed">
        Created: {new Date(company.created_at).toLocaleString()} | Last
        updated: {new Date(company.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
