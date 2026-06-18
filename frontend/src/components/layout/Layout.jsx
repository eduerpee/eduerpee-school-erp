import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { schoolAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ── Premium SVG Icons ─────────────────────────────────────────
const Icons = {
  Dashboard:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  Enquiry:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H7l-4 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 9v2m0 3h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Registration: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Students:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 16l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Room:         <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  TC:           <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  IDCard:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M13 10h5M13 14h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Attendance:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  AttReport:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 13h8M8 17h5M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Exams:        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  Timetable:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Fees:         <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Expenses:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.8"/><path d="M12 22V12m9-4.5L12 12m-9-4.5L12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Employees:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Transport:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  Library:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  Notices:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Reports:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Settings:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  Logout:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Menu:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  MenuClose:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  ChevronRight: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const NAV = [
  { section:'Overview', items:[
    { to:'/',             label:'Dashboard',       icon:'Dashboard' },
  ]},
  { section:'Admissions', items:[
    { to:'/enquiry',      label:'Enquiry',          icon:'Enquiry' },
    { to:'/registration', label:'Registration',     icon:'Registration' },
    { to:'/students',     label:'Students',         icon:'Students' },
    { to:'/rooms',        label:'Room Allocation',  icon:'Room' },
    { to:'/tc',           label:'Transfer Cert.',   icon:'TC' },
    { to:'/id-card',      label:'ID Card',          icon:'IDCard' },
  ]},
  { section:'Academic', items:[
    { to:'/attendance',        label:'Mark Attendance',   icon:'Attendance' },
    { to:'/attendance-report', label:'Attendance Report', icon:'AttReport' },
    { to:'/exams',             label:'Examinations',      icon:'Exams' },
    { to:'/timetable',         label:'Timetable',         icon:'Timetable' },
  ]},
  { section:'Finance', items:[
    { to:'/fees',     label:'Fee Management', icon:'Fees' },
    { to:'/expenses', label:'Expenses',       icon:'Expenses' },
  ]},
  { section:'Staff & Infra', items:[
    { to:'/employees', label:'Employees', icon:'Employees' },
    { to:'/transport', label:'Transport', icon:'Transport' },
    { to:'/library',   label:'Library',   icon:'Library' },
  ]},
  { section:'Communication', items:[
    { to:'/notices', label:'Notice Board', icon:'Notices' },
  ]},
  { section:'Analytics', items:[
    { to:'/reports',  label:'Reports',  icon:'Reports' },
    { to:'/settings', label:'Settings', icon:'Settings' },
  ]},
];

export default function Layout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(s => s.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [settings,  setSettings]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('school_settings')) || {}; } catch { return {}; }
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await schoolAPI.getProfile();
      const d   = res.data.data;
      if (!d) return;
      const s = {
        schoolName:   d.name              || 'EduErpee',
        tagline:      d.settings?.tagline || '',
        address:      d.address           || '',
        phone:        d.phone             || '',
        altPhone:     d.settings?.altPhone|| '',
        email:        d.email             || '',
        website:      d.website           || '',
        principal:    d.principal_name    || '',
        affiliation:  d.affiliation_no    || '',
        estYear:      d.established_year  ? String(d.established_year) : '',
        logo:         d.logo_url          || '',
        primaryColor: d.settings?.primaryColor || '#1E1B4B',
        accentColor:  d.settings?.accentColor  || '#F59E0B',
      };
      localStorage.setItem('school_settings', JSON.stringify(s));
      setSettings(s);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSettings();
    const handler = () => {
      try { setSettings(JSON.parse(localStorage.getItem('school_settings')) || {}); } catch {}
    };
    window.addEventListener('school_settings_updated', handler);
    return () => window.removeEventListener('school_settings_updated', handler);
  }, [fetchSettings]);

  const primary    = settings.primaryColor || '#1E1B4B';
  const accent     = settings.accentColor  || '#F59E0B';
  const schoolName = settings.schoolName   || 'EduErpee';
  const logo       = settings.logo         || '';

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = (user?.fullName || user?.full_name || 'User').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const fullName  = user?.fullName || user?.full_name || 'Admin User';
  const role      = user?.role || 'Administrator';

  // Current page label for header breadcrumb
  const currentPage = NAV.flatMap(s=>s.items).find(i => i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to))?.label || 'Dashboard';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'"Plus Jakarta Sans","Segoe UI",sans-serif', background:'#F1F5F9' }}>

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 68 : 240,
        background: primary,
        display:'flex', flexDirection:'column',
        flexShrink:0, overflow:'hidden',
        transition:'width .22s cubic-bezier(.4,0,.2,1)',
        boxShadow:'4px 0 24px rgba(0,0,0,.12)',
        position:'relative', zIndex:10,
      }}>

        {/* Logo + School name */}
        <div style={{
          height:64, display:'flex', alignItems:'center',
          gap:10, padding: collapsed ? '0 16px' : '0 16px',
          borderBottom:'1px solid rgba(255,255,255,.08)',
          flexShrink:0, justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:`linear-gradient(135deg,${accent},${accent}AA)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, overflow:'hidden',
            boxShadow:`0 4px 12px ${accent}55`,
          }}>
            {logo
              ? <img src={logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8l10 5 10-5-10-5z" fill="rgba(255,255,255,.9)"/><path d="M2 16l10 5 10-5M2 12l10 5 10-5" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          {!collapsed && (
            <div style={{overflow:'hidden'}}>
              <div style={{fontSize:13, fontWeight:800, color:'#fff', whiteSpace:'nowrap', letterSpacing:'-.01em'}}>{schoolName}</div>
              <div style={{fontSize:9, color:'rgba(255,255,255,.38)', textTransform:'uppercase', letterSpacing:'.1em', marginTop:1}}>School ERP</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0', scrollbarWidth:'none' }}>
          <style>{`nav::-webkit-scrollbar{display:none}`}</style>
          {NAV.map(({ section, items }) => (
            <div key={section}>
              {!collapsed && (
                <div style={{
                  padding:'12px 16px 4px',
                  fontSize:9, fontWeight:800,
                  color:'rgba(255,255,255,.3)',
                  letterSpacing:'.16em', textTransform:'uppercase',
                }}>
                  {section}
                </div>
              )}
              {collapsed && <div style={{height:6}}/>}
              {items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}
                  title={collapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center',
                    gap:10,
                    padding: collapsed ? '9px 0' : '8px 12px',
                    margin: collapsed ? '1px 8px' : '1px 8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                    fontSize:13, fontWeight: isActive ? 700 : 500,
                    borderRadius:9,
                    background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
                    textDecoration:'none',
                    transition:'all .12s ease',
                    whiteSpace:'nowrap', overflow:'hidden',
                    position:'relative',
                    letterSpacing:'.01em',
                  })}>
                  {({ isActive }) => (
                    <>
                      {/* Active indicator */}
                      {isActive && (
                        <div style={{
                          position:'absolute', left:0, top:'20%', bottom:'20%',
                          width:3, borderRadius:'0 3px 3px 0',
                          background: accent,
                          marginLeft:-12,
                        }}/>
                      )}
                      <span style={{
                        color: 'currentColor',
                        opacity: 1,
                        flexShrink:0,
                        display:'flex', alignItems:'center',
                      }}>
                        {Icons[item.icon]}
                      </span>
                      {!collapsed && (
                        <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis'}}>
                          {item.label}
                        </span>
                      )}
                      {!collapsed && isActive && (
                        <span style={{color: accent, opacity:.8, flexShrink:0}}>
                          {Icons.ChevronRight}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
          <div style={{height:8}}/>
        </nav>

        {/* User + Logout */}
        <div style={{
          padding: collapsed ? '10px 8px' : '10px 12px',
          borderTop:'1px solid rgba(255,255,255,.08)',
          flexShrink:0, display:'flex', flexDirection:'column', gap:6,
        }}>
          {!collapsed && (
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 10px',
              background:'rgba(255,255,255,.06)',
              borderRadius:10, border:'1px solid rgba(255,255,255,.08)',
            }}>
              <div style={{
                width:32, height:32, borderRadius:9,
                background:`linear-gradient(135deg,${accent}CC,${accent})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, color:'#fff', flexShrink:0,
                boxShadow:`0 2px 8px ${accent}44`,
              }}>
                {initials}
              </div>
              <div style={{overflow:'hidden', flex:1}}>
                <div style={{fontSize:12, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{fullName}</div>
                <div style={{fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'capitalize'}}>{role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            style={{
              width:'100%', padding: collapsed ? '9px 0' : '8px 10px',
              border:'1px solid rgba(255,255,255,.12)',
              borderRadius:9, background:'rgba(255,255,255,.04)',
              color:'rgba(255,255,255,.5)', fontSize:12,
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap:8, transition:'all .12s',
              fontFamily:'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.15)'; e.currentTarget.style.color='#FCA5A5'; e.currentTarget.style.borderColor='rgba(239,68,68,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; }}>
            {Icons.Logout}
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:60, background:'#fff',
          borderBottom:'1px solid #E8EDF2',
          display:'flex', alignItems:'center',
          gap:12, padding:'0 24px',
          flexShrink:0,
          boxShadow:'0 1px 8px rgba(15,23,42,.05)',
        }}>
          {/* Hamburger */}
          <button onClick={() => setCollapsed(c => !c)}
            style={{
              width:36, height:36, borderRadius:10,
              background:'#F8FAFC', border:'1px solid #E2E8F0',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              color:'#64748B', transition:'all .15s', flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background=primary; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor=primary; }}
            onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#64748B'; e.currentTarget.style.borderColor='#E2E8F0'; }}>
            {Icons.Menu}
          </button>

          {/* Breadcrumb */}
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontSize:12, color:'#94A3B8', fontWeight:500}}>EduErpee</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:13, color:'#1E293B', fontWeight:700}}>{currentPage}</span>
          </div>

          <div style={{flex:1}}/>

          {/* Date */}
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'6px 12px', background:'#F8FAFC',
            border:'1px solid #E2E8F0', borderRadius:9,
            fontSize:12, color:'#64748B', fontWeight:500,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#94A3B8" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
          </div>

          {/* School name badge */}
          <div style={{
            padding:'6px 14px',
            background:`${primary}10`,
            border:`1px solid ${primary}25`,
            borderRadius:9, fontSize:12,
            fontWeight:700, color:primary,
            whiteSpace:'nowrap',
          }}>
            {schoolName}
          </div>

          {/* Divider */}
          <div style={{width:1, height:28, background:'#E8EDF2'}}/>

          {/* User avatar */}
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'5px 12px 5px 5px',
            background:'#F8FAFC', border:'1px solid #E2E8F0',
            borderRadius:12, cursor:'default',
          }}>
            <div style={{
              width:30, height:30, borderRadius:9,
              background:`linear-gradient(135deg,${primary},${accent})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800, color:'#fff',
              boxShadow:`0 2px 8px ${primary}33`,
            }}>
              {initials}
            </div>
            <div>
              <div style={{fontSize:12, fontWeight:700, color:'#1E293B', lineHeight:1.2}}>{fullName.split(' ')[0]}</div>
              <div style={{fontSize:10, color:'#94A3B8', textTransform:'capitalize', lineHeight:1.2}}>{role}</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{
          flex:1, overflowY:'auto',
          padding:'24px', background:'#F1F5F9',
        }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        a:hover { background: rgba(255,255,255,.08) !important; color: rgba(255,255,255,.9) !important; }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 99px; }
      `}</style>
    </div>
  );
}
