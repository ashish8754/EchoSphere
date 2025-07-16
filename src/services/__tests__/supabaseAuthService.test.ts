import { SupabaseAuthService, authService } from '../supabaseAuthService';
import { AuthServiceError } from '../authService';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
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

  describe('placeholder methods', () => {
    it('should throw not implemented errors for placeholder methods', async () => {
      await expect(service.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow('Login not implemented yet');
      await expect(service.logout()).rejects.toThrow('Logout not implemented yet');
      await expect(service.refreshToken()).rejects.toThrow('Refresh token not implemented yet');
      await expect(service.resetPassword({ email: 'test@example.com' })).rejects.toThrow('Reset password not implemented yet');
      await expect(service.updatePassword('newpass')).rejects.toThrow('Update password not implemented yet');
      await expect(service.getCurrentUser()).rejects.toThrow('Get current user not implemented yet');
      await expect(service.getSession()).rejects.toThrow('Get session not implemented yet');
      expect(() => service.onAuthStateChange(() => {})).toThrow('Auth state change not implemented yet');
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