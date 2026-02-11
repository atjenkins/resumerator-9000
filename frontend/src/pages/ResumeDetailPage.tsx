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
  Select,
  Loader,
  Badge,
} from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  getResume,
  updateResume,
  getCompanies,
  getJobs,
  analyzeResume,
  tailorResume,
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
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoring, setTailoring] = useState(false);

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

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const result = await analyzeResume(resumeId, {
        companyId: companyId || undefined,
        jobId: jobId || undefined,
        save: true,
      });
      notifications.show({
        title: "Analysis Complete",
        message: "Resume analyzed successfully",
        color: "green",
      });
      console.log("Analysis result:", result);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to analyze resume",
        color: "red",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTailor = async () => {
    if (!jobId) {
      notifications.show({
        title: "Error",
        message: "Please select a job to tailor this resume for",
        color: "orange",
      });
      return;
    }

    try {
      setTailoring(true);
      const result = await tailorResume(resumeId, {
        jobId,
        save: true,
      });
      notifications.show({
        title: "Tailoring Complete",
        message: "Tailored resume created",
        color: "green",
      });
      console.log("Tailor result:", result);
      onNavigate("resumes");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to tailor resume",
        color: "red",
      });
    } finally {
      setTailoring(false);
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

          <Textarea
            label="Resume Content (Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            minRows={20}
            styles={{ input: { fontFamily: "monospace", fontSize: "13px" } }}
          />
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg">
        <Title order={3} mb="md">
          AI Operations
        </Title>
        <Group>
          <Button
            variant="light"
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={saving}
          >
            Analyze Resume
          </Button>
          <Button
            variant="light"
            onClick={handleTailor}
            loading={tailoring}
            disabled={saving || !jobId}
          >
            Tailor for Job
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          {jobId
            ? "Analysis and tailoring will use the selected job and company context."
            : "Select a job to enable tailoring."}
        </Text>
      </Card>

      <Text size="xs" c="dimmed">
        Created: {new Date(resume.created_at).toLocaleString()} | Last updated:{" "}
        {new Date(resume.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
