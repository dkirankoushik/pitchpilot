import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export type UserRole = 'founder' | 'investor' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type InviteStatus = 'pending' | 'viewed' | 'interested' | 'passed' | 'connected';
export interface Profile { id: string; email: string; full_name: string | null; avatar_url: string | null; role: UserRole; credits: number; created_at: string; }
export interface Startup { id: string; founder_id: string; name: string; tagline: string | null; description: string | null; sector: string | null; stage: string | null; location: string | null; raise_amount: string | null; team_size: number; traction: string | null; website: string | null; pitch_video_url: string | null; tags: string[] | null; mrr: string | null; founded_year: number | null; is_public: boolean; status: 'active' | 'inactive' | 'funded'; approval_status: ApprovalStatus; rejection_reason: string | null; views: number; created_at: string; profiles?: Profile; }
export interface InvestorProfile { id: string; profile_id: string; firm_name: string | null; title: string | null; thesis: string | null; check_size_min: number | null; check_size_max: number | null; preferred_sectors: string[]; preferred_stages: string[]; is_open_to_deals: boolean; total_deals: number; profiles?: Profile; }
export interface PitchInvite { id: string; startup_id: string; investor_id: string; founder_id: string; status: InviteStatus; message: string | null; credits_used: number; created_at: string; startups?: Startup; profiles?: Profile; }
export interface AppEvent { id: string; title: string; type: 'Competition' | 'Grant' | 'Accelerator' | 'Conference'; organization: string | null; description: string | null; prize: string | null; deadline: string | null; location: string | null; tags: string[]; apply_url: string | null; is_urgent: boolean; created_at: string; }
export interface Subscription { id: string; subscriber_id: string; startup_id: string; plan: 'unlock' | 'pro'; status: 'active' | 'cancelled'; created_at: string; }
export interface StartupDocument { id: string; startup_id: string; title: string; type: 'pitch_deck' | 'financials' | 'legal' | 'product' | 'other'; url: string | null; is_public: boolean; created_at: string; }
