import { useState, useEffect } from "react";
import {
  Title,
  Stack,
  Card,
  Button,
  Group,
  Text,
  Grid,
  Modal,
  TextInput,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { CompanyCard } from "../components/shared/CompanyCard";
import { getCompanies, createCompany } from "../services/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CompaniesPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export function CompaniesPage({ onNavigate }: CompaniesPageProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data as Company[]);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load companies",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      setCreating(true);
      await createCompany({
        name: newName,
        content: `# ${newName}\n\n`,
      });
      setCreateModalOpen(false);
      setNewName("");
      await loadCompanies();
      notifications.show({
        title: "Success",
        message: "Company created",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create company",
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Text>Loading companies...</Text>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>Companies</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Company
        </Button>
      </Group>

      {companies.length === 0 ? (
        <Card shadow="sm" padding={isMobile ? "md" : "xl"}>
          <Text c="dimmed" ta="center">
            No companies yet. Add companies you're interested in or applying to.
          </Text>
        </Card>
      ) : (
        <Grid>
          {companies.map((company) => (
            <Grid.Col key={company.id} span={{ base: 12, md: 6, lg: 4 }}>
              <CompanyCard
                company={company}
                onClick={() => onNavigate("company-detail", { id: company.id })}
                showHoverEffect
              />
            </Grid.Col>
          ))}
        </Grid>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Company"
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Company Name"
            placeholder="e.g., Google, Microsoft"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
