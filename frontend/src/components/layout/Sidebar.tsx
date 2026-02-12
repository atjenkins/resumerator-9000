import { NavLink } from "@mantine/core";
import {
  IconDashboard,
  IconUser,
  IconFileText,
  IconBriefcase,
  IconClipboard,
  IconReportAnalytics,
  IconSparkles,
  IconHistory,
} from "@tabler/icons-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const navItems = [
    { value: "dashboard", label: "Dashboard", icon: IconDashboard },
    { value: "profile", label: "Profile", icon: IconUser },
    { value: "resumes", label: "Resumes", icon: IconFileText },
    { value: "companies", label: "Companies", icon: IconBriefcase },
    { value: "jobs", label: "Jobs", icon: IconClipboard },
    { value: "analyze", label: "Analyze", icon: IconReportAnalytics },
    { value: "generate", label: "Generate", icon: IconSparkles },
    { value: "history", label: "History", icon: IconHistory },
  ];

  return (
    <div style={{ width: 250, padding: "1rem" }}>
      {navItems.map((item) => (
        <NavLink
          key={item.value}
          active={activePage === item.value}
          label={item.label}
          leftSection={<item.icon size={20} />}
          onClick={() => onNavigate(item.value)}
          style={{ marginBottom: "0.5rem", cursor: "pointer" }}
        />
      ))}
    </div>
  );
}
