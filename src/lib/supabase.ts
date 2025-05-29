import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our data structures
export type CoverageItem = {
  id: string;
  outlet: string;
  title: string;
  url: string;
  date: string;
  reach: number;
  notes?: string;
  created_at: string;
};

export type OutreachItem = {
  id: string;
  contact_name: string;
  outlet: string;
  email: string;
  pitch_date: string;
  status: 'pending' | 'responded' | 'scheduled' | 'rejected';
  notes?: string;
  created_at: string;
};

export type EventItem = {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}; 