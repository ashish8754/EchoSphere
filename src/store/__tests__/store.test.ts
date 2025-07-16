import { store } from '../index';
import { setUser, toggleBoostMode, setError, clearError, logout } from '../slices/authSlice';
import { User, AuthError } from '../../types';

describe('Redux Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    store.dispatch(logout());
  });

  it('should have initial state', () => {
    const state = store.getState();
    
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.boostModeEnabled).toBe(false);
    expect(state.auth.error).toBeNull();
    expect(state.feed.posts).toEqual([]);
    expect(state.circles.circles).toEqual([]);
  });

  it('should handle user authentication', () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      display_name: 'Test User',
      boost_mode_enabled: false,
      subscription_tier: 'free',
      email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    store.dispatch(setUser(mockUser));
    let state = store.getState();
    
    expect(state.auth.user).toEqual(mockUser);
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.boostModeEnabled).toBe(false);
    expect(state.auth.subscriptionTier).toBe('free');
    expect(state.auth.error).toBeNull();
  });

  it('should handle boost mode toggle', () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      display_name: 'Test User',
      boost_mode_enabled: false,
      subscription_tier: 'free',
      email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    store.dispatch(setUser(mockUser));
    store.dispatch(toggleBoostMode());
    
    const state = store.getState();
    expect(state.auth.boostModeEnabled).toBe(true);
    expect(state.auth.user?.boost_mode_enabled).toBe(true);
  });

  it('should handle authentication errors', () => {
    const mockError: AuthError = {
      message: 'Invalid credentials',
      code: 'auth/invalid-credentials',
      status: 401,
    };

    store.dispatch(setError(mockError));
    let state = store.getState();
    
    expect(state.auth.error).toEqual(mockError);

    store.dispatch(clearError());
    state = store.getState();
    
    expect(state.auth.error).toBeNull();
  });

  it('should handle logout', () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      display_name: 'Test User',
      boost_mode_enabled: true,
      subscription_tier: 'premium',
      email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Set user and some state
    store.dispatch(setUser(mockUser));
    store.dispatch(setError({ message: 'Some error' }));
    
    // Logout should reset everything
    store.dispatch(logout());
    const state = store.getState();
    
    expect(state.auth.user).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.boostModeEnabled).toBe(false);
    expect(state.auth.subscriptionTier).toBe('free');
    expect(state.auth.error).toBeNull();
    expect(state.auth.isLoading).toBe(false);
  });
});