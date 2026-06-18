import { configureStore } from '@reduxjs/toolkit';
import authReducer       from './slices/authSlice';
import uiReducer         from './slices/uiSlice';
import schoolReducer     from './slices/schoolSlice';
import admissionReducer  from './slices/admissionSlice';
import attendanceReducer from './slices/attendanceSlice';

export const store = configureStore({
  reducer: {
    auth:       authReducer,
    ui:         uiReducer,
    school:     schoolReducer,
    admission:  admissionReducer,
    attendance: attendanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
