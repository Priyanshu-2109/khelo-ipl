export type AppUser = {
  id?: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  profilePicture?: string | null;
};

export type PasswordRequirements = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
};

export type LeaderboardPlayer = {
  user_id: string;
  display_name: string;
  profilePicture: string | null;
  total_points: number;
  matches_played: number;
  average_points: number;
  best_rank: number | null;
};

export type PlayerMatch = {
  id: string;
  match_name: string;
  match_date: string;
  user_rank: number;
  points: number;
};

export type ScoringProfile = {
  id: string;
  name: string;
  description: string;
  point_distribution: Record<string, number>;
  is_multiplier: boolean;
  multiplier: number;
  max_ranks: number;
  is_default?: boolean;
};

export type AdminGame = {
  id: string;
  match_name: string;
  match_date: string;
  match_time?: string;
  venue?: string;
  is_completed: boolean;
  scoring_profile_name?: string;
};

export type RankingsUser = {
  id: string;
  display_name: string;
  email: string;
};
