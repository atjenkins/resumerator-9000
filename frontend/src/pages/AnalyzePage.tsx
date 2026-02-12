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
  Progress,
  Badge,
  Divider,
  SimpleGrid,
  Slider,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AIProgressBar } from "../components/shared/AIProgressBar";
import { AnalysisCard } from "../components/shared/AnalysisCard";
import {
  getResumes,
  getCompanies,
  getJobs,
  getProfile,
  analyzeDocument,
  getAnalyses,
  type Analysis,
} from "../services/api";

interface AnalyzePageProps {
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
}

interface Profile {
  display_name: string;
}

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  categories: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;
  duration_ms?: number;
  analysisId?: string;
}

export function AnalyzePage({
  onNavigate,
  preSelectedResumeId,
}: AnalyzePageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [source, setSource] = useState<"resume" | "profile">(
    preSelectedResumeId ? "resume" : "profile",
  );
  const [resumeId, setResumeId] = useState<string | null>(
    preSelectedResumeId || null,
  );
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Past analyses state
  const [pastAnalyses, setPastAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [analysesOffset, setAnalysesOffset] = useState(0);
  const [hasMoreAnalyses, setHasMoreAnalyses] = useState(true);

  // Filter states
  const [filterSourceType, setFilterSourceType] = useState<
    "resume" | "profile" | null
  >(null);
  const [filterAnalysisType, setFilterAnalysisType] = useState<
    "general" | "job-fit" | null
  >(null);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);

  useEffect(() => {
    loadData();
    loadPastAnalyses(true);
  }, []);

  useEffect(() => {
    loadPastAnalyses(true);
  }, [filterSourceType, filterAnalysisType, filterMinScore]);

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

  const loadPastAnalyses = async (reset: boolean = false) => {
    try {
      setLoadingAnalyses(true);
      const offset = reset ? 0 : analysesOffset;

      const filters: any = {
        limit: 10,
        offset,
      };

      if (filterSourceType) filters.sourceType = filterSourceType;
      if (filterAnalysisType) filters.analysisType = filterAnalysisType;
      if (filterMinScore > 0) filters.minScore = filterMinScore;

      const { results } = await getAnalyses(filters);

      if (reset) {
        setPastAnalyses(results);
        setAnalysesOffset(10);
      } else {
        setPastAnalyses([...pastAnalyses, ...results]);
        setAnalysesOffset(offset + 10);
      }

      setHasMoreAnalyses(results.length === 10);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load past analyses",
        color: "red",
      });
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleAnalyze = async () => {
    if (source === "resume" && !resumeId) {
      notifications.show({
        title: "Error",
        message: "Please select a resume",
        color: "orange",
      });
      return;
    }

    try {
      setAnalyzing(true);
      const analysisResult = await analyzeDocument({
        source,
        resumeId: resumeId || undefined,
        companyId: companyId || undefined,
        jobId: jobId || undefined,
        save: true,
      });

      setResult(analysisResult as AnalysisResult);

      // Reload past analyses to show the new one
      loadPastAnalyses(true);

      notifications.show({
        title: "Analysis Complete",
        message: "Your document has been analyzed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to analyze document",
        color: "red",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Stack gap="xl">
      <Title order={1}>Analyze Document</Title>

      <Card shadow="sm" padding={isMobile ? "md" : "lg"} withBorder>
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
              placeholder="Choose a resume to analyze"
              value={resumeId}
              onChange={setResumeId}
              data={resumes.map((r) => ({ value: r.id, label: r.title }))}
              required
            />
          )}

          <Divider />

          <Text fw={500} size="sm">
            Context (Optional)
          </Text>

          <Select
            label="Company"
            placeholder="Select a company for context"
            value={companyId}
            onChange={setCompanyId}
            data={[
              { value: "", label: "None" },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
            clearable
          />

          <Select
            label="Job"
            placeholder="Select a job for context"
            value={jobId}
            onChange={setJobId}
            data={[
              { value: "", label: "None" },
              ...jobs.map((j) => ({ value: j.id, label: j.title })),
            ]}
            clearable
          />

          <Button
            onClick={handleAnalyze}
            loading={analyzing}
            size="lg"
            mt="md"
            disabled={analyzing}
          >
            Analyze
          </Button>

          {analyzing && (
            <AIProgressBar isRunning={analyzing} operationType="analyze" />
          )}
        </Stack>
      </Card>

      {result && (
        <Card shadow="sm" padding={isMobile ? "md" : "lg"} withBorder>
          <Stack gap="md">
            <Group justify="apart" align="start">
              <div>
                <Title order={2}>Analysis Results</Title>
                {result.duration_ms && (
                  <Text size="xs" c="dimmed">
                    Completed in {(result.duration_ms / 1000).toFixed(1)}s
                  </Text>
                )}
              </div>
              <Group>
                <Badge
                  size="xl"
                  color={
                    result.score >= 80
                      ? "green"
                      : result.score >= 60
                        ? "yellow"
                        : "red"
                  }
                >
                  Score: {result.score}/100
                </Badge>
                {result.analysisId && (
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() =>
                      onNavigate("analysis-detail", { id: result.analysisId })
                    }
                  >
                    View Saved Analysis
                  </Button>
                )}
              </Group>
            </Group>

            <div>
              <Text fw={500} mb="xs">
                Summary
              </Text>
              <Text>{result.summary}</Text>
            </div>

            <div>
              <Text fw={500} mb="xs">
                Strengths
              </Text>
              <Stack gap="xs">
                {result.strengths.map((strength, i) => (
                  <Text key={i} size="sm">
                    ✓ {strength}
                  </Text>
                ))}
              </Stack>
            </div>

            <div>
              <Text fw={500} mb="xs">
                Areas for Improvement
              </Text>
              <Stack gap="xs">
                {result.improvements.map((improvement, i) => (
                  <Text key={i} size="sm">
                    • {improvement}
                  </Text>
                ))}
              </Stack>
            </div>

            <Divider />

            <div>
              <Text fw={500} mb="md">
                Category Scores
              </Text>
              <Stack gap="md">
                {result.categories.map((category, i) => (
                  <div key={i}>
                    <Group justify="apart" mb="xs">
                      <Text size="sm" fw={500}>
                        {category.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {category.score}/100
                      </Text>
                    </Group>
                    <Progress
                      value={category.score}
                      color={
                        category.score >= 70
                          ? "green"
                          : category.score >= 50
                            ? "yellow"
                            : "red"
                      }
                      mb="xs"
                    />
                    <Text size="xs" c="dimmed">
                      {category.feedback}
                    </Text>
                  </div>
                ))}
              </Stack>
            </div>
          </Stack>
        </Card>
      )}

      <Divider my="xl" label="Past Analyses" labelPosition="center" />

      <Card shadow="sm" padding={isMobile ? "md" : "lg"} withBorder>
        <Stack gap="md">
          <Text fw={500}>Filter Results</Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Source Type"
              placeholder="All sources"
              value={filterSourceType}
              onChange={(value) =>
                setFilterSourceType(value as typeof filterSourceType)
              }
              data={[
                { value: "", label: "All Sources" },
                { value: "resume", label: "Resume" },
                { value: "profile", label: "Profile" },
              ]}
              clearable
            />

            <Select
              label="Analysis Type"
              placeholder="All types"
              value={filterAnalysisType}
              onChange={(value) =>
                setFilterAnalysisType(value as typeof filterAnalysisType)
              }
              data={[
                { value: "", label: "All Types" },
                { value: "general", label: "General" },
                { value: "job-fit", label: "Job Fit" },
              ]}
              clearable
            />
          </SimpleGrid>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Minimum Score: {filterMinScore}
            </Text>
            <Slider
              value={filterMinScore}
              onChange={setFilterMinScore}
              min={0}
              max={100}
              step={10}
              marks={[
                { value: 0, label: "0" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              mb="lg"
            />
          </div>
        </Stack>
      </Card>

      {loadingAnalyses && pastAnalyses.length === 0 && (
        <Text c="dimmed" ta="center">
          Loading analyses...
        </Text>
      )}

      {!loadingAnalyses && pastAnalyses.length === 0 && (
        <Card shadow="sm" padding={isMobile ? "md" : "lg"}>
          <Text c="dimmed" ta="center">
            No analyses found. Try adjusting your filters or run a new analysis.
          </Text>
        </Card>
      )}

      {pastAnalyses.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {pastAnalyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                onClick={() =>
                  onNavigate("analysis-detail", { id: analysis.id })
                }
              />
            ))}
          </SimpleGrid>

          {hasMoreAnalyses && (
            <Group justify="center">
              <Button
                variant="light"
                onClick={() => loadPastAnalyses(false)}
                loading={loadingAnalyses}
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
