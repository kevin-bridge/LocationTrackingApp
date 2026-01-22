import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import journeyReducer from './slices/journeySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    journey: journeyReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serialization check
        ignoredActions: ['location/setCurrentLocation'],
        ignoredPaths: ['location.currentLocation'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
