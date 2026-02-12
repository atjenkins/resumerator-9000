import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider, Center, Loader, Stack, Text } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResumesPage } from "./pages/ResumesPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { JobsPage } from "./pages/JobsPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { GeneratePage } from "./pages/GeneratePage";
import { HistoryPage } from "./pages/HistoryPage";
import { ResumeDetailPage } from "./pages/ResumeDetailPage";
import { CompanyDetailPage } from "./pages/CompanyDetailPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { AnalysisDetailPage } from "./pages/AnalysisDetailPage";
import { Login } from "./components/auth/Login";
import { SignUp } from "./components/auth/SignUp";
import { useThemeStore } from "./theme/useThemeStore";
import { getTheme } from "./theme/themes";

function AuthenticatedApp() {
  const [activePage, setActivePage] = useState("home");
  const [pageState, setPageState] = useState<any>(null);

  const handleNavigate = (page: string, state?: any) => {
    setActivePage(page);
    setPageState(state || null);
  };

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "profile":
        return <ProfilePage />;
      case "resumes":
        return <ResumesPage onNavigate={handleNavigate} />;
      case "resume-detail":
        return pageState?.id ? (
          <ResumeDetailPage
            onNavigate={handleNavigate}
            resumeId={pageState.id}
          />
        ) : (
          <DashboardPage onNavigate={handleNavigate} />
        );
      case "companies":
        return <CompaniesPage onNavigate={handleNavigate} />;
      case "company-detail":
        return pageState?.id ? (
          <CompanyDetailPage
            onNavigate={handleNavigate}
            companyId={pageState.id}
          />
        ) : (
          <DashboardPage onNavigate={handleNavigate} />
        );
      case "jobs":
        return <JobsPage onNavigate={handleNavigate} />;
      case "job-detail":
        return pageState?.id ? (
          <JobDetailPage onNavigate={handleNavigate} jobId={pageState.id} />
        ) : (
          <DashboardPage onNavigate={handleNavigate} />
        );
      case "analyze":
        return (
          <AnalyzePage
            onNavigate={handleNavigate}
            preSelectedResumeId={pageState?.resumeId}
          />
        );
      case "generate":
        return (
          <GeneratePage
            onNavigate={handleNavigate}
            preSelectedResumeId={pageState?.resumeId}
          />
        );
      case "history":
        return <HistoryPage onNavigate={handleNavigate} />;
      case "analysis-detail":
        return pageState?.id ? (
          <AnalysisDetailPage
            onNavigate={handleNavigate}
            analysisId={pageState.id}
          />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
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
  const themeId = useThemeStore((s) => s.themeId);
  const appTheme = getTheme(themeId);

  return (
    <MantineProvider theme={appTheme.mantineTheme}>
      <Notifications position="top-right" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
