import { createClient } from '@supabase/supabase-js';

// Pull the environment variables securely
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Create and export the connection
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
