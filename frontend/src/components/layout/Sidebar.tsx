import {
  NavLink,
  Divider,
  Text,
  ActionIcon,
  Menu,
  Avatar,
  Button,
  Box,
  Tooltip,
  Stack,
} from "@mantine/core";
import {
  IconHome,
  IconDashboard,
  IconUser,
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconReportAnalytics,
  IconSparkles,
  IconHistory,
  IconPalette,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ThemePicker } from "../shared/ThemePicker";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onWidthChange?: (width: number) => void;
}

export function Sidebar({
  activePage,
  onNavigate,
  onWidthChange,
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [themePickerOpened, setThemePickerOpened] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;
  const sidebarWidth = isExpanded ? 250 : 80;

  useEffect(() => {
    onWidthChange?.(sidebarWidth);
  }, [sidebarWidth, onWidthChange]);
  // Main navigation group
  const mainNavItems = [
    { value: "home", label: "Home", icon: IconHome },
    { value: "dashboard", label: "Dashboard", icon: IconDashboard },
  ];

  // Data management group
  const dataManagementItems = [
    { value: "profile", label: "Profile", icon: IconUser },
    { value: "resumes", label: "Resumes", icon: IconFileText },
    { value: "companies", label: "Companies", icon: IconBriefcase },
    { value: "jobs", label: "Jobs", icon: IconClipboard },
  ];

  // Tools group
  const toolsItems = [
    { value: "analyze", label: "Analyze", icon: IconReportAnalytics },
    { value: "generate", label: "Generate", icon: IconSparkles },
  ];

  // History group
  const historyItems = [
    { value: "history", label: "History", icon: IconHistory },
  ];

  const renderNavItems = (items: typeof mainNavItems) => (
    <>
      {items.map((item) => {
        const navItem = (
          <NavLink
            key={item.value}
            active={activePage === item.value}
            label={isExpanded ? item.label : ""}
            leftSection={<item.icon size={20} />}
            onClick={() => onNavigate(item.value)}
            style={{
              marginBottom: "0.5rem",
              cursor: "pointer",
              justifyContent: isExpanded ? "flex-start" : "center",
            }}
          />
        );

        return isExpanded ? (
          navItem
        ) : (
          <Tooltip
            key={item.value}
            label={item.label}
            position="right"
            withArrow
          >
            {navItem}
          </Tooltip>
        );
      })}
    </>
  );

  const renderSectionLabel = (label: string) => {
    if (!isExpanded) return null;

    return (
      <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs" pl="xs">
        {label}
      </Text>
    );
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: sidebarWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        transition: "all 0.4s ease-in-out",
        position: "relative",
      }}
    >
      {/* Logo/Brand Section */}
      <Box mb="lg">
        <Box
          style={{
            display: "flex",
            justifyContent: isExpanded ? "space-between" : "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              R
            </Box>
            <Box
              style={{
                width: isExpanded ? "auto" : 0,
                opacity: isExpanded ? 1 : 0,
                transition: "opacity 0.4s ease-in-out, width 0.4s ease-in-out",
                overflow: "hidden",
              }}
            >
              <Text
                fw={600}
                size="lg"
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                Resumerator
              </Text>
            </Box>
          </Box>
          <Box
            style={{
              width: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
              transition: "opacity 0.4s ease-in-out, width 0.4s ease-in-out",
              overflow: "hidden",
            }}
          >
            <Tooltip
              label={isPinned ? "Collapse sidebar" : "Expand sidebar"}
              position="right"
            >
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={() => setIsPinned(!isPinned)}
                style={{
                  pointerEvents: isExpanded ? "auto" : "none",
                }}
              >
                {isPinned ? (
                  <IconLayoutSidebarLeftCollapse size={18} />
                ) : (
                  <IconLayoutSidebarLeftExpand size={18} />
                )}
              </ActionIcon>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Main Navigation Content */}
      <Box style={{ flex: 1, overflowY: "auto" }}>
        {renderNavItems(mainNavItems)}

        <Divider my="md" />

        {renderSectionLabel("Data Management")}
        {renderNavItems(dataManagementItems)}

        <Divider my="md" />

        {renderSectionLabel("Tools")}
        {renderNavItems(toolsItems)}

        <Divider my="md" />

        {renderSectionLabel("History")}
        {renderNavItems(historyItems)}
      </Box>

      {/* Bottom Section - Theme & Profile */}
      <Box mt="auto" pt="md">
        <Divider mb="md" />

        {isExpanded ? (
          <Stack gap="xs">
            <Button
              variant="subtle"
              fullWidth
              justify="flex-start"
              leftSection={<IconPalette size={20} />}
              onClick={() => setThemePickerOpened(true)}
            >
              Theme
            </Button>

            <Menu shadow="md" width={200} position="top-end">
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
        ) : (
          <Stack gap="xs" align="center">
            <Tooltip label="Change theme" position="right">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setThemePickerOpened(true)}
              >
                <IconPalette size={20} />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200} position="right-end">
              <Menu.Target>
                <Tooltip
                  label={profile?.display_name || "User"}
                  position="right"
                >
                  <ActionIcon variant="subtle" size="lg">
                    <Avatar size="sm" radius="xl" color="blue" />
                  </ActionIcon>
                </Tooltip>
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
        )}
      </Box>

      <ThemePicker
        opened={themePickerOpened}
        onClose={() => setThemePickerOpened(false)}
      />
    </Box>
  );
}
