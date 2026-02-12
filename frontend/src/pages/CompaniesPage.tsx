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
import { IconPlus, IconBriefcase } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
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
        <Card shadow="sm" padding="xl">
          <Text c="dimmed" ta="center">
            No companies yet. Add companies you're interested in or applying to.
          </Text>
        </Card>
      ) : (
        <Grid>
          {companies.map((company) => {
            const createdDate = new Date(company.created_at);
            const updatedDate = new Date(company.updated_at);
            const showUpdated =
              updatedDate.getTime() - createdDate.getTime() > 1000;

            return (
              <Grid.Col key={company.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card
                  shadow="sm"
                  padding="lg"
                  style={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() =>
                    onNavigate("company-detail", { id: company.id })
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <Stack gap="sm">
                    <Group>
                      <IconBriefcase size={24} color="gray" />
                      <Text fw={500}>{company.name}</Text>
                    </Group>

                    <Stack gap="xs" mt="auto">
                      <Text size="xs" c="dimmed">
                        Created: {createdDate.toLocaleString()}
                      </Text>
                      {showUpdated && (
                        <Text size="xs" c="dimmed">
                          Updated: {updatedDate.toLocaleString()}
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Company"
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
