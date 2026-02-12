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
  useMantineTheme,
  SimpleGrid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { marked } from "marked";
import { AIProgressBar } from "../components/shared/AIProgressBar";
import { ResumeCard } from "../components/shared/ResumeCard";
import {
  getResumes,
  getCompanies,
  getJobs,
  getProfile,
  generateResume,
  type Resume as ResumeType,
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
  const theme = useMantineTheme();
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

  // Generation history state
  const [generatedResumes, setGeneratedResumes] = useState<ResumeType[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  
  // Filter states
  const [filterSource, setFilterSource] = useState<"resume" | "profile" | null>(null);
  const [filterJobId, setFilterJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadGenerationHistory(true);
  }, []);

  useEffect(() => {
    loadGenerationHistory(true);
  }, [filterSource, filterJobId]);

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

  const loadGenerationHistory = async (reset: boolean = false) => {
    try {
      setLoadingHistory(true);
      
      // Get all resumes and filter for generated ones
      const allResumes = await getResumes() as ResumeType[];
      let filtered = allResumes.filter(r => r.origin === "generated");
      
      // Apply filters
      if (filterSource) {
        filtered = filtered.filter(r => r.source_type === filterSource);
      }
      if (filterJobId) {
        filtered = filtered.filter(r => r.job_id === filterJobId);
      }
      
      // Sort by creation date (newest first)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Pagination
      const offset = reset ? 0 : historyOffset;
      const paginated = filtered.slice(offset, offset + 10);
      
      if (reset) {
        setGeneratedResumes(paginated);
        setHistoryOffset(10);
      } else {
        setGeneratedResumes([...generatedResumes, ...paginated]);
        setHistoryOffset(offset + 10);
      }
      
      setHasMoreHistory(offset + 10 < filtered.length);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load generation history",
        color: "red",
      });
    } finally {
      setLoadingHistory(false);
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
      
      // Reload generation history to show the new one
      loadGenerationHistory(true);
      
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
                border: `1px solid ${theme.colors.gray[3]}`,
                borderRadius: "4px",
                padding: "1rem",
                backgroundColor: theme.white,
                maxHeight: "600px",
                overflow: "auto",
              }}
            >
              {renderPreview(result.markdown)}
            </Box>
          </Card>
        </>
      )}

      <Divider my="xl" label="Generation History" labelPosition="center" />

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <Text fw={500}>Filter Results</Text>
          
          <Group grow>
            <Select
              label="Source Type"
              placeholder="All sources"
              value={filterSource}
              onChange={(value) => setFilterSource(value as typeof filterSource)}
              data={[
                { value: "", label: "All Sources" },
                { value: "resume", label: "From Resume" },
                { value: "profile", label: "From Profile" },
              ]}
              clearable
            />
            
            <Select
              label="Target Job"
              placeholder="All jobs"
              value={filterJobId}
              onChange={setFilterJobId}
              data={[
                { value: "", label: "All Jobs" },
                ...jobs.map((j) => ({ value: j.id, label: j.title })),
              ]}
              clearable
            />
          </Group>
        </Stack>
      </Card>

      {loadingHistory && generatedResumes.length === 0 && (
        <Text c="dimmed" ta="center">Loading generation history...</Text>
      )}

      {!loadingHistory && generatedResumes.length === 0 && (
        <Card shadow="sm" padding="lg">
          <Text c="dimmed" ta="center">No generated resumes found. Try adjusting your filters or generate a new resume.</Text>
        </Card>
      )}

      {generatedResumes.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {generatedResumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onClick={() => onNavigate("resume-detail", { id: resume.id })}
              />
            ))}
          </SimpleGrid>

          {hasMoreHistory && (
            <Group justify="center">
              <Button
                variant="light"
                onClick={() => loadGenerationHistory(false)}
                loading={loadingHistory}
              >
                Load More
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
