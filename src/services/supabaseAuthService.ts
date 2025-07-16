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

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      // Validate input
      if (!AuthValidation.validateEmail(credentials.email)) {
        throw new AuthServiceError('Invalid email format');
      }

      if (!credentials.password || credentials.password.length < 1) {
        throw new AuthServiceError('Password is required');
      }

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      if (!data.user || !data.session) {
        throw new AuthServiceError('Login failed - no user or session returned');
      }

      // Get user profile from our custom users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new AuthServiceError('Failed to fetch user profile');
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        profile_picture_url: userProfile.profile_picture_url,
        boost_mode_enabled: userProfile.boost_mode_enabled,
        subscription_tier: userProfile.subscription_tier,
        email_verified: userProfile.email_verified,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      };

      const authToken: AuthToken = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        token_type: data.session.token_type || 'bearer',
        user,
      };

      return authToken;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
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

  async refreshToken(): Promise<AuthToken> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      if (!data.session || !data.user) {
        throw new AuthServiceError('Token refresh failed - no session returned');
      }

      // Get updated user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new AuthServiceError('Failed to fetch user profile during token refresh');
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        profile_picture_url: userProfile.profile_picture_url,
        boost_mode_enabled: userProfile.boost_mode_enabled,
        subscription_tier: userProfile.subscription_tier,
        email_verified: userProfile.email_verified,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      };

      const authToken: AuthToken = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        token_type: data.session.token_type || 'bearer',
        user,
      };

      return authToken;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  // Password Management (placeholder implementations for now)
  async resetPassword(_request: ResetPasswordRequest): Promise<void> {
    throw new AuthServiceError('Reset password not implemented yet');
  }

  async updatePassword(_newPassword: string, _currentPassword?: string): Promise<void> {
    throw new AuthServiceError('Update password not implemented yet');
  }

  // Session Management
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      if (!user) {
        return null;
      }

      // Get user profile from our custom users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        return null;
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        profile_picture_url: userProfile.profile_picture_url,
        boost_mode_enabled: userProfile.boost_mode_enabled,
        subscription_tier: userProfile.subscription_tier,
        email_verified: userProfile.email_verified,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  async getSession(): Promise<AuthToken | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw AuthServiceError.fromSupabaseError(error);
      }

      if (!session || !session.user) {
        return null;
      }

      // Get user profile from our custom users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        return null;
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        profile_picture_url: userProfile.profile_picture_url,
        boost_mode_enabled: userProfile.boost_mode_enabled,
        subscription_tier: userProfile.subscription_tier,
        email_verified: userProfile.email_verified,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      };

      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in || 3600,
        token_type: session.token_type || 'bearer',
        user,
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw AuthServiceError.fromSupabaseError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Get user profile from our custom users table
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Failed to fetch user profile:', profileError);
              callback(null);
              return;
            }

            const user: User = {
              id: userProfile.id,
              email: userProfile.email,
              display_name: userProfile.display_name,
              bio: userProfile.bio,
              profile_picture_url: userProfile.profile_picture_url,
              boost_mode_enabled: userProfile.boost_mode_enabled,
              subscription_tier: userProfile.subscription_tier,
              email_verified: userProfile.email_verified,
              created_at: userProfile.created_at,
              updated_at: userProfile.updated_at,
            };

            callback(user);
          } catch (error) {
            console.error('Error in auth state change:', error);
            callback(null);
          }
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  // Profile Management (placeholder implementations for now)
  async updateProfile(_updates: Partial<User>): Promise<User> {
    throw new AuthServiceError('Update profile not implemented yet');
  }

  async uploadProfilePicture(_imageUri: string): Promise<string> {
    throw new AuthServiceError('Upload profile picture not implemented yet');
  }

  async deleteAccount(): Promise<void> {
    throw new AuthServiceError('Delete account not implemented yet');
  }

  // Boost Mode & Subscription (placeholder implementations for now)
  async toggleBoostMode(): Promise<boolean> {
    throw new AuthServiceError('Toggle boost mode not implemented yet');
  }

  async updateSubscriptionTier(_tier: 'free' | 'premium'): Promise<void> {
    throw new AuthServiceError('Update subscription tier not implemented yet');
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();