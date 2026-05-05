import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

const saveSession = (token, user) => {
  localStorage.setItem('insureflow_token', token);
  localStorage.setItem('insureflow_user', JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem('insureflow_token');
  localStorage.removeItem('insureflow_user');
};
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('insureflow_token');
    const user  = JSON.parse(localStorage.getItem('insureflow_user') || 'null');
    if (token && user) return { user, isAuthenticated: true, loading: false, error: null };
  } catch {}
  return { user: null, isAuthenticated: false, loading: false, error: null };
};

/* ── Thunks ── */
export const loginUser = createAsyncThunk('auth/loginUser', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login({ email, password });
    saveSession(data.token, data.user);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(formData);
    saveSession(data.token, data.user);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const updateProfileAsync = createAsyncThunk('auth/updateProfile', async (updates, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.updateMe(updates);
    localStorage.setItem('insureflow_user', JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const changePasswordAsync = createAsyncThunk('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.changePassword(payload);
    saveSession(data.token, data.user);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Password change failed');
  }
});

/* ── Slice ── */
const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    login() {},          // legacy stub — kept for backward compat
    updateProfile(state, action) { if (state.user) Object.assign(state.user, action.payload); },
    logout(state) {
      state.user = null; state.isAuthenticated = false; state.error = null;
      clearSession();
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending   = (state)         => { state.loading = true;  state.error = null; };
    const rejected  = (state, action) => { state.loading = false; state.error = action.payload; };
    const fulfilled = (state, action) => {
      state.loading = false; state.user = action.payload.user; state.isAuthenticated = true;
    };
    builder
      .addCase(loginUser.pending,    pending)
      .addCase(loginUser.fulfilled,  fulfilled)
      .addCase(loginUser.rejected,   rejected)
      .addCase(registerUser.pending,   pending)
      .addCase(registerUser.fulfilled, fulfilled)
      .addCase(registerUser.rejected,  rejected)
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        if (state.user) Object.assign(state.user, action.payload);
      })
      .addCase(changePasswordAsync.fulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export const { login, logout, updateProfile, clearError } = authSlice.actions;
export default authSlice.reducer;
export const selectUser            = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectAuthLoading     = (s) => s.auth.loading;
export const selectAuthError       = (s) => s.auth.error;
