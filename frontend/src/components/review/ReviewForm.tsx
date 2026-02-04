import { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Stack,
  Button,
  Checkbox,
  Radio,
  Group,
  Select,
  Textarea,
  Text,
} from "@mantine/core";
import { FileUpload } from "../shared/FileUpload";
import { useProject } from "../../hooks/useProject";
import { useApi } from "../../hooks/useApi";
import { runReview, getPersonResumes } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { AlertMessage } from "../shared/AlertMessage";
import type { ReviewResult, JobFitResult } from "../../services/types";

interface ReviewFormProps {
  onResult: (result: ReviewResult | JobFitResult) => void;
}

export function ReviewForm({ onResult }: ReviewFormProps) {
  const { people, companies, jobs, loadJobsForCompany } = useProject();
  const api = useApi(runReview);

  // Resume source
  const [resumeSource, setResumeSource] = useState<"project" | "text" | "file">(
    "project",
  );
  const [person, setPerson] = useState("");
  const [personFileType, setPersonFileType] = useState<"profile" | "resume">(
    "profile",
  );
  const [availableResumes, setAvailableResumes] = useState<string[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Company context
  const [includeCompany, setIncludeCompany] = useState(false);
  const [companySource, setCompanySource] = useState<"project" | "text">(
    "project",
  );
  const [company, setCompany] = useState("");
  const [companyText, setCompanyText] = useState("");

  // Job context
  const [includeJob, setIncludeJob] = useState(false);
  const [jobSource, setJobSource] = useState<"project" | "text">("project");
  const [jobCompany, setJobCompany] = useState("");
  const [job, setJob] = useState("");
  const [jobText, setJobText] = useState("");

  const [saveResult, setSaveResult] = useState(false);

  // Load resumes when person changes
  useEffect(() => {
    if (person && resumeSource === "project") {
      getPersonResumes(person)
        .then(({ resumes }) => setAvailableResumes(resumes))
        .catch(() => setAvailableResumes([]));
    } else {
      setAvailableResumes([]);
    }
    setSelectedResume("");
    setPersonFileType("profile");
  }, [person, resumeSource]);

  const handleJobCompanyChange = (value: string | null) => {
    setJobCompany(value || "");
    setJob("");
    if (value) {
      loadJobsForCompany(value);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();

    // Add resume/person
    if (resumeSource === "project" && person) {
      formData.append("person", person);
      if (personFileType === "resume" && selectedResume) {
        formData.append("useResume", selectedResume);
      }
    } else if (resumeSource === "text" && resumeText) {
      formData.append("resumeText", resumeText);
    } else if (resumeSource === "file" && resumeFile) {
      formData.append("resume", resumeFile);
    } else {
      return;
    }

    // Add company context
    if (includeCompany) {
      if (companySource === "project" && company) {
        formData.append("company", company);
      } else if (companySource === "text" && companyText) {
        formData.append("companyText", companyText);
      }
    }

    // Add job context
    if (includeJob) {
      if (jobSource === "project" && jobCompany && job) {
        formData.append("jobCompany", jobCompany);
        formData.append("job", job);
      } else if (jobSource === "text" && jobText) {
        formData.append("jobText", jobText);
      }
    }

    if (saveResult) {
      formData.append("save", "true");
    }

    try {
      const result = await api.execute(formData);
      onResult(result);
    } catch (error) {
      // Error handled by useApi
    }
  };

  const currentJobs = jobCompany && jobs[jobCompany] ? jobs[jobCompany] : [];

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Title order={2} mb="md">
        Resume Review
      </Title>

      <Stack gap="lg">
        {/* Section 1: Resume / Personal Info */}
        <Paper p="md" withBorder bg="gray.0">
          <Text fw={600} mb="md">
            Resume / Personal Info
          </Text>

          <Radio.Group
            value={resumeSource}
            onChange={(value) =>
              setResumeSource(value as "project" | "text" | "file")
            }
            mb="md"
          >
            <Group>
              <Radio value="project" label="From Project" />
              <Radio value="text" label="Paste Text" />
              <Radio value="file" label="Upload File" />
            </Group>
          </Radio.Group>

          {resumeSource === "project" && (
            <Stack gap="md">
              <Select
                label="Person"
                placeholder="Select person..."
                data={people.map((p) => ({ value: p.name, label: p.name }))}
                value={person}
                onChange={(v) => setPerson(v || "")}
                searchable
              />

              {person && (
                <>
                  <Radio.Group
                    value={personFileType}
                    onChange={(value) => {
                      setPersonFileType(value as "profile" | "resume");
                      setSelectedResume("");
                    }}
                    label="What to use?"
                  >
                    <Group mt="xs">
                      <Radio
                        value="profile"
                        label="Person Profile (person.md)"
                      />
                      <Radio
                        value="resume"
                        label="Generated Resume"
                        disabled={availableResumes.length === 0}
                      />
                    </Group>
                  </Radio.Group>

                  {personFileType === "resume" &&
                    availableResumes.length > 0 && (
                      <Select
                        label="Select Resume"
                        placeholder="Choose resume..."
                        data={availableResumes.map((r) => ({
                          value: r,
                          label: r,
                        }))}
                        value={selectedResume}
                        onChange={(v) => setSelectedResume(v || "")}
                        searchable
                      />
                    )}
                </>
              )}
            </Stack>
          )}

          {resumeSource === "text" && (
            <Textarea
              label="Resume Text"
              placeholder="Paste resume text..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
            />
          )}

          {resumeSource === "file" && (
            <FileUpload
              label="Upload Resume"
              accept=".pdf,.docx,.md,.txt"
              value={resumeFile}
              onChange={setResumeFile}
            />
          )}
        </Paper>

        {/* Section 2: Company Context */}
        <Paper p="md" withBorder bg="gray.0">
          <Checkbox
            label="Include company context"
            checked={includeCompany}
            onChange={(e) => setIncludeCompany(e.currentTarget.checked)}
            mb="md"
          />

          {includeCompany && (
            <Stack gap="md">
              <Radio.Group
                value={companySource}
                onChange={(value) =>
                  setCompanySource(value as "project" | "text")
                }
              >
                <Group>
                  <Radio value="project" label="From Project" />
                  <Radio value="text" label="Paste Text" />
                </Group>
              </Radio.Group>

              {companySource === "project" && (
                <Select
                  label="Company"
                  placeholder="Select company..."
                  data={companies.map((c) => ({
                    value: c.name,
                    label: c.name,
                  }))}
                  value={company}
                  onChange={(v) => setCompany(v || "")}
                  searchable
                />
              )}

              {companySource === "text" && (
                <Textarea
                  label="Company Info"
                  placeholder="Paste company info..."
                  value={companyText}
                  onChange={(e) => setCompanyText(e.target.value)}
                  rows={4}
                />
              )}
            </Stack>
          )}
        </Paper>

        {/* Section 3: Job Description */}
        <Paper p="md" withBorder bg="gray.0">
          <Checkbox
            label="Include job description"
            checked={includeJob}
            onChange={(e) => setIncludeJob(e.currentTarget.checked)}
            mb="md"
          />

          {includeJob && (
            <Stack gap="md">
              <Radio.Group
                value={jobSource}
                onChange={(value) => setJobSource(value as "project" | "text")}
              >
                <Group>
                  <Radio value="project" label="From Project" />
                  <Radio value="text" label="Paste Text" />
                </Group>
              </Radio.Group>

              {jobSource === "project" && (
                <>
                  <Select
                    label="Company"
                    placeholder="Select company..."
                    data={companies.map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))}
                    value={jobCompany}
                    onChange={handleJobCompanyChange}
                    searchable
                  />

                  <Select
                    label="Job"
                    placeholder={
                      jobCompany ? "Select job..." : "Select company first..."
                    }
                    data={currentJobs.map((j) => ({
                      value: j.name,
                      label: j.name,
                    }))}
                    value={job}
                    onChange={(v) => setJob(v || "")}
                    disabled={!jobCompany}
                    searchable
                  />
                </>
              )}

              {jobSource === "text" && (
                <Textarea
                  label="Job Description"
                  placeholder="Paste job description..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={8}
                />
              )}
            </Stack>
          )}
        </Paper>

        <Checkbox
          label="Save result to project"
          checked={saveResult}
          onChange={(e) => setSaveResult(e.currentTarget.checked)}
        />

        <Button
          onClick={handleSubmit}
          loading={api.loading}
          size="lg"
          fullWidth
        >
          Run Review
        </Button>

        {api.loading && <LoadingSpinner message="Running AI review..." />}
        {api.error && (
          <AlertMessage type="error" message={api.error} onClose={api.reset} />
        )}
      </Stack>
    </Paper>
  );
}
