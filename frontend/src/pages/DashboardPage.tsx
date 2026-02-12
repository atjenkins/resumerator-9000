import { useState, useEffect } from "react";
import { Title, Grid, Card, Text, Stack, Group, Button } from "@mantine/core";
import {
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconHistory,
  IconUpload,
  IconPlus,
} from "@tabler/icons-react";
import {
  getResumes,
  getCompanies,
  getJobs,
  getAnalyses,
} from "../services/api";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState({
    resumes: 0,
    companies: 0,
    jobs: 0,
    analyses: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [resumesData, companiesData, jobsData, analysesData] =
        await Promise.all([
          getResumes(),
          getCompanies(),
          getJobs(),
          getAnalyses(),
        ]);

      setStats({
        resumes: (resumesData as any[]).length,
        companies: (companiesData as any[]).length,
        jobs: (jobsData as any[]).length,
        analyses: analysesData.results.length,
      });
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  return (
    <Stack gap="xl">
      <Title order={1}>Dashboard</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card
            shadow="sm"
            padding="lg"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("resumes")}
          >
            <Group justify="apart" mb="md">
              <Text size="sm" c="dimmed">
                Resumes
              </Text>
              <IconFileText size={24} color="gray" />
            </Group>
            <Text size="xl" fw={700}>
              {stats.resumes}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card
            shadow="sm"
            padding="lg"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("companies")}
          >
            <Group justify="apart" mb="md">
              <Text size="sm" c="dimmed">
                Companies
              </Text>
              <IconBriefcase size={24} color="gray" />
            </Group>
            <Text size="xl" fw={700}>
              {stats.companies}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card
            shadow="sm"
            padding="lg"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("jobs")}
          >
            <Group justify="apart" mb="md">
              <Text size="sm" c="dimmed">
                Jobs
              </Text>
              <IconClipboard size={24} color="gray" />
            </Group>
            <Text size="xl" fw={700}>
              {stats.jobs}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <Card
            shadow="sm"
            padding="lg"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("history")}
          >
            <Group justify="apart" mb="md">
              <Text size="sm" c="dimmed">
                Analyses
              </Text>
              <IconHistory size={24} color="gray" />
            </Group>
            <Text size="xl" fw={700}>
              {stats.analyses}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" padding="lg">
        <Title order={3} mb="md">
          Quick Actions
        </Title>
        <Group>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={() => onNavigate("profile")}
          >
            Upload Resume to Profile
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={() => onNavigate("jobs")}
          >
            Add Job
          </Button>
          <Button
            leftSection={<IconFileText size={16} />}
            variant="light"
            onClick={() => onNavigate("resumes")}
          >
            Create Resume
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" padding="lg">
        <Title order={3} mb="md">
          Recent Activity
        </Title>
        <Text c="dimmed">No recent activity</Text>
      </Card>
    </Stack>
  );
}
