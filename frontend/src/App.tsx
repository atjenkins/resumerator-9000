import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AppShell } from './components/layout/AppShell';
import { DataManagerTab } from './components/data-manager/DataManagerTab';
import { ReviewTab } from './components/review/ReviewTab';
import { BuildTab } from './components/build/BuildTab';
import { ResultsTab } from './components/results/ResultsTab';
import { useAppStore } from './store';
import { theme } from './theme/theme';

function App() {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <AppShell>
        {activeTab === 'data-manager' && <DataManagerTab />}
        {activeTab === 'review' && <ReviewTab />}
        {activeTab === 'build' && <BuildTab />}
        {activeTab === 'results' && <ResultsTab />}
      </AppShell>
    </MantineProvider>
  );
}

export default App;
