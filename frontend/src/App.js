import React from 'react';
import LoadingBar from './components/LoadingBar';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Layout            from './components/layout/Layout';
import Login             from './pages/Login';
import Dashboard         from './pages/Dashboard';
import Students          from './pages/Students';
import RoomAllocation    from './pages/RoomAllocation';
import TransferCertificate from './pages/TransferCertificate';
import Attendance        from './pages/Attendance';
import AttendanceReport  from './pages/AttendanceReport';
import FeeManagement     from './pages/FeeManagement';
import Employees         from './pages/Employees';
import Reports           from './pages/Reports';
import Notices           from './pages/Notices';
import Enquiry           from './pages/Enquiry';
import Registration      from './pages/Registration';
import Settings          from './pages/Settings';
import IDCard            from './pages/IDCard';
import Examinations      from './pages/Examinations';
import Timetable         from './pages/Timetable';
import Transport         from './pages/Transport';
import Library           from './pages/Library';
import Expenses          from './pages/Expenses';

const Stub = ({ title, icon, desc }) => (
  <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:60,textAlign:'center',color:'#9CA3AF'}}>
    <div style={{fontSize:44,marginBottom:12}}>{icon}</div>
    <div style={{fontSize:16,fontWeight:700,color:'#374151',marginBottom:4}}>{title}</div>
    <div style={{fontSize:13}}>{desc}</div>
  </div>
);

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector(s => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{style:{fontFamily:'inherit',fontSize:13}}}/>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                    element={<Dashboard />} />
          <Route path="enquiry"           element={<Enquiry />} />
          <Route path="registration"      element={<Registration />} />
          <Route path="students"          element={<Students />} />
          <Route path="rooms"             element={<RoomAllocation />} />
          <Route path="tc"               element={<TransferCertificate />} />
          <Route path="attendance"        element={<Attendance />} />
          <Route path="attendance-report" element={<AttendanceReport />} />
          <Route path="id-card"           element={<IDCard />} />
          <Route path="fees"              element={<FeeManagement />} />
          <Route path="employees"         element={<Employees />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="notices"           element={<Notices />} />
          <Route path="settings"          element={<Settings />} />
          <Route path="exams"              element={<Examinations />} />
          <Route path="timetable"         element={<Timetable />} />
          <Route path="transport"         element={<Transport />} />
          <Route path="library"           element={<Library />} />
          <Route path="expenses"          element={<Expenses />} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
