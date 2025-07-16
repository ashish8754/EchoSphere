import { User, AuthToken, LoginCredentials, RegisterCredentials, ResetPasswordRequest } from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AuthError } from '../types';

export interface AuthService {
  // Registration
  register(credentials: RegisterCredentials): Promise<{ user: User; needsVerification: boolean }>;
  verifyEmail(token: string): Promise<boolean>;
  resendVerification(email: string): Promise<void>;

  // Authentication
  login(credentials: LoginCredentials): Promise<AuthToken>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthToken>;

  // Password Management
  resetPassword(request: ResetPasswordRequest): Promise<void>;
  updatePassword(newPassword: string, currentPassword?: string): Promise<void>;

  // Session Management
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<AuthToken | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;

  // Profile Management
  updateProfile(updates: Partial<User>): Promise<User>;
  uploadProfilePicture(imageUri: string): Promise<string>;
  deleteAccount(): Promise<void>;

  // Boost Mode & Subscription
  toggleBoostMode(): Promise<boolean>;
  updateSubscriptionTier(tier: 'free' | 'premium'): Promise<void>;
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }

  static fromSupabaseError(error: any): AuthServiceError {
    return new AuthServiceError(
      error.message || 'Authentication error occurred',
      error.code,
      error.status
    );
  }
}

// Validation utilities
export const AuthValidation = {
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateDisplayName: (displayName: string): boolean => {
    return displayName.trim().length >= 2 && displayName.trim().length <= 50;
  }
};