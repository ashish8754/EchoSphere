import { supabase } from './supabase';
import { AuthService, AuthServiceError, AuthValidation } from './authService';
import { User, AuthToken, LoginCredentials, RegisterCredentials, ResetPasswordRequest } from '../types';

export class SupabaseAuthService implements AuthService {
  // Registration
  async register(credentials: RegisterCredentials): Promise<{ user: User; needsVerification: boolean }> {
    try {
      // Validate input
      if (!AuthValidation.validateEmail(credentials.email)) {
        throw new AuthServiceError('Invalid email format');
      }

      const passwordValidation = AuthValidation.validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        throw new AuthServiceError(passwordValidation.errors.join(', '));
      }

      if (!AuthValidation.validateDisplayName(credentials.display_name)) {
        throw new AuthServiceError('Display name must be between 2 and 50 characters');
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            display_name: credentials.display_name,
          },
        },
      });

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      if (!data.user) {
        throw new AuthServiceError('Registration failed - no user returned');
      }

      // Create user profile in our custom users table
      const userProfile: Omit<User, 'id'> = {
        email: credentials.email,
        display_name: credentials.display_name,
        boost_mode_enabled: false,
        subscription_tier: 'free',
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert([{ ...userProfile, id: data.user.id }]);

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // For now, we'll log the error and continue
        console.error('Failed to create user profile:', profileError);
      }

      const user: User = {
        id: data.user.id,
        ...userProfile,
      };

      return {
        user,
        needsVerification: !data.user.email_confirmed_at,
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      // Update user profile to mark email as verified
      if (data.user) {
        await supabase
          .from('users')
          .update({ email_verified: true, updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return !!data.user;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  async resendVerification(email: string): Promise<void> {
    try {
      if (!AuthValidation.validateEmail(email)) {
        throw new AuthServiceError('Invalid email format');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  // Authentication (placeholder implementations for now)
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    throw new AuthServiceError('Login not implemented yet');
  }

  async logout(): Promise<void> {
    throw new AuthServiceError('Logout not implemented yet');
  }

  async refreshToken(): Promise<AuthToken> {
    throw new AuthServiceError('Refresh token not implemented yet');
  }

  // Password Management (placeholder implementations for now)
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    throw new AuthServiceError('Reset password not implemented yet');
  }

  async updatePassword(newPassword: string, currentPassword?: string): Promise<void> {
    throw new AuthServiceError('Update password not implemented yet');
  }

  // Session Management (placeholder implementations for now)
  async getCurrentUser(): Promise<User | null> {
    throw new AuthServiceError('Get current user not implemented yet');
  }

  async getSession(): Promise<AuthToken | null> {
    throw new AuthServiceError('Get session not implemented yet');
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    throw new AuthServiceError('Auth state change not implemented yet');
  }

  // Profile Management (placeholder implementations for now)
  async updateProfile(updates: Partial<User>): Promise<User> {
    throw new AuthServiceError('Update profile not implemented yet');
  }

  async uploadProfilePicture(imageUri: string): Promise<string> {
    throw new AuthServiceError('Upload profile picture not implemented yet');
  }

  async deleteAccount(): Promise<void> {
    throw new AuthServiceError('Delete account not implemented yet');
  }

  // Boost Mode & Subscription (placeholder implementations for now)
  async toggleBoostMode(): Promise<boolean> {
    throw new AuthServiceError('Toggle boost mode not implemented yet');
  }

  async updateSubscriptionTier(tier: 'free' | 'premium'): Promise<void> {
    throw new AuthServiceError('Update subscription tier not implemented yet');
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();