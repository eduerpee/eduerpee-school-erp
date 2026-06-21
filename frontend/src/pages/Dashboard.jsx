import React from 'react';
import { useResponsive } from '../utils/responsive';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

// ── SVG Illustrations ────────────────────────────────────────────
const StudentsSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <circle cx="42" cy="52" r="13" fill="white" opacity="0.5"/>
    <ellipse cx="42" cy="80" rx="17" ry="10" fill="white" opacity="0.4"/>
    <circle cx="118" cy="52" r="13" fill="white" opacity="0.5"/>
    <ellipse cx="118" cy="80" rx="17" ry="10" fill="white" opacity="0.4"/>
    <circle cx="80" cy="44" r="18" fill="white" opacity="0.95"/>
    <ellipse cx="80" cy="78" rx="24" ry="14" fill="white" opacity="0.9"/>
    <rect x="65" y="28" width="30" height="5" rx="2.5" fill="white" opacity="0.95"/>
    <polygon points="80,20 63,28 97,28" fill="white" opacity="0.95"/>
    <line x1="97" y1="28" x2="100" y2="36" stroke="white" strokeWidth="2" opacity="0.8"/>
    <circle cx="100" cy="37" r="2.5" fill="white" opacity="0.8"/>
    <circle cx="80" cy="44" r="7" fill="rgba(123,111,212,0.3)"/>
  </svg>
);

const EmployeesSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <circle cx="46" cy="48" r="14" fill="white" opacity="0.55"/>
    <rect x="34" y="64" width="24" height="28" rx="8" fill="white" opacity="0.45"/>
    <circle cx="114" cy="48" r="14" fill="white" opacity="0.55"/>
    <rect x="102" y="64" width="24" height="28" rx="8" fill="white" opacity="0.45"/>
    <circle cx="80" cy="42" r="18" fill="white" opacity="0.95"/>
    <rect x="62" y="62" width="36" height="34" rx="10" fill="white" opacity="0.9"/>
    <polygon points="80,67 77,72 80,88 83,72" fill="rgba(14,122,95,0.35)"/>
    <circle cx="74" cy="40" r="2.5" fill="rgba(14,122,95,0.4)"/>
    <circle cx="86" cy="40" r="2.5" fill="rgba(14,122,95,0.4)"/>
    <path d="M75,48 Q80,52 85,48" stroke="rgba(14,122,95,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
  </svg>
);

const AttendanceSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="20" x2="22" y2="88" stroke="white" strokeWidth="1" opacity="0.3"/>
    <line x1="22" y1="88" x2="148" y2="88" stroke="white" strokeWidth="1" opacity="0.3"/>
    <line x1="22" y1="65" x2="148" y2="65" stroke="white" strokeWidth="0.5" opacity="0.2"/>
    <line x1="22" y1="44" x2="148" y2="44" stroke="white" strokeWidth="0.5" opacity="0.2"/>
    <rect x="32" y="60" width="14" height="28" rx="4" fill="white" opacity="0.4"/>
    <rect x="54" y="48" width="14" height="40" rx="4" fill="white" opacity="0.5"/>
    <rect x="76" y="38" width="14" height="50" rx="4" fill="white" opacity="0.6"/>
    <rect x="98" y="52" width="14" height="36" rx="4" fill="white" opacity="0.5"/>
    <rect x="120" y="28" width="14" height="60" rx="4" fill="white" opacity="0.85"/>
    <polyline points="39,60 61,48 83,38 105,52 127,28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    <circle cx="39" cy="60" r="3.5" fill="white" opacity="0.9"/>
    <circle cx="61" cy="48" r="3.5" fill="white" opacity="0.9"/>
    <circle cx="83" cy="38" r="3.5" fill="white" opacity="0.9"/>
    <circle cx="105" cy="52" r="3.5" fill="white" opacity="0.9"/>
    <circle cx="127" cy="28" r="4.5" fill="white" opacity="1"/>
  </svg>
);

const CollectionSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="90" cy="75" rx="28" ry="7" fill="white" opacity="0.25"/>
    <rect x="62" y="55" width="56" height="20" fill="white" opacity="0.2"/>
    <ellipse cx="90" cy="55" rx="28" ry="7" fill="white" opacity="0.35"/>
    <ellipse cx="90" cy="65" rx="28" ry="7" fill="white" opacity="0.3"/>
    <rect x="62" y="45" width="56" height="20" fill="white" opacity="0.25"/>
    <ellipse cx="90" cy="45" rx="28" ry="7" fill="white" opacity="0.5"/>
    <ellipse cx="90" cy="55" rx="28" ry="7" fill="white" opacity="0.4"/>
    <rect x="62" y="35" width="56" height="20" fill="white" opacity="0.3"/>
    <ellipse cx="90" cy="35" rx="28" ry="7" fill="white" opacity="0.9"/>
    <text x="82" y="39" fontSize="14" fontWeight="bold" fill="#1260A8" opacity="0.7" fontFamily="sans-serif">₹</text>
    <circle cx="38" cy="42" r="16" fill="white" opacity="0.2"/>
    <circle cx="38" cy="42" r="12" fill="white" opacity="0.3"/>
    <polyline points="38,50 38,34" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <polyline points="32,40 38,34 44,40" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
  </svg>
);

const AdmissionsSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="45" y="18" width="60" height="74" rx="6" fill="white" opacity="0.25"/>
    <rect x="48" y="21" width="54" height="68" rx="5" fill="white" opacity="0.3"/>
    <rect x="56" y="32" width="36" height="4" rx="2" fill="white" opacity="0.8"/>
    <rect x="56" y="42" width="28" height="3" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="56" y="50" width="32" height="3" rx="1.5" fill="white" opacity="0.5"/>
    <rect x="56" y="58" width="24" height="3" rx="1.5" fill="white" opacity="0.45"/>
    <rect x="56" y="66" width="30" height="3" rx="1.5" fill="white" opacity="0.4"/>
    <circle cx="112" cy="75" r="16" fill="white" opacity="0.9"/>
    <polyline points="104,75 110,82 120,66" stroke="#9C2D50" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EnquiriesSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="18" width="90" height="58" rx="12" fill="white" opacity="0.3"/>
    <rect x="25" y="21" width="84" height="52" rx="10" fill="white" opacity="0.35"/>
    <polygon points="35,72 22,84 50,72" fill="white" opacity="0.3"/>
    <rect x="36" y="34" width="52" height="5" rx="2.5" fill="white" opacity="0.85"/>
    <rect x="36" y="45" width="38" height="4" rx="2" fill="white" opacity="0.65"/>
    <rect x="36" y="55" width="45" height="4" rx="2" fill="white" opacity="0.55"/>
    <circle cx="124" cy="48" r="20" fill="white" opacity="0.2"/>
    <circle cx="124" cy="40" r="10" fill="white" opacity="0.8"/>
    <ellipse cx="124" cy="64" rx="14" ry="8" fill="white" opacity="0.75"/>
  </svg>
);

const PendingDuesSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <path d="M80,18 L110,30 L110,58 Q110,80 80,92 Q50,80 50,58 L50,30 Z" fill="white" opacity="0.25"/>
    <path d="M80,22 L106,33 L106,58 Q106,77 80,88 Q54,77 54,58 L54,33 Z" fill="white" opacity="0.35"/>
    <polyline points="66,55 76,65 96,42" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
  </svg>
);

const ClassesSVG = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="20" width="112" height="66" rx="6" fill="white" opacity="0.2"/>
    <rect x="28" y="24" width="104" height="56" rx="4" fill="white" opacity="0.15"/>
    <line x1="80" y1="86" x2="65" y2="100" stroke="white" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
    <line x1="80" y1="86" x2="95" y2="100" stroke="white" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
    <rect x="36" y="32" width="50" height="5" rx="2" fill="white" opacity="0.8"/>
    <rect x="36" y="43" width="36" height="3.5" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="36" y="52" width="42" height="3.5" rx="1.5" fill="white" opacity="0.5"/>
    <rect x="36" y="61" width="30" height="3.5" rx="1.5" fill="white" opacity="0.45"/>
    <circle cx="116" cy="42" r="18" fill="white" opacity="0.9"/>
    <text x="108" y="48" fontSize="16" fontWeight="500" fill="#2C5F8A" fontFamily="sans-serif">10</text>
  </svg>
);

// ── Card Config ──────────────────────────────────────────────────
const CARD_STYLE = {
  borderRadius: 18,
  overflow: 'hidden',
  border: 'none',
  background: '#fff',
  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  cursor: 'pointer',
  transition: 'all .2s',
};

