import { SupabaseAuthService, authService } from '../supabaseAuthService';
import { AuthServiceError } from '../authService';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('SupabaseAuthService', () => {
  let service: SupabaseAuthService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    service = new SupabaseAuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'StrongPass123',
      display_name: 'Test User',
    };

    it('should register a user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await service.register(validCredentials);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.display_name).toBe('Test User');
      expect(result.needsVerification).toBe(true);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123',
        options: {
          data: {
            display_name: 'Test User',
          },
        },
      });
    });

    it('should throw error for invalid email', async () => {
      const invalidCredentials = {
        ...validCredentials,
        email: 'invalid-email',
      };

      await expect(service.register(invalidCredentials)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for weak password', async () => {
      const weakPasswordCredentials = {
        ...validCredentials,
        password: 'weak',
      };

      await expect(service.register(weakPasswordCredentials)).rejects.toThrow(
        AuthServiceError
      );
    });

    it('should throw error for invalid display name', async () => {
      const invalidNameCredentials = {
        ...validCredentials,
        display_name: 'A',
      };

      await expect(service.register(invalidNameCredentials)).rejects.toThrow(
        'Display name must be between 2 and 50 characters'
      );
    });

    it('should handle Supabase auth errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered', code: 'email_taken' },
      });

      await expect(service.register(validCredentials)).rejects.toThrow(
        AuthServiceError
      );
    });

    it('should handle missing user in response', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.register(validCredentials)).rejects.toThrow(
        'Registration failed - no user returned'
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await service.verifyEmail('verification-token');

      expect(result).toBe(true);
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'verification-token',
        type: 'signup',
      });
    });

    it('should handle verification errors', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', code: 'invalid_token' },
      });

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        AuthServiceError
      );
    });

    it('should return false for failed verification', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await service.verifyEmail('token');
      expect(result).toBe(false);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      mockSupabase.auth.resend.mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(service.resendVerification('test@example.com')).resolves.not.toThrow();

      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      });
    });

    it('should throw error for invalid email', async () => {
      await expect(service.resendVerification('invalid-email')).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should handle Supabase errors', async () => {
      mockSupabase.auth.resend.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded', code: 'rate_limit' },
      });

      await expect(service.resendVerification('test@example.com')).rejects.toThrow(
        AuthServiceError
      );
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'StrongPass123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        boost_mode_enabled: false,
        subscription_tier: 'free',
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
      } as any);

      const result = await service.login(validCredentials);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.display_name).toBe('Test User');
      expect(result.access_token).toBe('access-token');
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123',
      });
    });

    it('should throw error for invalid email', async () => {
      const invalidCredentials = {
        ...validCredentials,
        email: 'invalid-email',
      };

      await expect(service.login(invalidCredentials)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for empty password', async () => {
      const emptyPasswordCredentials = {
        ...validCredentials,
        password: '',
      };

      await expect(service.login(emptyPasswordCredentials)).rejects.toThrow(
        'Password is required'
      );
    });

    it('should handle Supabase auth errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', code: 'invalid_credentials' },
      });

      await expect(service.login(validCredentials)).rejects.toThrow(
        AuthServiceError
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      await expect(service.logout()).resolves.not.toThrow();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed', code: 'logout_error' },
      });

      await expect(service.logout()).rejects.toThrow(AuthServiceError);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        boost_mode_enabled: false,
        subscription_tier: 'free',
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
      } as any);

      const result = await service.getCurrentUser();

      expect(result?.email).toBe('test@example.com');
      expect(result?.display_name).toBe('Test User');
    });

    it('should return null when no user is logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await service.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should get current session successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'Test User',
        boost_mode_enabled: false,
        subscription_tier: 'free',
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
      } as any);

      const result = await service.getSession();

      expect(result?.access_token).toBe('access-token');
      expect(result?.user.email).toBe('test@example.com');
    });

    it('should return null when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await service.getSession();
      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const unsubscribe = service.onAuthStateChange(mockCallback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('placeholder methods', () => {
    it('should throw not implemented errors for remaining placeholder methods', async () => {
      await expect(service.resetPassword({ email: 'test@example.com' })).rejects.toThrow('Reset password not implemented yet');
      await expect(service.updatePassword('newpass')).rejects.toThrow('Update password not implemented yet');
      await expect(service.updateProfile({})).rejects.toThrow('Update profile not implemented yet');
      await expect(service.uploadProfilePicture('uri')).rejects.toThrow('Upload profile picture not implemented yet');
      await expect(service.deleteAccount()).rejects.toThrow('Delete account not implemented yet');
      await expect(service.toggleBoostMode()).rejects.toThrow('Toggle boost mode not implemented yet');
      await expect(service.updateSubscriptionTier('premium')).rejects.toThrow('Update subscription tier not implemented yet');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(authService).toBeInstanceOf(SupabaseAuthService);
    });
  });
});