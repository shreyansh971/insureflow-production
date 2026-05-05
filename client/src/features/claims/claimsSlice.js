import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { claimsAPI } from '../../services/api';

/* ════════════════ Async Thunks ══════════════════════════ */
export const fetchClaims = createAsyncThunk(
  'claims/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await claimsAPI.getAll(params);
      return data.claims;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch claims');
    }
  },
);

export const fetchClaimById = createAsyncThunk(
  'claims/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await claimsAPI.getById(id);
      return data.claim;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch claim');
    }
  },
);

export const createClaim = createAsyncThunk(
  'claims/create',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await claimsAPI.create(formData);
      return data.claim;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create claim');
    }
  },
);

export const approveClaimAsync = createAsyncThunk(
  'claims/approve',
  async ({ id, approvedAmount, remarks }, { rejectWithValue }) => {
    try {
      const { data } = await claimsAPI.approve(id, { approvedAmount, remarks });
      return data.claim;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve claim');
    }
  },
);

export const rejectClaimAsync = createAsyncThunk(
  'claims/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await claimsAPI.reject(id, { reason });
      return data.claim;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject claim');
    }
  },
);

/* ════════════════ Normalise helper ══════════════════════ */
// Map MongoDB _id / claimNumber to "id" so existing pages work unchanged
const normalise = (claim) => ({
  ...claim,
  id: claim.claimNumber || claim.id || claim._id,
  userId: claim.userId?._id || claim.userId,
});

/* ════════════════ Slice ═════════════════════════════════ */
const claimsSlice = createSlice({
  name: 'claims',
  initialState: { list: [], loading: false, error: null },
  reducers: {
    // Legacy sync stubs — kept so existing AdminPages dispatch compiles
    addClaim(state, action)    { state.list.unshift(normalise(action.payload)); },
    approveClaim(state, action) {
      const { id, approvedAmount, remarks } = action.payload;
      const c = state.list.find((x) => x.id === id || x.claimNumber === id);
      if (c) { c.status = 'approved'; c.approved = approvedAmount; c.remarks = remarks; }
    },
    rejectClaim(state, action) {
      const { id, reason } = action.payload;
      const c = state.list.find((x) => x.id === id || x.claimNumber === id);
      if (c) { c.status = 'rejected'; c.remarks = reason; }
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchClaims */
      .addCase(fetchClaims.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload.map(normalise);
      })
      .addCase(fetchClaims.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      /* fetchClaimById — merge into list */
      .addCase(fetchClaimById.fulfilled, (state, action) => {
        const norm  = normalise(action.payload);
        const idx   = state.list.findIndex((c) => c.id === norm.id);
        if (idx >= 0) state.list[idx] = norm; else state.list.unshift(norm);
      })

      /* createClaim */
      .addCase(createClaim.fulfilled, (state, action) => {
        state.list.unshift(normalise(action.payload));
      })

      /* approve/reject — update in place */
      .addCase(approveClaimAsync.fulfilled, (state, action) => {
        const norm = normalise(action.payload);
        const idx  = state.list.findIndex((c) => c.id === norm.id);
        if (idx >= 0) state.list[idx] = norm;
      })
      .addCase(rejectClaimAsync.fulfilled, (state, action) => {
        const norm = normalise(action.payload);
        const idx  = state.list.findIndex((c) => c.id === norm.id);
        if (idx >= 0) state.list[idx] = norm;
      });
  },
});

export const { addClaim, approveClaim, rejectClaim } = claimsSlice.actions;
export default claimsSlice.reducer;

export const selectAllClaims    = (s) => s.claims.list;
export const selectUserClaims   = (uid) => (s) => s.claims.list.filter((c) => c.userId === uid || c.userId?._id === uid);
export const selectClaimById    = (id)  => (s) => s.claims.list.find((c) => c.id === id || c.claimNumber === id);
export const selectPendingCount = (s)   => s.claims.list.filter((c) => c.status === 'pending' || c.status === 'under-review').length;
export const selectClaimsLoading = (s)  => s.claims.loading;
