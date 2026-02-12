import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  TextInput,
  Button,
  Group,
  Card,
  Text,
  Select,
  Loader,
  Badge,
} from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { MarkdownEditor } from "../components/shared/MarkdownEditor";
import {
  getResume,
  updateResume,
  deleteResume,
  getCompanies,
  getJobs,
} from "../services/api";

interface ResumeDetailPageProps {
  onNavigate: (page: string) => void;
  resumeId: string;
}

interface Resume {
  id: string;
  title: string;
  content: string;
  is_primary: boolean;
  company_id?: string;
  job_id?: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
}

export function ResumeDetailPage({
  onNavigate,
  resumeId,
}: ResumeDetailPageProps) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadResume();
    loadCompanies();
    loadJobs();
  }, [resumeId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const data = (await getResume(resumeId)) as Resume;
      setResume(data);
      setTitle(data.title);
      setContent(data.content);
      setCompanyId(data.company_id || null);
      setJobId(data.job_id || null);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load resume",
        color: "red",
      });
      onNavigate("resumes");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = (await getCompanies()) as Company[];
      setCompanies(data);
    } catch (error) {
      console.error("Failed to load companies", error);
    }
  };

  const loadJobs = async () => {
    try {
      const data = (await getJobs()) as Job[];
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateResume(resumeId, {
        title,
        content,
        companyId: companyId || undefined,
        jobId: jobId || undefined,
      });
      notifications.show({
        title: "Success",
        message: "Resume saved",
        color: "green",
      });
      await loadResume();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save resume",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteResume(resumeId);
      notifications.show({
        title: "Success",
        message: "Resume deleted",
        color: "green",
      });
      onNavigate("resumes");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete resume",
        color: "red",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text c="dimmed">Loading resume...</Text>
      </Stack>
    );
  }

  if (!resume) {
    return (
      <Stack>
        <Text>Resume not found</Text>
        <Button onClick={() => onNavigate("resumes")}>Back to Resumes</Button>
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
            onClick={() => onNavigate("resumes")}
          >
            Back
          </Button>
          <Title order={1}>Edit Resume</Title>
          {resume.is_primary && <Badge color="yellow">Primary</Badge>}
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
            label="Resume Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Associated Company (optional)"
            placeholder="Select a company"
            value={companyId}
            onChange={setCompanyId}
            data={[
              { value: "", label: "None" },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            clearable
          />

          <Select
            label="Associated Job (optional)"
            placeholder="Select a job"
            value={jobId}
            onChange={setJobId}
            data={[
              { value: "", label: "None" },
              ...jobs.map((j) => ({ value: j.id, label: j.title })),
            ]}
            clearable
          />

          <Text fw={500} size="sm" mb="xs">
            Resume Content (Markdown)
          </Text>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            saving={saving}
            placeholder="# Resume

## Experience

## Education

## Skills
"
          />
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg">
        <Title order={3} mb="md">
          AI Operations
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Use AI to analyze or generate a tailored version of this resume
        </Text>
        <Group>
          <Button
            variant="outline"
            onClick={() => onNavigate("analyze", { resumeId })}
          >
            Analyze this Resume
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("generate", { resumeId })}
          >
            Generate from this Resume
          </Button>
        </Group>
      </Card>

      <Text size="xs" c="dimmed">
        Created: {new Date(resume.created_at).toLocaleString()} | Last updated:{" "}
        {new Date(resume.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
