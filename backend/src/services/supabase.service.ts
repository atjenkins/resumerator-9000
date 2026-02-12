import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required"
  );
}

// Create Supabase client with service role key (for backend operations)
// Typed with generated Database schema for full type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
