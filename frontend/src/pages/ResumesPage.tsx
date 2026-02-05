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
import {
  IconPlus,
  IconUpload,
  IconEdit,
  IconTrash,
  IconStar,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  getResumes,
  createResume,
  deleteResume,
  parseResume,
} from "../services/api";

interface Resume {
  id: string;
  title: string;
  content: string;
  is_primary: boolean;
  company_id?: string;
  job_id?: string;
  created_at: string;
}

interface ResumesPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function ResumesPage({ onNavigate }: ResumesPageProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadResumes();
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      await deleteResume(id);
      await loadResumes();
      notifications.show({
        title: "Success",
        message: "Resume deleted",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete resume",
        color: "red",
      });
    }
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
          {resumes.map((resume) => (
            <Grid.Col key={resume.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" style={{ height: "100%" }}>
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

                  <Text size="xs" c="dimmed">
                    Created {new Date(resume.created_at).toLocaleDateString()}
                  </Text>

                  <Group justify="apart" mt="auto">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEdit size={14} />}
                      onClick={() =>
                        onNavigate("resume-detail", { id: resume.id })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(resume.id)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
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
