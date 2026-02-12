import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Button,
  Group,
  Text,
  Grid,
  Modal,
  TextInput,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { ResumeCard } from "../components/shared/ResumeCard";
import { UploadResumeModal } from "../components/shared/UploadResumeModal";
import {
  getResumes,
  createResume,
  parseResume,
  getCompanies,
  getJobs,
  type Resume,
} from "../services/api";

interface Company {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
}

interface ResumesPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function ResumesPage({ onNavigate }: ResumesPageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadResumes();
    loadCompanies();
    loadJobs();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await getResumes();
      setResumes(data as Resume[]);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load resumes",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data as Company[]);
    } catch (error) {
      console.error("Failed to load companies", error);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data as Job[]);
    } catch (error) {
      console.error("Failed to load jobs", error);
    }
  };

  const handleCreateBlank = async () => {
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      await createResume({
        title: newTitle,
        content: "# Resume\n\n",
        isPrimary: resumes.length === 0,
      });
      setCreateModalOpen(false);
      setNewTitle("");
      await loadResumes();
      notifications.show({
        title: "Success",
        message: "Resume created",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create resume",
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUploadResume = async (file: File | null) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const parsed = (await parseResume(formData)) as { markdown: string };
      const title = file.name.replace(/\.(pdf|docx?)$/i, "");

      await createResume({
        title,
        content: parsed.markdown,
        isPrimary: resumes.length === 0,
      });

      await loadResumes();

      notifications.show({
        title: "Success",
        message: "Resume uploaded and parsed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to upload resume",
        color: "red",
      });
    }
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    return companies.find((c) => c.id === companyId)?.name;
  };

  const getJobTitle = (jobId?: string) => {
    if (!jobId) return null;
    return jobs.find((j) => j.id === jobId)?.title;
  };

  if (loading) {
    return <Text>Loading resumes...</Text>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>Resumes</Title>
        <Group>
          <Button
            leftSection={<IconUpload size={16} />}
            variant="light"
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Resume
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create New
          </Button>
        </Group>
      </Group>

      {resumes.length === 0 ? (
        <Card shadow="sm" padding={isMobile ? "md" : "xl"}>
          <Text c="dimmed" ta="center">
            No resumes yet. Create one or upload an existing resume to get
            started.
          </Text>
        </Card>
      ) : (
        <Grid>
          {resumes.map((resume) => (
            <Grid.Col key={resume.id} span={{ base: 12, md: 6, lg: 4 }}>
              <ResumeCard
                resume={resume}
                companyName={getCompanyName(resume.company_id) || undefined}
                jobTitle={getJobTitle(resume.job_id) || undefined}
                onClick={() => onNavigate("resume-detail", { id: resume.id })}
                showHoverEffect
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <UploadResumeModal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadResume}
        title="Upload Resume"
        description="Upload a PDF or DOCX resume. It will be parsed using AI and saved as a new resume in your collection."
      />

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Resume"
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Resume Title"
            placeholder="e.g., General Resume, Software Engineer Resume"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button
            onClick={handleCreateBlank}
            loading={creating}
            disabled={!newTitle.trim()}
          >
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
