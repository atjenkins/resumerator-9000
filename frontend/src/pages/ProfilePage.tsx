import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Button,
  Group,
  FileButton,
  Text,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../contexts/AuthContext";
import { MarkdownEditor } from "../components/shared/MarkdownEditor";
import { AIProgressBar } from "../components/shared/AIProgressBar";
import {
  getProfile,
  updateProfile,
  enrichProfile,
  parseResume,
} from "../services/api";

export function ProfilePage() {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = (await getProfile()) as { content: string };
      setContent(data.content || "");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load profile",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ content });
      notifications.show({
        title: "Success",
        message: "Profile updated",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update profile",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setEnriching(true);
      const formData = new FormData();
      formData.append("file", file);

      // Parse the resume
      const parsed = (await parseResume(formData)) as { markdown: string };

      // Enrich profile with parsed content
      await enrichProfile({ text: parsed.markdown, mode: "merge" });

      // Reload profile
      await loadProfile();

      notifications.show({
        title: "Success",
        message: "Profile enriched from resume",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to enrich profile",
        color: "red",
      });
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return <Text>Loading profile...</Text>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>Profile</Title>
        <FileButton
          onChange={handleFileUpload}
          accept="application/pdf,.pdf,.docx"
        >
          {(props) => (
            <Button
              {...props}
              leftSection={<IconUpload size={16} />}
              loading={enriching}
              disabled={enriching}
            >
              Upload Resume to Enrich
            </Button>
          )}
        </FileButton>
      </Group>

      {enriching && (
        <Card shadow="sm" padding="lg">
          <AIProgressBar isRunning={enriching} operationType="enrich" />
        </Card>
      )}

      <Card shadow="sm" padding="lg">
        <Text c="dimmed" size="sm" mb="md">
          Your comprehensive professional profile. This serves as the source of
          truth for generating tailored resumes.
        </Text>
        <Text fw={500} mb="sm">
          Editing as: {profile?.display_name}
        </Text>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          onSave={handleSave}
          saving={saving}
          placeholder="# Professional Summary

## Experience

## Education

## Skills

..."
        />
      </Card>
    </Stack>
  );
}
