import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Types for our database schema
export interface Profile {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  company_id: string | null;
  job_id: string | null;
  title: string;
  content: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}
