import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, AuthError, LoginCredentials, RegisterCredentials } from '../../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  boostModeEnabled: boolean;
  subscriptionTier: 'free' | 'premium';
  error: AuthError | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  boostModeEnabled: false,
  subscriptionTier: 'free',
  error: null,
};

// Async thunks for authentication actions
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const { authService } = await import('../../services/supabaseAuthService');
      const authToken = await authService.login(credentials);
      return authToken.user;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Login failed',
        code: error.code,
        status: error.status,
      } as AuthError);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const { authService } = await import('../../services/supabaseAuthService');
      const result = await authService.register(credentials);
      return result.user;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Registration failed',
        code: error.code,
        status: error.status,
      } as AuthError);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
      if (action.payload) {
        state.boostModeEnabled = action.payload.boost_mode_enabled;
        state.subscriptionTier = action.payload.subscription_tier;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<AuthError | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    toggleBoostMode: (state) => {
      state.boostModeEnabled = !state.boostModeEnabled;
      if (state.user) {
        state.user.boost_mode_enabled = state.boostModeEnabled;
      }
    },
    setSubscriptionTier: (state, action: PayloadAction<'free' | 'premium'>) => {
      state.subscriptionTier = action.payload;
      if (state.user) {
        state.user.subscription_tier = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.boostModeEnabled = false;
      state.subscriptionTier = 'free';
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as AuthError;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as AuthError;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setUser, setLoading, setError, clearError, toggleBoostMode, setSubscriptionTier, logout } = authSlice.actions;
export default authSlice.reducer;