export default function Dashboard() {
  const user     = useSelector(s => s.auth.user);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const cols = isMobile ? 1 : isTablet ? 2 : 4;

  const { data: apiData, isError, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardAPI.get().then(r => r.data.data),
    retry: 1,
    staleTime: 60000,
  });

  const stats             = apiData?.stats             || {};
  const notices           = apiData?.notices           || [];
  const recentAdmissions  = apiData?.recentAdmissions  || [];
  const monthlyCollection = apiData?.monthlyCollection || [];
  const classWiseFees     = apiData?.classWiseFees     || [];
  const pendingFees       = apiData?.pendingFees       || {};

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fmt  = (n) => Number(n||0).toLocaleString('en-IN');
  const fmtK = (n) => {
    const v = parseFloat(n||0);
    if (v >= 100000) return '₹'+(v/100000).toFixed(1)+'L';
    if (v >= 1000)   return '₹'+(v/1000).toFixed(1)+'K';
    return '₹'+v;
  };

  const hoverOn  = e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.13)'; };
  const hoverOff = e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 16px rgba(0,0,0,0.08)'; };

  const ROW1 = [
    {
      label: 'Total Students', tag: `+${stats.new_admissions_count||0} this month`,
      value: fmt(stats.total_students),
      gradient: 'linear-gradient(145deg,#7B6FD4 0%,#A89DE8 60%,#C4BAF2 100%)',
      valueColor: '#534AB7', tagBg: '#EEEDFE', tagColor: '#534AB7',
      path: '/students', svg: <StudentsSVG />,
    },
    {
      label: 'Total Employees', tag: 'Active staff',
      value: fmt(stats.total_employees),
      gradient: 'linear-gradient(145deg,#0E7A5F 0%,#1DAA84 60%,#4DCBA6 100%)',
      valueColor: '#0F6E56', tagBg: '#E1F5EE', tagColor: '#0F6E56',
      path: '/employees', svg: <EmployeesSVG />,
    },
    {
      label: "Today's Attendance", tag: 'Today',
      value: (stats.todayAttendancePercent||0)+'%',
      gradient: 'linear-gradient(145deg,#C17E10 0%,#DFA020 60%,#F0BF50 100%)',
      valueColor: '#BA7517', tagBg: '#FAEEDA', tagColor: '#BA7517',
      path: '/attendance', svg: <AttendanceSVG />,
    },
    {
      label: "Today's Collection", tag: 'Fee collected',
      value: fmtK(stats.todayCollection),
      gradient: 'linear-gradient(145deg,#1260A8 0%,#2280D0 60%,#55A8EE 100%)',
      valueColor: '#185FA5', tagBg: '#E6F1FB', tagColor: '#185FA5',
      path: '/fees', svg: <CollectionSVG />,
    },
  ];

  const ROW2 = [
    {
      label: 'New Admissions', tag: 'Last 30 days',
      value: fmt(recentAdmissions.length),
      gradient: 'linear-gradient(145deg,#9C2D50 0%,#C94B72 60%,#E87FA0 100%)',
      valueColor: '#993556', tagBg: '#FBEAF0', tagColor: '#993556',
      path: '/students', svg: <AdmissionsSVG />,
    },
    {
      label: 'Open Enquiries', tag: 'Awaiting followup',
      value: fmt(stats.open_enquiries),
      gradient: 'linear-gradient(145deg,#A0440E 0%,#C8631E 60%,#E8924E 100%)',
      valueColor: '#993C1D', tagBg: '#FAECE7', tagColor: '#993C1D',
      path: '/enquiries', svg: <EnquiriesSVG />,
    },
    {
      label: 'Pending Dues', tag: (fmt(pendingFees.students_with_dues)||'0')+' students',
      value: fmtK(pendingFees.total_pending),
      gradient: 'linear-gradient(145deg,#2E7D52 0%,#3EA868 60%,#72CC92 100%)',
      valueColor: '#2E7D52', tagBg: '#E1F5EE', tagColor: '#0F6E56',
      path: '/fees', svg: <PendingDuesSVG />,
    },
    {
      label: 'Total Classes', tag: 'Active classes',
      value: fmt(stats.total_classes),
      gradient: 'linear-gradient(145deg,#2C5F8A 0%,#3A82BE 60%,#68AADC 100%)',
      valueColor: '#185FA5', tagBg: '#E6F1FB', tagColor: '#185FA5',
      path: '/classes', svg: <ClassesSVG />,
    },
  ];

  const StatCard = ({ card }) => (
    <div
      style={CARD_STYLE}
      onClick={() => navigate(card.path)}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
    >
      {/* Illustration top */}
      <div style={{ background: card.gradient, width: '100%', height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {card.svg}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: card.valueColor, lineHeight: 1, marginBottom: 3 }}>
          {isLoading ? '…' : card.value}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>{card.label}</div>
        <span style={{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, marginTop: 8, background: card.tagBg, color: card.tagColor }}>
          {card.tag}
        </span>
      </div>
    </div>
  );

  const maxBar = Math.max(...monthlyCollection.map(m => parseFloat(m.total_collected)||0), 1);
  const barW   = 44;
  const chartW = Math.max(monthlyCollection.length * 64 + 40, 440);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#111827' }}>
            {greeting}, {user?.fullName?.split(' ')[0]||user?.full_name?.split(' ')[0]||'Admin'}
          </h1>
          <p style={{ fontSize:12, color:'#6B7280', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
            {isLoading ? '⏳' : isError ? '🔴' : '🟢'}
            <strong style={{ color:'#374151', fontWeight:700 }}>Academic Year 2025–26 · {new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</strong>
          </p>
        </div>
      </div>

      {/* Row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:16, marginBottom:16 }}>
        {ROW1.map(c => <StatCard key={c.label} card={c} />)}
      </div>

      {/* Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:16, marginBottom:22 }}>
        {ROW2.map(c => <StatCard key={c.label} card={c} />)}
      </div>

      {/* Chart + Notices */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14 }}>
          <div style={{ padding:'14px 18px', borderBottom:'0.5px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>📊 Monthly Fee Collection</span>
            <span style={{ fontSize:11, color:'#9CA3AF' }}>Last {monthlyCollection.length||0} months</span>
          </div>
          <div style={{ padding:'16px 20px', overflowX:'auto' }}>
            {monthlyCollection.length === 0
              ? <div style={{ textAlign:'center', color:'#9CA3AF', padding:'24px 0', fontSize:13 }}>No fee collection data yet</div>
              : <svg width="100%" viewBox={`0 0 ${chartW} 160`} style={{ overflow:'visible', minWidth:300 }}>
                  {[0,25,50,75,100].map((p,i) => (
                    <g key={p}>
                      <line x1="38" y1={10+i*28} x2={chartW} y2={10+i*28} stroke="#F3F4F6" strokeWidth="1"/>
                      <text x="0" y={14+i*28} fontSize="8" fill="#9CA3AF">{fmtK((maxBar*(100-p)/100))}</text>
                    </g>
                  ))}
                  {monthlyCollection.map((m,i) => {
                    const h = Math.round((parseFloat(m.total_collected)/maxBar)*110);
                    const x = 44 + i*64;
                    const y = 120 - h;
                    return (
                      <g key={m.month_key}>
                        <rect x={x} y={y} width={barW} height={h} rx="4" fill="#7B6FD4" opacity=".85"/>
                        <text x={x+barW/2} y={138} fontSize="8" fill="#9CA3AF" textAnchor="middle">{m.month}</text>
                        <text x={x+barW/2} y={y-4} fontSize="8" fill="#534AB7" textAnchor="middle" fontWeight="700">{fmtK(m.total_collected)}</text>
                      </g>
                    );
                  })}
                </svg>
            }
          </div>
        </div>

        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14 }}>
          <div style={{ padding:'14px 16px', borderBottom:'0.5px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>📢 Notices</span>
            <button onClick={() => navigate('/notices')} style={{ fontSize:11, color:'#7B6FD4', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
          </div>
          <div style={{ padding:'8px 16px' }}>
            {notices.length === 0
              ? <div style={{ padding:'20px 0', textAlign:'center', color:'#9CA3AF', fontSize:12 }}>No notices published</div>
              : notices.map((n,i) => (
                  <div key={n.id||i} style={{ padding:'9px 0', borderBottom:'0.5px solid #F9FAFB', display:'flex', gap:10 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#7B6FD4', flexShrink:0, marginTop:5 }}/>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, lineHeight:1.4 }}>{n.title}</div>
                      <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{n.posted_by} · {new Date(n.publish_date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Recent Admissions + Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'0.5px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>🆕 Recent Admissions</span>
            <button onClick={() => navigate('/students')} style={{ fontSize:11, color:'#7B6FD4', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>View all →</button>
          </div>
          {recentAdmissions.length === 0
            ? <div style={{ padding:'24px', textAlign:'center', color:'#9CA3AF', fontSize:12 }}>No new admissions in last 30 days</div>
            : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:'#F9FAFB' }}>
                  {['Student','Class','Date','Status'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {recentAdmissions.map(s => (
                    <tr key={s.id} style={{ borderBottom:'0.5px solid #F3F4F6' }}>
                      <td style={{ padding:'9px 12px', fontWeight:600 }}>{s.first_name} {s.last_name}</td>
                      <td style={{ padding:'9px 12px', color:'#6B7280' }}>{s.class_name} {s.section_name}</td>
                      <td style={{ padding:'9px 12px', color:'#9CA3AF', fontSize:11 }}>{new Date(s.admission_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, background:'#D1FAE5', color:'#065F46' }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14 }}>
          <div style={{ padding:'12px 16px', borderBottom:'0.5px solid #F3F4F6' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>⚡ Quick Actions</span>
          </div>
          <div style={{ padding:14, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              { label:'New Admission', path:'/students',   gradient:'linear-gradient(145deg,#7B6FD4,#C4BAF2)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="14" r="8" fill="white" opacity="0.9"/><ellipse cx="18" cy="30" rx="12" ry="7" fill="white" opacity="0.8"/><rect x="12" y="6" width="12" height="3" rx="1.5" fill="white" opacity="0.95"/><polygon points="18,3 11,6 25,6" fill="white" opacity="0.95"/></svg> },
              { label:'Collect Fee',   path:'/fees',        gradient:'linear-gradient(145deg,#1260A8,#55A8EE)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><ellipse cx="22" cy="24" rx="10" ry="3" fill="white" opacity="0.4"/><rect x="12" y="16" width="20" height="8" fill="white" opacity="0.3"/><ellipse cx="22" cy="16" rx="10" ry="3" fill="white" opacity="0.7"/><rect x="12" y="10" width="20" height="6" fill="white" opacity="0.25"/><ellipse cx="22" cy="10" rx="10" ry="3" fill="white" opacity="0.95"/><text x="17" y="13" fontSize="6" fontWeight="bold" fill="#1260A8" fontFamily="sans-serif">₹</text><polyline points="8,18 8,10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9"/><polyline points="5,13 8,10 11,13" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/></svg> },
              { label:'Attendance',    path:'/attendance',  gradient:'linear-gradient(145deg,#0E7A5F,#4DCBA6)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="22" width="5" height="10" rx="1.5" fill="white" opacity="0.4"/><rect x="12" y="16" width="5" height="16" rx="1.5" fill="white" opacity="0.55"/><rect x="20" y="10" width="5" height="22" rx="1.5" fill="white" opacity="0.7"/><rect x="28" y="6" width="5" height="26" rx="1.5" fill="white" opacity="0.9"/><polyline points="6,22 14,16 22,10 30,6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/><circle cx="30" cy="6" r="2.5" fill="white" opacity="1"/></svg> },
              { label:'Notice',        path:'/notices',     gradient:'linear-gradient(145deg,#9C2D50,#E87FA0)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="22" height="20" rx="4" fill="white" opacity="0.3"/><rect x="8" y="8" width="18" height="16" rx="3" fill="white" opacity="0.35"/><polygon points="10,26 6,32 16,26" fill="white" opacity="0.3"/><rect x="11" y="12" width="12" height="2.5" rx="1" fill="white" opacity="0.9"/><rect x="11" y="17" width="8" height="2" rx="1" fill="white" opacity="0.65"/><rect x="11" y="21" width="10" height="2" rx="1" fill="white" opacity="0.55"/></svg> },
              { label:'Add Staff',     path:'/employees',   gradient:'linear-gradient(145deg,#C17E10,#F0BF50)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="13" r="7" fill="white" opacity="0.9"/><rect x="6" y="22" width="16" height="12" rx="5" fill="white" opacity="0.85"/><circle cx="27" cy="20" r="7" fill="white" opacity="0.35"/><line x1="27" y1="16" x2="27" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/><line x1="23" y1="20" x2="31" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/></svg> },
              { label:'Reports',       path:'/reports',     gradient:'linear-gradient(145deg,#1E3A8A,#60A5FA)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="20" width="6" height="12" rx="2" fill="white" opacity="0.45"/><rect x="13" y="14" width="6" height="18" rx="2" fill="white" opacity="0.6"/><rect x="22" y="8" width="6" height="24" rx="2" fill="white" opacity="0.8"/><polyline points="7,20 16,14 25,8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/><circle cx="25" cy="8" r="2.5" fill="white" opacity="1"/></svg> },
              { label:'Transport',     path:'/transport',   gradient:'linear-gradient(145deg,#0E7A5F,#4DCBA6)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="10" width="28" height="16" rx="4" fill="white" opacity="0.3"/><rect x="5" y="12" width="24" height="12" rx="3" fill="white" opacity="0.3"/><rect x="7" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.75"/><rect x="18" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.75"/><circle cx="10" cy="28" r="4" fill="white" opacity="0.9"/><circle cx="10" cy="28" r="2" fill="rgba(14,122,95,0.4)"/><circle cx="26" cy="28" r="4" fill="white" opacity="0.9"/><circle cx="26" cy="28" r="2" fill="rgba(14,122,95,0.4)"/></svg> },
              { label:'Library',       path:'/library',     gradient:'linear-gradient(145deg,#7B6FD4,#C4BAF2)', svg:<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="6" height="24" rx="2" fill="white" opacity="0.5"/><rect x="12" y="8" width="5" height="22" rx="2" fill="white" opacity="0.7"/><rect x="19" y="4" width="7" height="26" rx="2" fill="white" opacity="0.55"/><rect x="28" y="8" width="5" height="22" rx="2" fill="white" opacity="0.65"/><line x1="3" y1="31" x2="34" y2="31" stroke="white" strokeWidth="2" opacity="0.5" strokeLinecap="round"/></svg> },
            ].map(({ label, path, gradient, svg }) => (
              <div key={label} onClick={() => navigate(path)}
                style={{ borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'all .18s', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.13)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)'; }}>
                <div style={{ background:gradient, height:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {svg}
                </div>
                <div style={{ background:'#fff', padding:'7px 4px', textAlign:'center', borderTop:'0.5px solid #F3F4F6' }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'#374151' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class-wise Fee Collection */}
      <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14 }}>
        <div style={{ padding:'12px 18px', borderBottom:'0.5px solid #F3F4F6', display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:600 }}>📊 Class-wise Fee Collection</span>
          <button onClick={() => navigate('/fees')} style={{ fontSize:11, color:'#7B6FD4', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Full report →</button>
        </div>
        <div style={{ padding:'16px 20px' }}>
          {classWiseFees.length === 0
            ? <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:12, padding:'16px 0' }}>No fee data yet</div>
            : classWiseFees.map(c => {
                const total = parseFloat(c.collected||0) + parseFloat(c.pending||0);
                const pct   = total > 0 ? Math.round((parseFloat(c.collected||0)/total)*100) : 0;
                return (
                  <div key={c.class_name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:11, color:'#6B7280', width:80, flexShrink:0 }}>{c.class_name}</span>
                    <div style={{ flex:1, height:16, background:'#F3F4F6', borderRadius:8, overflow:'hidden' }}>
                      <div style={{ width:pct+'%', height:'100%', background:'linear-gradient(90deg,#7B6FD4,#A89DE8)', borderRadius:'8px 0 0 8px', minWidth:pct>0?4:0 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:'#534AB7', width:36, textAlign:'right' }}>{pct}%</span>
                    <span style={{ fontSize:10, color:'#6B7280', width:80, flexShrink:0 }}>₹{fmt(c.collected)} / ₹{fmt(total)}</span>
                  </div>
                );
              })
          }
          <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:'#6B7280' }}>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'#7B6FD4', borderRadius:2, marginRight:4 }}/>Collected</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'#F3F4F6', borderRadius:2, marginRight:4, border:'1px solid #E5E7EB' }}/>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
