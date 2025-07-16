import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import feedSlice from './slices/feedSlice';
import circlesSlice from './slices/circlesSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    feed: feedSlice,
    circles: circlesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;