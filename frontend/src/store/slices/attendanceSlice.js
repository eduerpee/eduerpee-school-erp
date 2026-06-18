import { createSlice } from '@reduxjs/toolkit';

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: {},   // key: "YYYY-MM-DD|studentId"  value: 'present'|'absent'|'leave'|'late'
  },
  reducers: {
    markAttendance: (state, { payload: { date, studentId, status } }) => {
      state.records[`${date}|${studentId}`] = status;
    },
    markBulk: (state, { payload: records }) => {
      // records: [{ date, studentId, status }]
      records.forEach(r => { state.records[`${r.date}|${r.studentId}`] = r.status; });
    },
  },
});

export const { markAttendance, markBulk } = attendanceSlice.actions;
export default attendanceSlice.reducer;
