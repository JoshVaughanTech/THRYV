export type UserRole = 'user' | 'creator' | 'admin';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled';
export type ProgramStatus = 'draft' | 'published' | 'unpublished';
export type CreditEventType = 'monthly_grant' | 'trial_grant' | 'program_activation' | 'admin_adjustment';
export type UsageEventType = 'program_activation' | 'workout_completion' | 'time_spent' | 'community_engagement';
export type MomentumEventType = 'workout_completion' | 'streak_bonus' | 'weekly_consistency' | 'program_completion';
export type PayoutStatus = 'pending' | 'locked';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  goals: string[] | null;
  experience_level: string | null;
  equipment: string[] | null;
  time_availability: string | null;
  created_at: string;
  updated_at: string;
}

export interface Creator {
  id: string;
  user_id: string;
  bio: string | null;
  credentials: string | null;
  video_url: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  goal: string | null;
  discipline: string | null;
  experience_level: string | null;
  equipment: string[] | null;
  duration_weeks: number;
  credit_cost: number;
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
  // joined fields
  creator?: Creator & { profile?: Profile };
}

export interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
  title: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  week_id: string;
  program_id: string;
  title: string;
  description: string | null;
  day_of_week: number | null;
  order_index: number;
  estimated_duration: number | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  notes: string | null;
  video_url: string | null;
  order_index: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLedger {
  id: string;
  user_id: string;
  amount: number;
  event_type: CreditEventType;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ProgramActivation {
  id: string;
  user_id: string;
  program_id: string;
  activated_at: string;
  completed_at: string | null;
  current_week: number;
  is_active: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string;
  program_id: string;
  completed_at: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface MomentumEvent {
  id: string;
  user_id: string;
  event_type: MomentumEventType;
  points: number;
  reference_id: string | null;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  updated_at: string;
}

export interface Post {
  id: string;
  program_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  program_id: string;
  creator_id: string;
  event_type: UsageEventType;
  value: number | null;
  created_at: string;
}

export interface PayoutRun {
  id: string;
  month: string;
  total_revenue: number;
  platform_margin_pct: number;
  creator_pool: number;
  status: PayoutStatus;
  triggered_by: string;
  created_at: string;
}

export interface PayoutResult {
  id: string;
  payout_run_id: string;
  creator_id: string;
  workout_completions_score: number;
  time_spent_score: number;
  engagement_score: number;
  weighted_score: number;
  share_pct: number;
  earnings: number;
  created_at: string;
}
