import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Location} from 'react-native-background-geolocation';

interface LocationState {
  currentLocation: Location | null;
  isTracking: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
  },
});

export const {setCurrentLocation, setTracking} = locationSlice.actions;
export default locationSlice.reducer;
