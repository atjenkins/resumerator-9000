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
  SimpleGrid,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconArrowLeft, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { MarkdownEditor } from "../components/shared/MarkdownEditor";
import { CompanyCard } from "../components/shared/CompanyCard";
import { ResumeCard } from "../components/shared/ResumeCard";
import { ExportMenu } from "../components/shared/ExportMenu";
import { getJob, updateJob, deleteJob, getCompanies, getResumes, type Resume } from "../services/api";

interface JobDetailPageProps {
  onNavigate: (page: string, state?: any) => void;
  jobId: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  content: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

export function JobDetailPage({ onNavigate, jobId }: JobDetailPageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Related data
  const [relatedResumes, setRelatedResumes] = useState<Resume[]>([]);

  useEffect(() => {
    loadJob();
    loadCompanies();
    loadRelatedResumes();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = (await getJob(jobId)) as Job;
      setJob(data);
      setTitle(data.title);
      setContent(data.content);
      setCompanyId(data.company_id || null);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load job",
        color: "red",
      });
      onNavigate("jobs");
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

  const loadRelatedResumes = async () => {
    try {
      const allResumes = (await getResumes()) as Resume[];
      const filtered = allResumes.filter((r) => r.job_id === jobId);
      setRelatedResumes(filtered);
    } catch (error) {
      console.error("Failed to load related resumes", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateJob(jobId, {
        title,
        content,
        companyId: companyId || undefined,
      });
      notifications.show({
        title: "Success",
        message: "Job saved",
        color: "green",
      });
      await loadJob();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save job",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteJob(jobId);
      notifications.show({
        title: "Success",
        message: "Job deleted",
        color: "green",
      });
      onNavigate("jobs");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete job",
        color: "red",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text c="dimmed">Loading job...</Text>
      </Stack>
    );
  }

  if (!job) {
    return (
      <Stack>
        <Text>Job not found</Text>
        <Button onClick={() => onNavigate("jobs")}>Back to Jobs</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {isMobile ? (
        <Stack gap="sm">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => onNavigate("jobs")}
            >
              Back
            </Button>
            <Title order={1}>Edit Job</Title>
          </Group>
          <Group grow>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={deleting}
            >
              Save
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
        </Stack>
      ) : (
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => onNavigate("jobs")}
            >
              Back
            </Button>
            <Title order={1}>Edit Job</Title>
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
            <ExportMenu
              entityType="job"
              entityId={jobId}
              entityName={title}
            />
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
      )}

      {companyId && (
        <Card shadow="sm" padding="lg">
          <Title order={3} mb="md">
            Company
          </Title>
          <CompanyCard
            company={
              companies.find((c) => c.id === companyId) || { id: companyId, name: "Loading..." }
            }
            onClick={() => onNavigate("company-detail", { id: companyId })}
            compact
          />
        </Card>
      )}

      {relatedResumes.length > 0 && (
        <Card shadow="sm" padding="lg">
          <Title order={3} mb="md">
            Resumes for This Job
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {relatedResumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onClick={() => onNavigate("resume-detail", { id: resume.id })}
                compact
              />
            ))}
          </SimpleGrid>
        </Card>
      )}

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <TextInput
            label="Job Title"
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

          <div>
            <Text fw={500} size="sm" mb="xs">
              Job Description (Markdown)
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              Add the full job description, requirements, qualifications, etc.
            </Text>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onSave={handleSave}
              saving={saving}
              placeholder="# Job Title

## Description

## Requirements

## Qualifications
"
            />
          </div>
        </Stack>
      </Card>

      <Text size="xs" c="dimmed">
        Created: {new Date(job.created_at).toLocaleString()} | Last updated:{" "}
        {new Date(job.updated_at).toLocaleString()}
      </Text>
    </Stack>
  );
}
