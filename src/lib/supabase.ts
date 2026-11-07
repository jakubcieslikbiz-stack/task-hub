import { createClient } from '@supabase/supabase-js';

// Read environment variables (supports all variations of Vercel prefixes)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
