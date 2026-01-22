import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Journey} from '../../types';

interface JourneyState {
  journeys: Journey[];
  isLoading: boolean;
  error: string | null;
}

const initialState: JourneyState = {
  journeys: [],
  isLoading: false,
  error: null,
};

const journeySlice = createSlice({
  name: 'journey',
  initialState,
  reducers: {
    setJourneys: (state, action: PayloadAction<Journey[]>) => {
      state.journeys = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    addJourney: (state, action: PayloadAction<Journey>) => {
      state.journeys.unshift(action.payload);
    },
  },
});

export const {setJourneys, setLoading, setError, addJourney} =
  journeySlice.actions;
export default journeySlice.reducer;
