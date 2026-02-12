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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../contexts/AuthContext";
import { AIProgressBar } from "../components/shared/AIProgressBar";
import {
  getResumes,
  getCompanies,
  getJobs,
  getProfile,
  analyzeDocument,
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
  savedResultId?: string;
}

export function AnalyzePage({
  onNavigate,
  preSelectedResumeId,
}: AnalyzePageProps) {
  const { profile } = useAuth();
  const [source, setSource] = useState<"resume" | "profile">(
    preSelectedResumeId ? "resume" : "profile"
  );
  const [resumeId, setResumeId] = useState<string | null>(
    preSelectedResumeId || null
  );
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resumesData, companiesData, jobsData, profileDataRes] = await Promise.all([
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

      <Card shadow="sm" padding="lg">
        <Stack gap="md">
          <div>
            <Text fw={500} mb="xs">
              Source
            </Text>
            <Radio.Group value={source} onChange={(value) => setSource(value as typeof source)}>
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
        <Card shadow="sm" padding="lg">
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
              <Badge size="xl" color={result.score >= 80 ? "green" : result.score >= 60 ? "yellow" : "red"}>
                Score: {result.score}/100
              </Badge>
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
                      color={category.score >= 70 ? "green" : category.score >= 50 ? "yellow" : "red"}
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
    </Stack>
  );
}
