// store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, theme: 'light', activeModule: 'dashboard' },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setTheme: (state, action) => { state.theme = action.payload; },
    setActiveModule: (state, action) => { state.activeModule = action.payload; },
  }
});

export const { toggleSidebar, setTheme, setActiveModule } = uiSlice.actions;
export default uiSlice.reducer;
