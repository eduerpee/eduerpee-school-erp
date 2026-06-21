import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { schoolAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';
import LoadingBar from '../LoadingBar';
import toast from 'react-hot-toast';

const TI = ({ name, size = 17 }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, lineHeight: 1, display:'flex', alignItems:'center' }} aria-hidden="true" />
);

const Icons = {
  Dashboard:    <TI name="layout-dashboard" />,
  Enquiry:      <TI name="help-circle" />,
  Registration: <TI name="file-text" />,
  Students:     <TI name="school" />,
  Room:         <TI name="door" />,
  TC:           <TI name="certificate" />,
  IDCard:       <TI name="id-badge" />,
  Attendance:   <TI name="calendar-check" />,
  AttReport:    <TI name="report" />,
  Exams:        <TI name="writing" />,
  Timetable:    <TI name="calendar-time" />,
  Fees:         <TI name="credit-card" />,
  Expenses:     <TI name="receipt-2" />,
  Employees:    <TI name="user-circle" />,
  Transport:    <TI name="bus" />,
  Library:      <TI name="books" />,
  Notices:      <TI name="bell" />,
  Reports:      <TI name="chart-bar" />,
  Settings:     <TI name="settings" />,
  Logout:       <TI name="logout" />,
  Menu:         <TI name="menu-2" size={18} />,
  Close:        <TI name="x" size={18} />,
  ChevronRight: <TI name="chevron-right" size={13} />,
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
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = useSelector(s => s.auth.user);
  const { isMobile, isTablet } = useResponsive();
  const [loadKey, setLoadKey] = React.useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const [settings,    setSettings]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('school_settings')) || {}; } catch { return {}; }
  });

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    setLoadKey(k => k + 1); // trigger loading bar
  }, [location.pathname, isMobile]);

  // Auto collapse on tablet
  useEffect(() => { if (isTablet) setCollapsed(true); else if (!isMobile) setCollapsed(false); }, [isTablet, isMobile]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await schoolAPI.getProfile();
      const d   = res.data.data;
      if (!d) return;
      const s = {
        schoolName:   d.name              || 'EduErpee',
        logo:         d.logo_url          || '',
        primaryColor: d.settings?.primaryColor || '#1E1B4B',
        accentColor:  d.settings?.accentColor  || '#F59E0B',
        address:      d.address           || '',
        phone:        d.phone             || '',
      };
      localStorage.setItem('school_settings', JSON.stringify(s));
      setSettings(s);
    } catch {}
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const primary    = settings.primaryColor || '#1E1B4B';
  const accent     = settings.accentColor  || '#F59E0B';
  const schoolName = settings.schoolName   || 'EduErpee';
  const logo       = settings.logo         || '';

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials  = (user?.fullName || user?.full_name || 'User').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const fullName  = user?.fullName || user?.full_name || 'Admin User';
  const role      = user?.role || 'Administrator';
  const currentPage = NAV.flatMap(s=>s.items).find(i => i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to))?.label || 'Dashboard';

  // Sidebar width
  const sidebarW = isMobile ? 260 : collapsed ? 68 : 240;

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{
        height:64, display:'flex', alignItems:'center',
        gap:10, padding:'0 16px',
        borderBottom:'1px solid rgba(255,255,255,.08)',
        flexShrink:0,
        justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
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
        {(isMobile || !collapsed) && (
          <div style={{flex:1, overflow:'hidden'}}>
            <div style={{fontSize:13, fontWeight:800, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{schoolName}</div>
            <div style={{fontSize:9, color:'rgba(255,255,255,.38)', textTransform:'uppercase', letterSpacing:'.1em', marginTop:1}}>School ERP</div>
          </div>
        )}
        {/* Close button on mobile */}
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,.7)', flexShrink:0 }}>
            {Icons.Close}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0' }}>
        <style>{`nav::-webkit-scrollbar{width:4px} nav::-webkit-scrollbar-track{background:rgba(255,255,255,.05)} nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:99px}`}</style>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            {(isMobile || !collapsed) && (
              <div style={{ padding:'12px 16px 4px', fontSize:9, fontWeight:800, color:'rgba(255,255,255,.3)', letterSpacing:'.16em', textTransform:'uppercase' }}>
                {section}
              </div>
            )}
            {(!isMobile && collapsed) && <div style={{height:6}}/>}
            {items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                title={(!isMobile && collapsed) ? item.label : ''}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:10,
                  padding: (!isMobile && collapsed) ? '9px 0' : '8px 12px',
                  margin:'1px 8px',
                  justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
                  color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                  fontSize:13, fontWeight: isActive ? 700 : 500,
                  borderRadius:9,
                  background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
                  textDecoration:'none',
                  transition:'all .12s ease',
                  whiteSpace:'nowrap', overflow:'hidden',
                  position:'relative',
                })}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:accent, marginLeft:-12 }}/>
                    )}
                    <span style={{ color:'currentColor', flexShrink:0, display:'flex', alignItems:'center' }}>
                      {Icons[item.icon]}
                    </span>
                    {(isMobile || !collapsed) && (
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
                    )}
                    {(isMobile || !collapsed) && isActive && (
                      <span style={{ color:accent, opacity:.8, flexShrink:0 }}>{Icons.ChevronRight}</span>
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
      <div style={{ padding: (!isMobile && collapsed) ? '10px 8px' : '10px 12px', borderTop:'1px solid rgba(255,255,255,.08)', flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
        {(isMobile || !collapsed) && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'rgba(255,255,255,.06)', borderRadius:10, border:'1px solid rgba(255,255,255,.08)' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${accent}CC,${accent})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{overflow:'hidden', flex:1}}>
              <div style={{fontSize:12, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{fullName}</div>
              <div style={{fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'capitalize'}}>{role}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ width:'100%', padding: (!isMobile && collapsed) ? '9px 0' : '8px 10px', border:'1px solid rgba(255,255,255,.12)', borderRadius:9, background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.5)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start', gap:8, transition:'all .12s', fontFamily:'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.15)'; e.currentTarget.style.color='#FCA5A5'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
          {Icons.Logout}
          {(isMobile || !collapsed) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'"Plus Jakarta Sans","Segoe UI",sans-serif', background:'#F1F5F9' }}>

      {/* ── MOBILE OVERLAY ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40, backdropFilter:'blur(2px)' }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW,
        background: primary,
        display:'flex', flexDirection:'column',
        flexShrink:0, overflow:'hidden',
        transition:'all .22s cubic-bezier(.4,0,.2,1)',
        boxShadow:'4px 0 24px rgba(0,0,0,.12)',
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? (sidebarOpen ? 0 : -sidebarW) : 'auto',
        height: isMobile ? '100vh' : 'auto',
        zIndex: isMobile ? 50 : 10,
      }}>
        <SidebarContent/>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:56,
          background:'#fff',
          borderBottom:'1px solid #E8EDF2',
          display:'flex', alignItems:'center',
          gap:10, padding:`0 ${isMobile ? 12 : 20}px`,
          flexShrink:0,
          boxShadow:'0 1px 8px rgba(15,23,42,.05)',
        }}>
          {/* Hamburger */}
          <button onClick={() => isMobile ? setSidebarOpen(o => !o) : setCollapsed(c => !c)}
            style={{ width:36, height:36, borderRadius:10, background:'#F8FAFC', border:'1px solid #E2E8F0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', transition:'all .15s', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background=primary; e.currentTarget.style.color='#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#64748B'; }}>
            {Icons.Menu}
          </button>

          {/* Breadcrumb */}
          <div style={{display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0}}>
            {!isMobile && <span style={{fontSize:11, color:'#94A3B8', fontWeight:500, flexShrink:0}}>EduErpee</span>}
            {!isMobile && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            <span style={{fontSize:isMobile?14:13, color:'#1E293B', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{currentPage}</span>
          </div>

          {/* Date — hide on mobile */}
          {!isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:9, fontSize:11, color:'#64748B', fontWeight:500, flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#94A3B8" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/></svg>
              {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
            </div>
          )}

          {/* School badge — hide on mobile */}
          {!isMobile && (
            <div style={{ padding:'6px 12px', background:`${primary}10`, border:`1px solid ${primary}25`, borderRadius:9, fontSize:11, fontWeight:700, color:primary, whiteSpace:'nowrap', flexShrink:0 }}>
              {schoolName}
            </div>
          )}

          {/* User avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px 4px 4px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, cursor:'default', flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg,${primary},${accent})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
              {initials}
            </div>
            {!isMobile && (
              <div>
                <div style={{fontSize:11, fontWeight:700, color:'#1E293B', lineHeight:1.2}}>{fullName.split(' ')[0]}</div>
                <div style={{fontSize:9, color:'#94A3B8', textTransform:'capitalize', lineHeight:1.2}}>{role}</div>
              </div>
            )}
          </div>
        </header>

        {/* Loading bar on route change */}
        <LoadingBar key={loadKey}/>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '12px' : '20px', background:'#F1F5F9' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        a:hover { background: rgba(255,255,255,.08) !important; color: rgba(255,255,255,.9) !important; }
        *::-webkit-scrollbar { width: 4px; height: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 99px; }
        @media (max-width: 768px) {
          table { font-size: 12px !important; }
          th, td { padding: 8px 10px !important; }
        }
      `}</style>
    </div>
  );
}
