import { configureStore } from '@reduxjs/toolkit';
import authReducer   from '../features/auth/authSlice';
import claimsReducer from '../features/claims/claimsSlice';

export const store = configureStore({
  reducer: {
    auth:   authReducer,
    claims: claimsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values from async thunks
        ignoredActions: ['auth/loginUser/fulfilled'],
      },
    }),
});

export default store;
