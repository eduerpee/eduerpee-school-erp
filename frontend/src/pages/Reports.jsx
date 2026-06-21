import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ── SVG Illustrations ────────────────────────────────────────────

const FeeCollectionSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="42" cy="48" rx="18" ry="5" fill="white" opacity="0.25"/>
    <rect x="24" y="32" width="36" height="16" fill="white" opacity="0.2"/>
    <ellipse cx="42" cy="32" rx="18" ry="5" fill="white" opacity="0.5"/>
    <rect x="24" y="22" width="36" height="10" fill="white" opacity="0.25"/>
    <ellipse cx="42" cy="22" rx="18" ry="5" fill="white" opacity="0.85"/>
    <text x="36" y="26" fontSize="9" fontWeight="bold" fill="#1260A8" opacity="0.7" fontFamily="sans-serif">₹</text>
    <circle cx="20" cy="26" r="10" fill="white" opacity="0.2"/>
    <polyline points="20,32 20,20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
    <polyline points="15,25 20,20 25,25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
  </svg>
);

const PendingFeesSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="22" fill="white" opacity="0.15"/>
    <circle cx="36" cy="36" r="16" fill="white" opacity="0.2"/>
    <path d="M36 20 L36 36 L48 36" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
    <circle cx="36" cy="36" r="2.5" fill="white" opacity="0.9"/>
    <circle cx="36" cy="36" r="18" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4"/>
  </svg>
);

const AttendanceSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="38" width="8" height="20" rx="2" fill="white" opacity="0.4"/>
    <rect x="22" y="30" width="8" height="28" rx="2" fill="white" opacity="0.5"/>
    <rect x="34" y="22" width="8" height="36" rx="2" fill="white" opacity="0.6"/>
    <rect x="46" y="30" width="8" height="28" rx="2" fill="white" opacity="0.5"/>
    <rect x="58" y="16" width="8" height="42" rx="2" fill="white" opacity="0.85"/>
    <polyline points="14,38 26,30 38,22 50,30 62,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    <circle cx="14" cy="38" r="2.5" fill="white" opacity="0.9"/>
    <circle cx="26" cy="30" r="2.5" fill="white" opacity="0.9"/>
    <circle cx="38" cy="22" r="2.5" fill="white" opacity="0.9"/>
    <circle cx="50" cy="30" r="2.5" fill="white" opacity="0.9"/>
    <circle cx="62" cy="16" r="3" fill="white" opacity="1"/>
  </svg>
);

const ExamSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="10" width="44" height="54" rx="5" fill="white" opacity="0.2"/>
    <rect x="17" y="13" width="38" height="48" rx="4" fill="white" opacity="0.25"/>
    <rect x="22" y="22" width="28" height="4" rx="2" fill="white" opacity="0.85"/>
    <rect x="22" y="30" width="20" height="3" rx="1.5" fill="white" opacity="0.6"/>
    <rect x="22" y="37" width="24" height="3" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="22" y="44" width="16" height="3" rx="1.5" fill="white" opacity="0.5"/>
    <circle cx="52" cy="52" r="12" fill="white" opacity="0.9"/>
    <polyline points="46,52 50,57 58,45" stroke="#1E40AF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StudentReportSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="30" r="10" fill="white" opacity="0.55"/>
    <ellipse cx="24" cy="52" rx="13" ry="8" fill="white" opacity="0.45"/>
    <circle cx="48" cy="30" r="10" fill="white" opacity="0.55"/>
    <ellipse cx="48" cy="52" rx="13" ry="8" fill="white" opacity="0.45"/>
    <circle cx="36" cy="26" r="13" fill="white" opacity="0.95"/>
    <ellipse cx="36" cy="52" rx="17" ry="10" fill="white" opacity="0.9"/>
    <rect x="28" y="14" width="16" height="4" rx="2" fill="white" opacity="0.95"/>
    <polygon points="36,10 27,14 45,14" fill="white" opacity="0.95"/>
  </svg>
);

const StaffSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="28" r="10" fill="white" opacity="0.55"/>
    <rect x="12" y="40" width="20" height="22" rx="6" fill="white" opacity="0.45"/>
    <circle cx="50" cy="28" r="10" fill="white" opacity="0.55"/>
    <rect x="40" y="40" width="20" height="22" rx="6" fill="white" opacity="0.45"/>
    <circle cx="36" cy="26" r="13" fill="white" opacity="0.95"/>
    <rect x="26" y="41" width="20" height="24" rx="7" fill="white" opacity="0.9"/>
    <polygon points="36,46 33,50 36,62 39,50" fill="rgba(146,64,14,0.35)"/>
  </svg>
);

const TransportSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="24" width="52" height="30" rx="6" fill="white" opacity="0.25"/>
    <rect x="10" y="26" width="48" height="26" rx="5" fill="white" opacity="0.3"/>
    <rect x="14" y="30" width="14" height="10" rx="2" fill="white" opacity="0.7"/>
    <rect x="32" y="30" width="14" height="10" rx="2" fill="white" opacity="0.7"/>
    <rect x="8" y="44" width="52" height="8" rx="2" fill="white" opacity="0.2"/>
    <circle cx="20" cy="56" r="6" fill="white" opacity="0.9"/>
    <circle cx="20" cy="56" r="3" fill="rgba(14,122,95,0.4)"/>
    <circle cx="50" cy="56" r="6" fill="white" opacity="0.9"/>
    <circle cx="50" cy="56" r="3" fill="rgba(14,122,95,0.4)"/>
    <rect x="58" y="30" width="4" height="18" rx="2" fill="white" opacity="0.5"/>
  </svg>
);

const LibrarySVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="16" width="12" height="46" rx="3" fill="white" opacity="0.5"/>
    <rect x="25" y="20" width="10" height="42" rx="3" fill="white" opacity="0.7"/>
    <rect x="38" y="14" width="14" height="48" rx="3" fill="white" opacity="0.55"/>
    <rect x="55" y="22" width="10" height="40" rx="3" fill="white" opacity="0.65"/>
    <line x1="8" y1="62" x2="68" y2="62" stroke="white" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
    <rect x="12" y="22" width="6" height="3" rx="1" fill="white" opacity="0.4"/>
    <rect x="27" y="26" width="4" height="3" rx="1" fill="white" opacity="0.4"/>
    <rect x="40" y="20" width="8" height="3" rx="1" fill="white" opacity="0.4"/>
    <rect x="57" y="28" width="4" height="3" rx="1" fill="white" opacity="0.4"/>
  </svg>
);

const ExpenseSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="52" height="36" rx="5" fill="white" opacity="0.2"/>
    <rect x="13" y="23" width="46" height="30" rx="4" fill="white" opacity="0.25"/>
    <rect x="18" y="30" width="22" height="4" rx="2" fill="white" opacity="0.8"/>
    <rect x="18" y="38" width="16" height="3" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="18" y="45" width="20" height="3" rx="1.5" fill="white" opacity="0.5"/>
    <circle cx="52" cy="40" r="10" fill="white" opacity="0.9"/>
    <text x="47" y="44" fontSize="12" fontWeight="bold" fill="#DC2626" fontFamily="sans-serif">₹</text>
    <polyline points="52,28 52,20 44,20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
  </svg>
);

const REPORT_SVGS = {
  'Fee Collection Report': { svg: <FeeCollectionSVG />, gradient: 'linear-gradient(145deg,#1260A8 0%,#2280D0 60%,#55A8EE 100%)' },
  'Pending Fees Report':   { svg: <PendingFeesSVG />,   gradient: 'linear-gradient(145deg,#9C2D50 0%,#C94B72 60%,#E87FA0 100%)' },
  'Attendance Report':     { svg: <AttendanceSVG />,     gradient: 'linear-gradient(145deg,#0E7A5F 0%,#1DAA84 60%,#4DCBA6 100%)' },
  'Exam Results':          { svg: <ExamSVG />,           gradient: 'linear-gradient(145deg,#1E3A8A 0%,#2563EB 60%,#60A5FA 100%)' },
  'Student Report':        { svg: <StudentReportSVG />,  gradient: 'linear-gradient(145deg,#7B6FD4 0%,#A89DE8 60%,#C4BAF2 100%)' },
  'Staff Report':          { svg: <StaffSVG />,          gradient: 'linear-gradient(145deg,#C17E10 0%,#DFA020 60%,#F0BF50 100%)' },
  'Transport Report':      { svg: <TransportSVG />,      gradient: 'linear-gradient(145deg,#0E7A5F 0%,#1DAA84 60%,#4DCBA6 100%)' },
  'Library Report':        { svg: <LibrarySVG />,        gradient: 'linear-gradient(145deg,#7B6FD4 0%,#A89DE8 60%,#C4BAF2 100%)' },
  'Expense Report':        { svg: <ExpenseSVG />,        gradient: 'linear-gradient(145deg,#A0440E 0%,#C8631E 60%,#E8924E 100%)' },
};

