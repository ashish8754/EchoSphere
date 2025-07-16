import { AuthValidation, AuthServiceError } from '../authService';

describe('AuthValidation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(AuthValidation.validateEmail('test@example.com')).toBe(true);
      expect(AuthValidation.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(AuthValidation.validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(AuthValidation.validateEmail('invalid-email')).toBe(false);
      expect(AuthValidation.validateEmail('test@')).toBe(false);
      expect(AuthValidation.validateEmail('@example.com')).toBe(false);
      expect(AuthValidation.validateEmail('test.example.com')).toBe(false);
      expect(AuthValidation.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = AuthValidation.validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const shortPassword = AuthValidation.validatePassword('Short1');
      expect(shortPassword.isValid).toBe(false);
      expect(shortPassword.errors).toContain('Password must be at least 8 characters long');

      const noUppercase = AuthValidation.validatePassword('lowercase123');
      expect(noUppercase.isValid).toBe(false);
      expect(noUppercase.errors).toContain('Password must contain at least one uppercase letter');

      const noLowercase = AuthValidation.validatePassword('UPPERCASE123');
      expect(noLowercase.isValid).toBe(false);
      expect(noLowercase.errors).toContain('Password must contain at least one lowercase letter');

      const noNumber = AuthValidation.validatePassword('NoNumbersHere');
      expect(noNumber.isValid).toBe(false);
      expect(noNumber.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for very weak passwords', () => {
      const result = AuthValidation.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateDisplayName', () => {
    it('should validate correct display names', () => {
      expect(AuthValidation.validateDisplayName('John Doe')).toBe(true);
      expect(AuthValidation.validateDisplayName('Alice')).toBe(true);
      expect(AuthValidation.validateDisplayName('User123')).toBe(true);
    });

    it('should reject invalid display names', () => {
      expect(AuthValidation.validateDisplayName('')).toBe(false);
      expect(AuthValidation.validateDisplayName(' ')).toBe(false);
      expect(AuthValidation.validateDisplayName('A')).toBe(false);
      expect(AuthValidation.validateDisplayName('A'.repeat(51))).toBe(false);
    });
  });
});

describe('AuthServiceError', () => {
  it('should create error with message', () => {
    const error = new AuthServiceError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AuthServiceError');
  });

  it('should create error with code and status', () => {
    const error = new AuthServiceError('Test error', 'AUTH_001', 401);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('AUTH_001');
    expect(error.status).toBe(401);
  });

  it('should create error from Supabase error', () => {
    const supabaseError = {
      message: 'Invalid credentials',
      code: 'invalid_credentials',
      status: 400
    };
    
    const error = AuthServiceError.fromSupabaseError(supabaseError);
    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('invalid_credentials');
    expect(error.status).toBe(400);
  });

  it('should handle Supabase error without message', () => {
    const supabaseError = { code: 'unknown_error' };
    const error = AuthServiceError.fromSupabaseError(supabaseError);
    expect(error.message).toBe('Authentication error occurred');
    expect(error.code).toBe('unknown_error');
  });
});