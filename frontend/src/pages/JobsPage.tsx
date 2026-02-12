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
import { IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { JobCard } from "../components/shared/JobCard";
import { getJobs, createJob, getCompanies } from "../services/api";

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

interface JobsPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function JobsPage({ onNavigate }: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadJobs();
    loadCompanies();
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

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data as Company[]);
    } catch (error) {
      console.error("Failed to load companies", error);
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

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    return companies.find((c) => c.id === companyId)?.name;
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
              <JobCard
                job={job}
                companyName={getCompanyName(job.company_id) || undefined}
                onClick={() => onNavigate("job-detail", { id: job.id })}
                showHoverEffect
              />
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
