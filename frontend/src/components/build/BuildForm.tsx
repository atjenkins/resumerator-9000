import { useState } from "react";
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
import { useProject } from "../../hooks/useProject";
import { useApi } from "../../hooks/useApi";
import { runBuild } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { AlertMessage } from "../shared/AlertMessage";
import type { BuilderResult } from "../../services/types";

interface BuildFormProps {
  onResult: (result: BuilderResult) => void;
}

export function BuildForm({ onResult }: BuildFormProps) {
  const { people, companies, jobs, loadJobsForCompany } = useProject();
  const api = useApi(runBuild);

  // Personal info source
  const [personSource, setPersonSource] = useState<"project" | "text">(
    "project"
  );
  const [person, setPerson] = useState("");
  const [personText, setPersonText] = useState("");

  // Job source (required)
  const [jobSource, setJobSource] = useState<"project" | "text">("project");
  const [jobCompany, setJobCompany] = useState("");
  const [job, setJob] = useState("");
  const [jobText, setJobText] = useState("");

  // Company context (optional)
  const [includeCompany, setIncludeCompany] = useState(false);
  const [companySource, setCompanySource] = useState<"project" | "text">(
    "project"
  );
  const [company, setCompany] = useState("");
  const [companyText, setCompanyText] = useState("");

  const [saveResult, setSaveResult] = useState(false);

  const handleJobCompanyChange = (value: string | null) => {
    setJobCompany(value || "");
    setJob("");
    if (value) {
      loadJobsForCompany(value);
    }
  };

  const handleSubmit = async () => {
    const data: Record<string, any> = {};

    // Add personal info
    if (personSource === "project" && person) {
      data.person = person;
    } else if (personSource === "text" && personText) {
      data.personalInfo = personText;
    } else {
      return;
    }

    // Add job (required)
    if (jobSource === "project" && jobCompany && job) {
      data.jobCompany = jobCompany;
      data.job = job;
    } else if (jobSource === "text" && jobText) {
      data.jobDescription = jobText;
    } else {
      return;
    }

    // Add company context
    if (includeCompany) {
      if (companySource === "project" && company) {
        data.company = company;
      } else if (companySource === "text" && companyText) {
        data.companyText = companyText;
      }
    }

    if (saveResult) {
      data.save = true;
    }

    try {
      const result = await api.execute(data);
      onResult(result);
    } catch (error) {
      // Error handled by useApi
    }
  };

  const currentJobs = jobCompany && jobs[jobCompany] ? jobs[jobCompany] : [];

  return (
    <Paper shadow="sm" p="md" withBorder>
      <Title order={2} mb="md">
        Build Tailored Resume
      </Title>

      <Stack gap="lg">
        {/* Personal Info Section */}
        <Paper p="md" withBorder bg="gray.0">
          <Text fw={600} mb="md">
            Personal Info
          </Text>

          <Radio.Group
            value={personSource}
            onChange={(value) => setPersonSource(value as "project" | "text")}
            mb="md"
          >
            <Group>
              <Radio value="project" label="From Project" />
              <Radio value="text" label="Paste Text" />
            </Group>
          </Radio.Group>

          {personSource === "project" && (
            <Select
              label="Person"
              placeholder="Select person..."
              data={people.map((p) => ({ value: p.name, label: p.name }))}
              value={person}
              onChange={(v) => setPerson(v || "")}
              searchable
            />
          )}

          {personSource === "text" && (
            <Textarea
              label="Personal Info"
              placeholder="Paste comprehensive personal info..."
              value={personText}
              onChange={(e) => setPersonText(e.target.value)}
              rows={8}
            />
          )}
        </Paper>

        {/* Job Description Section (Required) */}
        <Paper p="md" withBorder bg="gray.0">
          <Text fw={600} mb="md">
            Job Description (Required)
          </Text>

          <Radio.Group
            value={jobSource}
            onChange={(value) => setJobSource(value as "project" | "text")}
            mb="md"
          >
            <Group>
              <Radio value="project" label="From Project" />
              <Radio value="text" label="Paste Text" />
            </Group>
          </Radio.Group>

          {jobSource === "project" && (
            <Stack gap="md">
              <Select
                label="Company"
                placeholder="Select company..."
                data={companies.map((c) => ({ value: c.name, label: c.name }))}
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
            </Stack>
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
        </Paper>

        {/* Optional Company Context */}
        <Paper p="md" withBorder bg="gray.0">
          <Checkbox
            label="Include company context (optional but recommended)"
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
          Build Resume
        </Button>

        {api.loading && (
          <LoadingSpinner message="Building tailored resume..." />
        )}
        {api.error && (
          <AlertMessage type="error" message={api.error} onClose={api.reset} />
        )}
      </Stack>
    </Paper>
  );
}
