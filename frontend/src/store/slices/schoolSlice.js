import { createSlice } from '@reduxjs/toolkit';
const schoolSlice = createSlice({
  name: 'school',
  initialState: { currentAcademicYear: null, classes: [], sections: [] },
  reducers: {
    setAcademicYear: (state, action) => { state.currentAcademicYear = action.payload; },
    setClasses: (state, action) => { state.classes = action.payload; },
    setSections: (state, action) => { state.sections = action.payload; },
  }
});
export const { setAcademicYear, setClasses, setSections } = schoolSlice.actions;
export default schoolSlice.reducer;
