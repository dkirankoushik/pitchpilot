import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'founder' | 'investor' | 'admin';
  credits: number;
  created_at: string;
};

export type Startup = {
  id: string;
  founder_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  sector: string | null;
  stage: string | null;
  location: string | null;
  raise_amount: string | null;
  team_size: number;
  traction: string | null;
  website: string | null;
  pitch_video_url: string | null;
  is_public: boolean;
  status: 'active' | 'inactive' | 'funded';
  views: number;
  created_at: string;
  profiles?: Profile;
};

export type InvestorProfile = {
  id: string;
  profile_id: string;
  firm_name: string | null;
  title: string | null;
  thesis: string | null;
  check_size_min: number | null;
  check_size_max: number | null;
  preferred_sectors: string[];
  preferred_stages: string[];
  is_open_to_deals: boolean;
  total_deals: number;
  profiles?: Profile;
};

export type PitchInvite = {
  id: string;
  startup_id: string;
  investor_id: string;
  founder_id: string;
  status: 'pending' | 'viewed' | 'interested' | 'passed' | 'connected';
  message: string | null;
  credits_used: number;
  created_at: string;
  startups?: Startup;
  profiles?: Profile;
};

export type Event = {
  id: string;
  title: string;
  type: 'Competition' | 'Grant' | 'Accelerator' | 'Conference';
  organization: string | null;
  description: string | null;
  prize: string | null;
  deadline: string | null;
  location: string | null;
  tags: string[];
  apply_url: string | null;
  is_urgent: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
