import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider, Center, Loader, Stack, Text } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResumesPage } from "./pages/ResumesPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { JobsPage } from "./pages/JobsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { Login } from "./components/auth/Login";
import { SignUp } from "./components/auth/SignUp";
import { theme } from "./theme/theme";

function AuthenticatedApp() {
  const [activePage, setActivePage] = useState("dashboard");

  const handleNavigate = (page: string, _state?: any) => {
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "profile":
        return <ProfilePage />;
      case "resumes":
        return <ResumesPage onNavigate={handleNavigate} />;
      case "companies":
        return <CompaniesPage onNavigate={handleNavigate} />;
      case "jobs":
        return <JobsPage onNavigate={handleNavigate} />;
      case "history":
        return <HistoryPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  if (!user) {
    return showSignUp ? (
      <SignUp onSwitchToLogin={() => setShowSignUp(false)} />
    ) : (
      <Login onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
