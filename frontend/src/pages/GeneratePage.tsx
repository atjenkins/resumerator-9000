import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Radio,
  Group,
  Select,
  Button,
  Text,
  Badge,
  Divider,
  Box,
  TypographyStylesProvider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { marked } from "marked";
import { AIProgressBar } from "../components/shared/AIProgressBar";
import {
  getResumes,
  getCompanies,
  getJobs,
  getProfile,
  generateResume,
} from "../services/api";

interface GeneratePageProps {
  onNavigate: (page: string, state?: any) => void;
  preSelectedResumeId?: string;
}

interface Resume {
  id: string;
  title: string;
}

interface Company {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  company_id?: string;
}

interface Profile {
  display_name: string;
}

interface GenerateResult {
  markdown: string;
  summary: string;
  emphasizedSkills: string[];
  selectedExperiences: string[];
  duration_ms?: number;
  savedResultId?: string;
  tailoredResumeId?: string;
}

export function GeneratePage({
  onNavigate,
  preSelectedResumeId,
}: GeneratePageProps) {
  const [source, setSource] = useState<"resume" | "profile">(
    preSelectedResumeId ? "resume" : "profile"
  );
  const [resumeId, setResumeId] = useState<string | null>(
    preSelectedResumeId || null
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resumesData, companiesData, jobsData, profileDataRes] =
        await Promise.all([
          getResumes(),
          getCompanies(),
          getJobs(),
          getProfile(),
        ]);

      setResumes(resumesData as Resume[]);
      setCompanies(companiesData as Company[]);
      setJobs(jobsData as Job[]);
      setProfileData(profileDataRes as Profile);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load data",
        color: "red",
      });
    }
  };

  // Auto-fill company when job is selected
  useEffect(() => {
    if (jobId) {
      const selectedJob = jobs.find((j) => j.id === jobId);
      if (selectedJob?.company_id) {
        setCompanyId(selectedJob.company_id);
      }
    }
  }, [jobId, jobs]);

  const handleGenerate = async () => {
    if (source === "resume" && !resumeId) {
      notifications.show({
        title: "Error",
        message: "Please select a resume",
        color: "orange",
      });
      return;
    }

    if (!jobId) {
      notifications.show({
        title: "Error",
        message: "Please select a job",
        color: "orange",
      });
      return;
    }

    try {
      setGenerating(true);
      const generateResult = await generateResume({
        source,
        resumeId: resumeId || undefined,
        jobId,
        companyId: companyId || undefined,
        save: true,
      });

      setResult(generateResult as GenerateResult);
      notifications.show({
        title: "Resume Generated",
        message: "Your tailored resume has been created",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to generate resume",
        color: "red",
      });
    } finally {
      setGenerating(false);
    }
  };

  const renderPreview = (markdown: string) => {
    try {
      const html = marked.parse(markdown) as string;
      return (
        <TypographyStylesProvider>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </TypographyStylesProvider>
      );
    } catch (error) {
      return <div style={{ color: "red" }}>Error rendering markdown</div>;
    }
  };

  return (
    <Stack gap="xl">
      <Title order={1}>Generate Tailored Resume</Title>

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <div>
            <Text fw={500} mb="xs">
              Source
            </Text>
            <Radio.Group
              value={source}
              onChange={(value) => setSource(value as typeof source)}
            >
              <Group>
                <Radio value="profile" label="Use Profile" />
                <Radio value="resume" label="Use Resume" />
              </Group>
            </Radio.Group>
          </div>

          {source === "profile" ? (
            <Text size="sm" c="dimmed">
              Using profile: {profileData?.display_name || "Loading..."}
            </Text>
          ) : (
            <Select
              label="Select Resume"
              placeholder="Choose a resume as the base"
              value={resumeId}
              onChange={setResumeId}
              data={resumes.map((r) => ({ value: r.id, label: r.title }))}
              required
            />
          )}

          <Divider />

          <Text fw={500} size="sm">
            Target Job (Required)
          </Text>

          <Select
            label="Job"
            placeholder="Select the job to tailor for"
            value={jobId}
            onChange={setJobId}
            data={jobs.map((j) => ({ value: j.id, label: j.title }))}
            required
          />

          <Select
            label="Company"
            placeholder="Optionally select a company"
            description="Auto-filled if the job has an associated company"
            value={companyId}
            onChange={setCompanyId}
            data={[
              { value: "", label: "None" },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            clearable
          />

          <Button
            onClick={handleGenerate}
            loading={generating}
            size="lg"
            mt="md"
            disabled={!jobId || generating}
          >
            Generate Tailored Resume
          </Button>

          {generating && (
            <AIProgressBar isRunning={generating} operationType="generate" />
          )}
        </Stack>
      </Card>

      {result && (
        <>
          <Card shadow="sm" padding="lg">
            <Stack gap="md">
              <Group justify="apart">
                <div>
                  <Title order={2}>Generation Summary</Title>
                  {result.duration_ms && (
                    <Text size="xs" c="dimmed">
                      Completed in {(result.duration_ms / 1000).toFixed(1)}s
                    </Text>
                  )}
                </div>
                {result.tailoredResumeId && (
                  <Button
                    variant="light"
                    onClick={() =>
                      onNavigate("resume-detail", {
                        id: result.tailoredResumeId,
                      })
                    }
                  >
                    View New Resume
                  </Button>
                )}
              </Group>

              <Text>{result.summary}</Text>

              <div>
                <Text fw={500} mb="xs">
                  Emphasized Skills
                </Text>
                <Group gap="xs">
                  {result.emphasizedSkills.map((skill, i) => (
                    <Badge key={i} variant="light">
                      {skill}
                    </Badge>
                  ))}
                </Group>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  Selected Experiences
                </Text>
                <Stack gap="xs">
                  {result.selectedExperiences.map((exp, i) => (
                    <Text key={i} size="sm">
                      • {exp}
                    </Text>
                  ))}
                </Stack>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg">
            <Title order={3} mb="md">
              Generated Resume Preview
            </Title>
            <Box
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                padding: "1rem",
                backgroundColor: "#fff",
                maxHeight: "600px",
                overflow: "auto",
              }}
            >
              {renderPreview(result.markdown)}
            </Box>
          </Card>
        </>
      )}
    </Stack>
  );
}
