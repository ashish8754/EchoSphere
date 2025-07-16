// Authentication Types
export interface User {
  id: string;
  email: string;
  display_name: string;
  bio?: string;
  profile_picture_url?: string;
  boost_mode_enabled: boolean;
  subscription_tier: 'free' | 'premium';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  display_name: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  boostModeEnabled: boolean;
  subscriptionTier: 'free' | 'premium';
  error: AuthError | null;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls?: string[];
  boost_enabled: boolean;
  ai_suggestions?: string[];
  semantic_score?: number;
  emotion_tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  owner_id: string;
  is_private: boolean;
  created_at: string;
}

export interface CircleMember {
  circle_id: string;
  user_id: string;
  joined_at: string;
}

export interface PostCircle {
  post_id: string;
  circle_id: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BoostFeatures {
  aiSuggestions?: string[];
  semanticScore?: number;
  emotionTags?: string[];
  gamificationPoints?: number;
}

export interface SentimentAnalysis {
  mood: 'positive' | 'neutral' | 'negative';
  emotions: string[];
  confidence: number;
}

export interface MoodGroup {
  mood: string;
  posts: Post[];
  count: number;
}