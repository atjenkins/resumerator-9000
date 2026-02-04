import { Tabs } from '@mantine/core';
import { useAppStore } from '../../store';

export function Navigation() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)} mb="xl">
      <Tabs.List>
        <Tabs.Tab value="data-manager">Data Manager</Tabs.Tab>
        <Tabs.Tab value="review">Review</Tabs.Tab>
        <Tabs.Tab value="build">Build</Tabs.Tab>
        <Tabs.Tab value="results">Results</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
