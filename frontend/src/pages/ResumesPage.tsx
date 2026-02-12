import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Button,
  Group,
  Text,
  Grid,
  Badge,
  Modal,
  TextInput,
  FileButton,
} from "@mantine/core";
import { IconPlus, IconUpload, IconStar } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  getResumes,
  createResume,
  parseResume,
  getCompanies,
  getJobs,
} from "../services/api";

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

interface ResumesPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function ResumesPage({ onNavigate }: ResumesPageProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
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
          <FileButton
            onChange={handleUploadResume}
            accept="application/pdf,.pdf,.docx"
          >
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={16} />}
                variant="light"
              >
                Upload Resume
              </Button>
            )}
          </FileButton>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create New
          </Button>
        </Group>
      </Group>

      {resumes.length === 0 ? (
        <Card shadow="sm" padding="xl">
          <Text c="dimmed" ta="center">
            No resumes yet. Create one or upload an existing resume to get
            started.
          </Text>
        </Card>
      ) : (
        <Grid>
          {resumes.map((resume) => {
            const companyName = getCompanyName(resume.company_id);
            const jobTitle = getJobTitle(resume.job_id);
            const createdDate = new Date(resume.created_at);
            const updatedDate = new Date(resume.updated_at);
            const showUpdated =
              updatedDate.getTime() - createdDate.getTime() > 1000;

            return (
              <Grid.Col key={resume.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  style={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => onNavigate("resume-detail", { id: resume.id })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="apart">
                      <Text fw={500}>{resume.title}</Text>
                      {resume.is_primary && (
                        <Badge
                          color="yellow"
                          leftSection={<IconStar size={12} />}
                        >
                          Primary
                        </Badge>
                      )}
                    </Group>

                    {(companyName || jobTitle) && (
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

                    <Stack gap="xs" mt="auto">
                      <Text size="xs" c="dimmed">
                        Created: {createdDate.toLocaleString()}
                      </Text>
                      {showUpdated && (
                        <Text size="xs" c="dimmed">
                          Updated: {updatedDate.toLocaleString()}
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Resume"
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
