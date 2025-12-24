import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../types';
import { api } from '../services/supabaseBackend';

const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' | null : null;

const initialState: AuthState = {
  user: null,
  token: null,
  theme: savedTheme || 'light',
  isAuthenticated: false,
};

if (typeof window !== 'undefined' && savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

export const loginUser = createAsyncThunk('auth/login', async ({email, password}: {email: string, password?: string}) => {
  const user = await api.auth.login(email, password);
  return user;
});

export const registerUser = createAsyncThunk('auth/register', async (data: Omit<User, 'id' | 'blockedUserIds'>) => {
  const user = await api.auth.register(data);
  return user;
});

export const updateUserProfile = createAsyncThunk('auth/update', async ({id, data}: {id: string, data: Partial<User>}) => {
  return await api.auth.updateProfile(id, data);
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.auth.logout();
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  return await api.auth.restoreSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      if (state.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.token = 'supabase-session';
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.token = 'supabase-session';
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      if (state.user && state.user.id === action.payload.id) {
        state.user = action.payload;
      }
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
    });
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = 'supabase-session';
      }
    });
  }
});

export const { logout, toggleTheme } = authSlice.actions;
export default authSlice.reducer;