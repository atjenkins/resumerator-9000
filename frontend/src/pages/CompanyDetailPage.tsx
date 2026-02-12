import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  TextInput,
  Button,
  Group,
  Card,
  Text,
  Loader,
} from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { MarkdownEditor } from "../components/shared/MarkdownEditor";
import { getCompany, updateCompany, deleteCompany } from "../services/api";

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
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteCompany(companyId);
      notifications.show({
        title: "Success",
        message: "Company deleted",
        color: "green",
      });
      onNavigate("companies");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete company",
        color: "red",
      });
      setDeleting(false);
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
        <Group>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={deleting}
          >
            Save Changes
          </Button>
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            loading={deleting}
            disabled={saving}
          >
            Delete
          </Button>
        </Group>
      </Group>

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <TextInput
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <Text fw={500} size="sm" mb="xs">
              Company Information (Markdown)
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              Add details about the company, culture, values, etc.
            </Text>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onSave={handleSave}
              saving={saving}
              placeholder="# Company Name

## About

## Culture

## Values
"
            />
          </div>
        </Stack>
      </Card>

      <Text size="xs" c="dimmed">
        Created: {new Date(company.created_at).toLocaleString()} | Last
        updated: {new Date(company.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
