import { useState, useEffect, useCallback } from 'react';
import { getPeople, getCompanies, getJobs } from '../services/api';
import type { PersonInfo, CompanyInfo, JobInfo } from '../services/types';

export function useProject() {
  const [people, setPeople] = useState<PersonInfo[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [jobs, setJobs] = useState<Record<string, JobInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPeople();
      setPeople(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load people');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobsForCompany = useCallback(async (company: string) => {
    try {
      const data = await getJobs(company);
      setJobs((prev) => ({ ...prev, [company]: data }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadPeople(), loadCompanies()]);
  }, [loadPeople, loadCompanies]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    people,
    companies,
    jobs,
    loading,
    error,
    loadPeople,
    loadCompanies,
    loadJobsForCompany,
    refreshAll,
  };
}
