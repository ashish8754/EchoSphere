import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Circle {
  id: string;
  name: string;
  owner_id: string;
  is_private: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

interface CirclesState {
  circles: Circle[];
  isLoading: boolean;
  selectedCircles: string[];
}

const initialState: CirclesState = {
  circles: [],
  isLoading: false,
  selectedCircles: [],
};

const circlesSlice = createSlice({
  name: 'circles',
  initialState,
  reducers: {
    setCircles: (state, action: PayloadAction<Circle[]>) => {
      state.circles = action.payload;
    },
    addCircle: (state, action: PayloadAction<Circle>) => {
      state.circles = [action.payload, ...state.circles];
    },
    updateCircle: (state, action: PayloadAction<Circle>) => {
      const index = state.circles.findIndex(circle => circle.id === action.payload.id);
      if (index !== -1) {
        state.circles[index] = action.payload;
      }
    },
    removeCircle: (state, action: PayloadAction<string>) => {
      state.circles = state.circles.filter(circle => circle.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSelectedCircles: (state, action: PayloadAction<string[]>) => {
      state.selectedCircles = action.payload;
    },
    toggleCircleSelection: (state, action: PayloadAction<string>) => {
      const circleId = action.payload;
      if (state.selectedCircles.includes(circleId)) {
        state.selectedCircles = state.selectedCircles.filter(id => id !== circleId);
      } else {
        state.selectedCircles = [...state.selectedCircles, circleId];
      }
    },
    clearSelectedCircles: (state) => {
      state.selectedCircles = [];
    },
  },
});

export const {
  setCircles,
  addCircle,
  updateCircle,
  removeCircle,
  setLoading,
  setSelectedCircles,
  toggleCircleSelection,
  clearSelectedCircles,
} = circlesSlice.actions;

export default circlesSlice.reducer;