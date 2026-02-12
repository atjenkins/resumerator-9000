import {
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Button,
  Group,
  ThemeIcon,
  Timeline,
  Container,
} from "@mantine/core";
import {
  IconUser,
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconReportAnalytics,
  IconSparkles,
  IconHistory,
  IconUpload,
  IconTarget,
  IconBulb,
  IconRocket,
} from "@tabler/icons-react";
import { useThemeStore } from "../theme/useThemeStore";
import { getTheme } from "../theme/themes";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);

  const features = [
    {
      page: "profile",
      icon: IconUser,
      name: "Profile",
      description: appTheme.featureDescriptions.profile,
      color: "blue",
    },
    {
      page: "resumes",
      icon: IconFileText,
      name: "Resumes",
      description: appTheme.featureDescriptions.resumes,
      color: "grape",
    },
    {
      page: "companies",
      icon: IconBriefcase,
      name: "Companies",
      description: appTheme.featureDescriptions.companies,
      color: "cyan",
    },
    {
      page: "jobs",
      icon: IconClipboard,
      name: "Jobs",
      description: appTheme.featureDescriptions.jobs,
      color: "teal",
    },
    {
      page: "analyze",
      icon: IconReportAnalytics,
      name: "Analyze",
      description: appTheme.featureDescriptions.analyze,
      color: "orange",
    },
    {
      page: "generate",
      icon: IconSparkles,
      name: "Generate",
      description: appTheme.featureDescriptions.generate,
      color: "pink",
    },
    {
      page: "history",
      icon: IconHistory,
      name: "History",
      description: appTheme.featureDescriptions.history,
      color: "gray",
    },
  ];

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Hero Section */}
        <Stack gap="md" align="center" mt="xl" mb="lg">
          <Title order={1} size="3rem" ta="center">
            Welcome to Resumerator 9000
          </Title>
          <Text size="xl" c="dimmed" ta="center" maw={700}>
            {appTheme.tagline}
          </Text>
          <Group mt="md">
            <Button size="lg" onClick={() => onNavigate("profile")}>
              Get Started
            </Button>
            <Button
              size="lg"
              variant="light"
              onClick={() => onNavigate("dashboard")}
            >
              View Dashboard
            </Button>
          </Group>
        </Stack>

        {/* How It Works */}
        <Card shadow="sm" padding="xl" mt="xl">
          <Title order={2} mb="xl" ta="center">
            How It Works
          </Title>
          <Timeline active={-1} bulletSize={40} lineWidth={3}>
            <Timeline.Item
              bullet={<IconUpload size={20} />}
              title="Build Your Profile"
            >
              <Text size="sm" c="dimmed" mt={4}>
                Paste or upload your master resume. This is your professional
                baseline — the single source of truth for your career story.
              </Text>
            </Timeline.Item>

            <Timeline.Item
              bullet={<IconTarget size={20} />}
              title="Track Your Targets"
            >
              <Text size="sm" c="dimmed" mt={4}>
                Add companies and job postings you're interested in. Keep all
                your opportunities organized in one place.
              </Text>
            </Timeline.Item>

            <Timeline.Item
              bullet={<IconBulb size={20} />}
              title="Analyze"
            >
              <Text size="sm" c="dimmed" mt={4}>
                Get AI-powered feedback on your resume. Run a general review or
                check how well it fits a specific job posting.
              </Text>
            </Timeline.Item>

            <Timeline.Item
              bullet={<IconRocket size={20} />}
              title="Generate"
            >
              <Text size="sm" c="dimmed" mt={4}>
                Create tailored resumes optimized for specific positions. The AI
                emphasizes relevant experience and skills for each job.
              </Text>
            </Timeline.Item>
          </Timeline>
        </Card>

        {/* Feature Cards */}
        <div>
          <Title order={2} mb="xl" ta="center">
            Explore the Platform
          </Title>
          <Grid gutter="md">
            {features.map((feature) => (
              <Grid.Col key={feature.page} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  style={{ cursor: "pointer", height: "100%" }}
                  onClick={() => onNavigate(feature.page)}
                >
                  <Group mb="md">
                    <ThemeIcon
                      size="xl"
                      radius="md"
                      variant="light"
                      color={feature.color}
                    >
                      <feature.icon size={24} />
                    </ThemeIcon>
                    <Title order={3} size="h4">
                      {feature.name}
                    </Title>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Bottom CTA */}
        <Card shadow="sm" padding="xl" mt="lg" mb="xl">
          <Stack align="center" gap="md">
            <Title order={3}>Ready to get started?</Title>
            <Text c="dimmed" ta="center" maw={600}>
              Begin by building your profile, or jump straight to creating your
              first resume. The AI is standing by, ready to judge your career
              choices with cold, calculated precision.
            </Text>
            <Group>
              <Button onClick={() => onNavigate("profile")}>
                Build Profile
              </Button>
              <Button variant="light" onClick={() => onNavigate("resumes")}>
                Create Resume
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
