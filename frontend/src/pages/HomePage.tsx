import {
  Title,
  Text,
  Card,
  Stack,
  Button,
  Group,
  ThemeIcon,
  Container,
  Box,
  SimpleGrid,
} from "@mantine/core";
import {
  IconUser,
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconReportAnalytics,
  IconSparkles,
  IconUpload,
  IconTarget,
  IconBulb,
  IconRocket,
  IconArrowRight,
} from "@tabler/icons-react";
import { useThemeStore } from "../theme/useThemeStore";
import { getTheme } from "../theme/themes";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface FeatureSection {
  page: string;
  icon: React.ComponentType<any>;
  name: string;
  description: string;
  color: string;
  howTo: {
    title: string;
    steps: string[];
  };
}

export function HomePage({ onNavigate }: HomePageProps) {
  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);

  const featureSections: FeatureSection[] = [
    {
      page: "profile",
      icon: IconUser,
      name: "Profile",
      description: appTheme.featureDescriptions.profile,
      color: appTheme.featureColors.profile,
      howTo: {
        title: "Build your professional baseline",
        steps: [
          "Paste or upload your master resume content",
          "Edit sections using the markdown editor",
          "Use AI enrichment to enhance your profile automatically",
          "Keep it updated as your career evolves",
        ],
      },
    },
    {
      page: "resumes",
      icon: IconFileText,
      name: "Resumes",
      description: appTheme.featureDescriptions.resumes,
      color: appTheme.featureColors.resumes,
      howTo: {
        title: "Manage tailored versions",
        steps: [
          "Create multiple resume versions for different roles",
          "Generate new resumes from your profile using AI",
          "Compare versions side-by-side",
          "Export when you're ready to apply",
        ],
      },
    },
    {
      page: "companies",
      icon: IconBriefcase,
      name: "Companies",
      description: appTheme.featureDescriptions.companies,
      color: appTheme.featureColors.companies,
      howTo: {
        title: "Organize your target companies",
        steps: [
          "Add companies you're interested in",
          "Include notes about culture, mission, and values",
          "Link companies to specific job postings",
          "Use company context when analyzing or generating resumes",
        ],
      },
    },
    {
      page: "jobs",
      icon: IconClipboard,
      name: "Jobs",
      description: appTheme.featureDescriptions.jobs,
      color: appTheme.featureColors.jobs,
      howTo: {
        title: "Track every opportunity",
        steps: [
          "Paste job descriptions directly from postings",
          "Associate jobs with companies",
          "Use job context for targeted resume analysis",
          "Generate job-specific resumes with one click",
        ],
      },
    },
    {
      page: "analyze",
      icon: IconReportAnalytics,
      name: "Analyze",
      description: appTheme.featureDescriptions.analyze,
      color: appTheme.featureColors.analyze,
      howTo: {
        title: "Get AI-powered feedback",
        steps: [
          "Choose your profile or a specific resume to analyze",
          "Optionally select a company and job for targeted feedback",
          "Review your overall score and category breakdowns",
          "Use the suggestions to improve before applying",
        ],
      },
    },
    {
      page: "generate",
      icon: IconSparkles,
      name: "Generate",
      description: appTheme.featureDescriptions.generate,
      color: appTheme.featureColors.generate,
      howTo: {
        title: "Create optimized resumes",
        steps: [
          "Select your profile as the source material",
          "Pick a target job to optimize for",
          "Let the AI craft a tailored resume",
          "Review, edit, and save the result",
        ],
      },
    },
  ];

  return (
    <Stack gap={0}>
      {/* Hero Section */}
      <Box
        style={{
          background: appTheme.headerGradient,
          padding: "6rem 2rem",
          marginTop: "-2rem",
          marginLeft: "-2rem",
          marginRight: "-2rem",
        }}
      >
        <Stack gap="lg" align="center">
          <Title order={1} size="3.5rem" ta="center" c="white">
            Resumerator 9000
          </Title>
          <Text size="xl" ta="center" maw={700} c="white" opacity={0.9}>
            {appTheme.tagline}
          </Text>
          <Text size="md" ta="center" maw={600} c="white" opacity={0.7}>
            AI-powered resume analysis and generation. Build once, tailor for
            every opportunity.
          </Text>
          <Group mt="lg">
            <Button
              size="lg"
              variant="white"
              color="dark"
              onClick={() => onNavigate("profile")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              color="white"
              onClick={() => onNavigate("dashboard")}
            >
              View Dashboard
            </Button>
          </Group>
        </Stack>
      </Box>

      <Container size="xl" py="lg" style={{ width: "100%" }}>
        <Stack gap="xl">
          {/* How It Works - Compact */}
          <Box mt="md">
            <Title order={2} mb="md" ta="center">
              How It Works
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              {[
                {
                  icon: <IconUpload size={20} />,
                  title: "Build Your Profile",
                  text: "Paste or upload your master resume as your professional baseline.",
                },
                {
                  icon: <IconTarget size={20} />,
                  title: "Track Your Targets",
                  text: "Add companies and job postings to keep opportunities organized.",
                },
                {
                  icon: <IconBulb size={20} />,
                  title: "Analyze",
                  text: "Get AI-powered feedback on how well your resume fits each role.",
                },
                {
                  icon: <IconRocket size={20} />,
                  title: "Generate",
                  text: "Create tailored resumes optimized for specific positions.",
                },
              ].map((step, i) => (
                <Stack key={i} align="center" gap="xs" ta="center">
                  <ThemeIcon size={48} radius="xl" variant="light">
                    {step.icon}
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    {step.title}
                  </Text>
                  <Text size="xs" c="dimmed" maw={220}>
                    {step.text}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Box>
        </Stack>
      </Container>

      {/* Alternating Feature Sections */}
      {featureSections.map((feature, index) => {
        const isReversed = index % 2 === 1;
        const hasBg = index % 2 === 0;

        const cardSide = (
          <Card
            shadow="sm"
            padding="xl"
            withBorder
            style={{
              cursor: "pointer",
              height: "100%",
              background: `var(--mantine-color-${feature.color}-0)`,
            }}
            onClick={() => onNavigate(feature.page)}
          >
            <Stack gap="md" justify="center" style={{ height: "100%" }}>
              <Group>
                <ThemeIcon
                  size={56}
                  radius="md"
                  variant="filled"
                  color={feature.color}
                >
                  <feature.icon size={28} />
                </ThemeIcon>
                <Title order={2}>{feature.name}</Title>
              </Group>
              <Text size="md" c="dimmed">
                {feature.description}
              </Text>
              <Group>
                <Button
                  variant="filled"
                  color={feature.color}
                  rightSection={<IconArrowRight size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(feature.page);
                  }}
                >
                  Go to {feature.name}
                </Button>
              </Group>
            </Stack>
          </Card>
        );

        const howToSide = (
          <Stack gap="sm" justify="center" style={{ height: "100%" }} px="md">
            <Title order={3} mb="xs">
              {feature.howTo.title}
            </Title>
            <Stack gap="xs">
              {feature.howTo.steps.map((step, stepIndex) => (
                <Group
                  key={stepIndex}
                  gap="sm"
                  wrap="nowrap"
                  align="flex-start"
                >
                  <ThemeIcon
                    size={24}
                    radius="xl"
                    variant="light"
                    color={feature.color}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <Text size="xs" fw={700}>
                      {stepIndex + 1}
                    </Text>
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    {step}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Stack>
        );

        return (
          <Box
            key={feature.page}
            style={{
              backgroundColor: hasBg
                ? "var(--mantine-color-gray-0)"
                : "transparent",
              marginLeft: "-2rem",
              marginRight: "-2rem",
              padding: "3rem 2rem",
            }}
          >
            <Container size="xl">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {isReversed ? (
                  <>
                    {howToSide}
                    {cardSide}
                  </>
                ) : (
                  <>
                    {cardSide}
                    {howToSide}
                  </>
                )}
              </SimpleGrid>
            </Container>
          </Box>
        );
      })}

      {/* Bottom CTA */}
      <Container size="xl" py="xl" style={{ width: "100%" }}>
        <Card shadow="sm" padding="xl" withBorder>
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
      </Container>
    </Stack>
  );
}
