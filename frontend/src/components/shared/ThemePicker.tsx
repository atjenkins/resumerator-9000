import {
  Modal,
  Card,
  Grid,
  Text,
  Box,
  Stack,
  Title,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useThemeStore } from "../../theme/useThemeStore";
import { getAllThemes } from "../../theme/themes";
import { updateProfile } from "../../services/api";
import { notifications } from "@mantine/notifications";

interface ThemePickerProps {
  opened: boolean;
  onClose: () => void;
}

export function ThemePicker({ opened, onClose }: ThemePickerProps) {
  const { themeId, setThemeId } = useThemeStore();
  const themes = getAllThemes();

  const handleSelect = async (id: string) => {
    // Update Zustand store immediately for instant UI feedback
    setThemeId(id);

    // Persist to database (fire-and-forget for better UX)
    try {
      await updateProfile({ theme_id: id });
    } catch (error) {
      console.error("Failed to persist theme preference:", error);
      notifications.show({
        title: "Theme not saved",
        message:
          "Your theme changed locally but couldn't be saved to your profile.",
        color: "yellow",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Choose Your Theme</Title>}
      size="lg"
      centered
    >
      <Text c="dimmed" size="sm" mb="lg">
        Select a personality for your Resumerator experience. Your choice will
        change colors, text, and the overall vibe of the app.
      </Text>

      <Grid gutter="md">
        {themes.map((theme) => {
          const isSelected = themeId === theme.id;

          return (
            <Grid.Col key={theme.id} span={6}>
              <Card
                shadow="sm"
                padding="lg"
                style={{
                  cursor: "pointer",
                  border: isSelected ? "2px solid" : "1px solid transparent",
                  borderColor: isSelected
                    ? theme.mantineTheme.primaryColor
                    : undefined,
                  position: "relative",
                  height: "240px",
                }}
                onClick={() => handleSelect(theme.id)}
              >
                {isSelected && (
                  <Box
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                    }}
                  >
                    <IconCheck size={24} />
                  </Box>
                )}

                <Stack gap="sm">
                  {/* Gradient preview */}
                  <Box
                    style={{
                      width: "100%",
                      height: "60px",
                      background: theme.headerGradient,
                      borderRadius: "8px",
                    }}
                  />

                  {/* Theme info */}
                  <div>
                    <Text fw={600} size="lg">
                      {theme.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {theme.description}
                    </Text>
                  </div>

                  {/* Example tagline */}
                  <Text size="xs" fs="italic" c="dimmed">
                    "{theme.tagline}"
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </Modal>
  );
}
