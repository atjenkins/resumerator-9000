import {
  Box,
  UnstyledButton,
  Text,
  Drawer,
  NavLink,
  Divider,
  Menu,
  Avatar,
  Button,
  Stack,
} from "@mantine/core";
import {
  IconHome,
  IconDashboard,
  IconReportAnalytics,
  IconSparkles,
  IconMenu2,
  IconUser,
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconHistory,
  IconPalette,
  IconLogout,
} from "@tabler/icons-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ThemePicker } from "../shared/ThemePicker";

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  const { profile, signOut } = useAuth();
  const [moreDrawerOpened, setMoreDrawerOpened] = useState(false);
  const [themePickerOpened, setThemePickerOpened] = useState(false);

  const primaryTabs = [
    { value: "home", label: "Home", icon: IconHome },
    { value: "dashboard", label: "Dashboard", icon: IconDashboard },
    { value: "analyze", label: "Analyze", icon: IconReportAnalytics },
    { value: "generate", label: "Generate", icon: IconSparkles },
    { value: "more", label: "More", icon: IconMenu2 },
  ];

  const moreItems = [
    { value: "profile", label: "Profile", icon: IconUser },
    { value: "resumes", label: "Resumes", icon: IconFileText },
    { value: "companies", label: "Companies", icon: IconBriefcase },
    { value: "jobs", label: "Jobs", icon: IconClipboard },
    { value: "history", label: "History", icon: IconHistory },
  ];

  const handleTabClick = (value: string) => {
    if (value === "more") {
      setMoreDrawerOpened(true);
    } else {
      onNavigate(value);
    }
  };

  const handleMoreItemClick = (value: string) => {
    setMoreDrawerOpened(false);
    onNavigate(value);
  };

  return (
    <>
      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: "var(--mantine-color-body)",
          borderTop: "1px solid var(--mantine-color-default-border)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {primaryTabs.map((tab) => {
          const isActive = tab.value === "more" ? false : activePage === tab.value;
          const Icon = tab.icon;

          return (
            <UnstyledButton
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                height: "100%",
                color: isActive
                  ? "var(--mantine-color-blue-filled)"
                  : "var(--mantine-color-dimmed)",
                transition: "color 0.2s",
              }}
            >
              <Icon size={24} stroke={1.5} />
              <Text size="xs" fw={isActive ? 600 : 400}>
                {tab.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </Box>

      <Drawer
        opened={moreDrawerOpened}
        onClose={() => setMoreDrawerOpened(false)}
        position="bottom"
        size="auto"
        padding="md"
        title="More Options"
        styles={{
          body: { paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" },
        }}
      >
        <Stack gap="xs">
          {moreItems.map((item) => (
            <NavLink
              key={item.value}
              active={activePage === item.value}
              label={item.label}
              leftSection={<item.icon size={20} />}
              onClick={() => handleMoreItemClick(item.value)}
              style={{
                cursor: "pointer",
              }}
            />
          ))}

          <Divider my="sm" />

          <Button
            variant="subtle"
            fullWidth
            justify="flex-start"
            leftSection={<IconPalette size={20} />}
            onClick={() => {
              setMoreDrawerOpened(false);
              setThemePickerOpened(true);
            }}
          >
            Change Theme
          </Button>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="subtle"
                fullWidth
                justify="flex-start"
                leftSection={<Avatar size="sm" radius="xl" color="blue" />}
              >
                {profile?.display_name || "User"}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />} disabled>
                {profile?.display_name}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={() => signOut()}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Stack>
      </Drawer>

      <ThemePicker
        opened={themePickerOpened}
        onClose={() => setThemePickerOpened(false)}
      />
    </>
  );
}