// ── Stat card SVGs ───────────────────────────────────────────────
const MiniStudentSVG = () => (
  <svg width="100%" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="36" r="10" fill="white" opacity="0.5"/>
    <ellipse cx="50" cy="58" rx="13" ry="7" fill="white" opacity="0.4"/>
    <circle cx="110" cy="36" r="10" fill="white" opacity="0.5"/>
    <ellipse cx="110" cy="58" rx="13" ry="7" fill="white" opacity="0.4"/>
    <circle cx="80" cy="30" r="14" fill="white" opacity="0.95"/>
    <ellipse cx="80" cy="56" rx="18" ry="10" fill="white" opacity="0.9"/>
    <rect x="71" y="18" width="18" height="4" rx="2" fill="white" opacity="0.95"/>
    <polygon points="80,12 70,18 90,18" fill="white" opacity="0.95"/>
  </svg>
);

const MiniAttendanceSVG = () => (
  <svg width="100%" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="44" width="12" height="26" rx="3" fill="white" opacity="0.4"/>
    <rect x="38" y="34" width="12" height="36" rx="3" fill="white" opacity="0.5"/>
    <rect x="56" y="24" width="12" height="46" rx="3" fill="white" opacity="0.6"/>
    <rect x="74" y="34" width="12" height="36" rx="3" fill="white" opacity="0.5"/>
    <rect x="92" y="18" width="12" height="52" rx="3" fill="white" opacity="0.85"/>
    <rect x="110" y="28" width="12" height="42" rx="3" fill="white" opacity="0.65"/>
    <polyline points="26,44 44,34 62,24 80,34 98,18 116,28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    <circle cx="26" cy="44" r="3" fill="white" opacity="0.9"/>
    <circle cx="44" cy="34" r="3" fill="white" opacity="0.9"/>
    <circle cx="62" cy="24" r="3" fill="white" opacity="0.9"/>
    <circle cx="80" cy="34" r="3" fill="white" opacity="0.9"/>
    <circle cx="98" cy="18" r="4" fill="white" opacity="1"/>
    <circle cx="116" cy="28" r="3" fill="white" opacity="0.9"/>
  </svg>
);

const MiniCollectionSVG = () => (
  <svg width="100%" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="95" cy="62" rx="32" ry="8" fill="white" opacity="0.2"/>
    <rect x="63" y="44" width="64" height="18" fill="white" opacity="0.18"/>
    <ellipse cx="95" cy="44" rx="32" ry="8" fill="white" opacity="0.3"/>
    <rect x="63" y="30" width="64" height="14" fill="white" opacity="0.22"/>
    <ellipse cx="95" cy="30" rx="32" ry="8" fill="white" opacity="0.45"/>
    <rect x="63" y="18" width="64" height="12" fill="white" opacity="0.25"/>
    <ellipse cx="95" cy="18" rx="32" ry="8" fill="white" opacity="0.88"/>
    <text x="87" y="22" fontSize="12" fontWeight="bold" fill="#C17E10" opacity="0.7" fontFamily="sans-serif">₹</text>
    <circle cx="32" cy="32" r="18" fill="white" opacity="0.18"/>
    <circle cx="32" cy="32" r="13" fill="white" opacity="0.28"/>
    <polyline points="32,42 32,22" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <polyline points="25,30 32,22 39,30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
  </svg>
);

const MiniEmployeesSVG = () => (
  <svg width="100%" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="38" cy="32" r="11" fill="white" opacity="0.55"/>
    <rect x="26" y="46" width="24" height="24" rx="7" fill="white" opacity="0.45"/>
    <circle cx="122" cy="32" r="11" fill="white" opacity="0.55"/>
    <rect x="110" y="46" width="24" height="24" rx="7" fill="white" opacity="0.45"/>
    <circle cx="80" cy="28" r="15" fill="white" opacity="0.95"/>
    <rect x="66" y="45" width="28" height="28" rx="9" fill="white" opacity="0.9"/>
    <polygon points="80,50 77,55 80,68 83,55" fill="rgba(30,64,175,0.35)"/>
    <circle cx="74" cy="26" r="2.5" fill="rgba(30,64,175,0.4)"/>
    <circle cx="86" cy="26" r="2.5" fill="rgba(30,64,175,0.4)"/>
    <path d="M75,34 Q80,38 85,34" stroke="rgba(30,64,175,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
  </svg>
);

