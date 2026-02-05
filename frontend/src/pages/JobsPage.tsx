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
  Badge,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClipboard,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getJobs, createJob, deleteJob } from "../services/api";

interface Job {
  id: string;
  title: string;
  slug: string;
  content: string;
  company_id?: string;
  created_at: string;
}

interface JobsPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function JobsPage({ onNavigate }: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data as Job[]);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load jobs",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      await createJob({
        title: newTitle,
        content: `# ${newTitle}\n\n`,
      });
      setCreateModalOpen(false);
      setNewTitle("");
      await loadJobs();
      notifications.show({
        title: "Success",
        message: "Job created",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create job",
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await deleteJob(id);
      await loadJobs();
      notifications.show({
        title: "Success",
        message: "Job deleted",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete job",
        color: "red",
      });
    }
  };

  if (loading) {
    return <Text>Loading jobs...</Text>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>Jobs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Job
        </Button>
      </Group>

      {jobs.length === 0 ? (
        <Card shadow="sm" padding="xl">
          <Text c="dimmed" ta="center">
            No jobs yet. Add job postings you're interested in.
          </Text>
        </Card>
      ) : (
        <Grid>
          {jobs.map((job) => (
            <Grid.Col key={job.id} span={{ base: 12, md: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" style={{ height: "100%" }}>
                <Stack gap="sm">
                  <Group>
                    <IconClipboard size={24} color="gray" />
                    <Text fw={500}>{job.title}</Text>
                  </Group>

                  {job.company_id && (
                    <Badge variant="light">Linked to company</Badge>
                  )}

                  <Text size="xs" c="dimmed">
                    Added {new Date(job.created_at).toLocaleDateString()}
                  </Text>

                  <Group justify="apart" mt="auto">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => onNavigate("job-detail", { id: job.id })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(job.id)}
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
        title="Add Job"
      >
        <Stack gap="md">
          <TextInput
            label="Job Title"
            placeholder="e.g., Senior Software Engineer"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button
            onClick={handleCreate}
            loading={creating}
            disabled={!newTitle.trim()}
          >
            Add
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