export default function Reports() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data.data?.stats||{})).catch(()=>{});
  }, []);

  const REPORTS = [
    { title:'Fee Collection Report', desc:'Daily, monthly & class-wise fee collections',    link:'/fees?tab=report',      stat: '₹'+(parseFloat(stats.todayCollection||0)).toLocaleString('en-IN')+' today' },
    { title:'Pending Fees Report',   desc:'Outstanding dues class-wise & student-wise',      link:'/fees?tab=pending',     stat: 'View pending dues' },
    { title:'Attendance Report',     desc:'Class-wise daily & monthly attendance',            link:'/attendance-report',    stat: (stats.todayAttendancePercent||0)+'% today' },
    { title:'Exam Results',          desc:'Class-wise marks, grades & report cards',          link:'/exams',                stat: 'View results' },
    { title:'Student Report',        desc:'Total admissions, class-wise & category',          link:'/students',             stat: (stats.total_students||0)+' students' },
    { title:'Staff Report',          desc:'Employee list, designation & salary summary',      link:'/employees',            stat: (stats.total_employees||0)+' employees' },
    { title:'Transport Report',      desc:'Route-wise students & vehicle details',             link:'/transport',            stat: 'View routes' },
    { title:'Library Report',        desc:'Books issued, overdue & fine collection',           link:'/library',              stat: 'View issues' },
    { title:'Expense Report',        desc:'Category-wise monthly expense summary',             link:'/expenses',             stat: 'View expenses' },
  ];

  const STAT_CARDS = [
    {
      label: 'Total Students',
      value: stats.total_students||0,
      gradient: 'linear-gradient(145deg,#7B6FD4 0%,#A89DE8 60%,#C4BAF2 100%)',
      valueColor: '#534AB7', tagBg: '#EEEDFE', tagColor: '#534AB7',
      tag: 'All enrolled', svg: <MiniStudentSVG />,
    },
    {
      label: 'Today Attendance',
      value: (stats.todayAttendancePercent||0)+'%',
      gradient: 'linear-gradient(145deg,#C17E10 0%,#DFA020 60%,#F0BF50 100%)',
      valueColor: '#BA7517', tagBg: '#FAEEDA', tagColor: '#BA7517',
      tag: 'Today', svg: <MiniAttendanceSVG />,
    },
    {
      label: "Today's Collection",
      value: '₹'+(parseFloat(stats.todayCollection||0)).toLocaleString('en-IN'),
      gradient: 'linear-gradient(145deg,#C17E10 0%,#DFA020 60%,#F0BF50 100%)',
      valueColor: '#BA7517', tagBg: '#FAEEDA', tagColor: '#BA7517',
      tag: 'Fee collected', svg: <MiniCollectionSVG />,
    },
    {
      label: 'Total Employees',
      value: stats.total_employees||0,
      gradient: 'linear-gradient(145deg,#1E3A8A 0%,#2563EB 60%,#60A5FA 100%)',
      valueColor: '#1E40AF', tagBg: '#DBEAFE', tagColor: '#1E40AF',
      tag: 'Active staff', svg: <MiniEmployeesSVG />,
    },
  ];

  const hoverOn  = e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.13)'; };
  const hoverOff = e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 16px rgba(0,0,0,0.08)'; };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Reports & Analytics</h2>
        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          Click any report to view live data &nbsp;
          <span style={{ padding:'2px 8px', background:'#D1FAE5', color:'#065F46', borderRadius:10, fontSize:10, fontWeight:700 }}>🟢 Live DB</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {STAT_CARDS.map(c => (
          <div key={c.label} style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', background:'#fff', cursor:'default', transition:'all .2s' }}
            onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <div style={{ background: c.gradient, height: 80, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {c.svg}
            </div>
            <div style={{ padding:'12px 14px 14px' }}>
              <div style={{ fontSize:22, fontWeight:600, color:c.valueColor, lineHeight:1, marginBottom:3 }}>{c.value}</div>
              <div style={{ fontSize:12, color:'#6B7280' }}>{c.label}</div>
              <span style={{ display:'inline-block', fontSize:10, padding:'2px 9px', borderRadius:20, marginTop:7, background:c.tagBg, color:c.tagColor }}>{c.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {REPORTS.map(r => {
          const style = REPORT_SVGS[r.title] || { svg: null, gradient: 'linear-gradient(145deg,#7B6FD4,#C4BAF2)' };
          return (
            <div key={r.title} onClick={() => navigate(r.link)}
              style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', background:'#fff', cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
              {/* Top illustration strip */}
              <div style={{ background: style.gradient, height: 80, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {style.svg}
              </div>
              {/* Body */}
              <div style={{ padding:'14px 16px 16px' }}>
                <div style={{ fontWeight:600, fontSize:14, color:'#111827', marginBottom:4 }}>{r.title}</div>
                <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.5, marginBottom:10 }}>{r.desc}</div>
                <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                  background: style.gradient, color:'white' }}>
                  {r.stat}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div style={{ marginTop:20, padding:'12px 16px', background:'#F9FAFB', borderRadius:10, fontSize:12, color:'#6B7280', textAlign:'center' }}>
        💡 All reports show live data from database. Click any report card to view detailed information.
      </div>
    </div>
  );
}
