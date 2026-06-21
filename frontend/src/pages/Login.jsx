import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import { schoolAPI } from '../services/api';
import { useResponsive } from '../utils/responsive';
import toast from 'react-hot-toast';

const LOCAL_KEY = 'school_settings';

function Particles() {
  const dots = [
    {w:160,h:160,top:'8%', left:'4%',  op:.06, dur:18},
    {w:100,h:100,top:'70%',left:'2%',  op:.05, dur:22},
    {w:70, h:70, top:'30%',left:'88%', op:.07, dur:15},
    {w:180,h:180,top:'60%',left:'80%', op:.04, dur:25},
    {w:50, h:50, top:'85%',left:'50%', op:.08, dur:12},
    {w:80, h:80, top:'15%',left:'55%', op:.05, dur:20},
  ];
  return (
    <>
      <style>{`
        @keyframes floatUp{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-28px) rotate(180deg);}}
        @keyframes pulse{0%,100%{opacity:.05;}50%{opacity:.13;}}
      `}</style>
      {dots.map((d,i) => (
        <div key={i} style={{
          position:'absolute', top:d.top, left:d.left,
          width:d.w, height:d.h, borderRadius:'50%',
          border:`1.5px solid rgba(255,255,255,${d.op*2})`,
          background:`radial-gradient(circle,rgba(255,255,255,${d.op}) 0%,transparent 70%)`,
          animation:`floatUp ${d.dur}s ease-in-out infinite,pulse ${d.dur*.7}s ease-in-out infinite`,
          animationDelay:`${i*1.5}s`, pointerEvents:'none',
        }}/>
      ))}
    </>
  );
}

export default function Login() {
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [schoolInfo, setSchoolInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  useEffect(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    schoolAPI.getProfile().then(res => {
      const d = res.data.data;
      if (!d) return;
      const s = {
        schoolName:   d.name                   || 'EduErpee',
        tagline:      d.settings?.tagline       || 'Excellence in Education',
        logo:         d.logo_url               || '',
        address:      d.address                || '',
        city:         d.city                   || '',
        phone:        d.phone                  || '',
        primaryColor: d.settings?.primaryColor || '#1E1B4B',
        accentColor:  d.settings?.accentColor  || '#F59E0B',
      };
      setSchoolInfo(s);
      const existing = {};
      try { Object.assign(existing, JSON.parse(localStorage.getItem(LOCAL_KEY))||{}); } catch {}
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...existing, ...s }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter username and password'); return; }
    setLoading(true); setError('');
    const res = await dispatch(login({ username: username.trim(), password }));
    if (login.fulfilled.match(res)) {
      toast.success('Welcome back! 👋');
      navigate('/', { replace: true });
    } else {
      const msg = res.payload || 'Invalid credentials. Please try again.';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const primary    = schoolInfo.primaryColor || '#1E1B4B';
  const accent     = schoolInfo.accentColor  || '#F59E0B';
  const name       = schoolInfo.schoolName   || 'EduErpee School';
  const tagline    = schoolInfo.tagline      || 'Excellence in Education';
  const logo       = schoolInfo.logo         || '';

  const inp = (extra={}) => ({
    width:'100%', padding:'13px 14px 13px 42px',
    border:'1.5px solid #E5E7EB', borderRadius:12,
    fontSize:14, outline:'none', fontFamily:'inherit',
    boxSizing:'border-box', background:'#FAFAFA', color:'#111827',
    transition:'all .15s', ...extra,
  });

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        fontFamily:'"Segoe UI",system-ui,sans-serif',
        background:`linear-gradient(160deg,${primary} 0%,${primary}CC 45%,#F8FAFC 45%)`,
      }}>
        <style>{`
          @keyframes shimmer{0%{left:-100%}100%{left:200%}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
          input::placeholder{color:#CBD5E1;}
        `}</style>

        {/* Top brand section */}
        <div style={{
          padding:'40px 24px 60px',
          position:'relative', overflow:'hidden',
          display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
        }}>
          <Particles/>
          {/* Logo */}
          <div style={{
            width:80, height:80, borderRadius:22,
            background:'rgba(255,255,255,.12)',
            border:'2px solid rgba(255,255,255,.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:16, overflow:'hidden',
            boxShadow:'0 16px 40px rgba(0,0,0,.2)',
          }}>
            {logo
              ? <img src={logo} alt="Logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              : <span style={{fontSize:40}}>🏫</span>}
          </div>
          <h1 style={{fontSize:22,fontWeight:900,color:'#fff',margin:'0 0 6px',letterSpacing:'-.01em'}}>{name}</h1>
          <div style={{width:40,height:3,borderRadius:99,background:accent,margin:'0 0 8px'}}/>
          <p style={{fontSize:13,color:'rgba(255,255,255,.7)',margin:0}}>{tagline}</p>
        </div>

        {/* Form card */}
        <div style={{
          flex:1, background:'#F8FAFC',
          borderRadius:'24px 24px 0 0',
          marginTop:-24,
          padding:'28px 20px 32px',
          boxShadow:'0 -8px 32px rgba(0,0,0,.1)',
        }}>
          {/* Header */}
          <div style={{marginBottom:24,textAlign:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:100,background:`${primary}12`,marginBottom:10}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:accent}}/>
              <span style={{fontSize:10,fontWeight:700,color:primary,textTransform:'uppercase',letterSpacing:'.1em'}}>Admin Portal</span>
            </div>
            <h2 style={{fontSize:24,fontWeight:800,color:'#0F172A',margin:'0 0 4px',letterSpacing:'-.01em'}}>Welcome Back</h2>
            <p style={{fontSize:13,color:'#64748B',margin:0}}>Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{padding:'11px 14px',borderRadius:10,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'center',gap:8,marginBottom:16,fontSize:12,color:'#991B1B'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #E2E8F0',padding:'20px',boxShadow:'0 2px 16px rgba(15,23,42,.06)',marginBottom:16}}>
            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Username</label>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value)}
                    placeholder="Enter username" autoFocus style={inp()}
                    onFocus={e=>{e.target.style.borderColor=primary;e.target.style.background='#fff';e.target.style.boxShadow=`0 0 0 3px ${primary}18`;}}
                    onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#FAFAFA';e.target.style.boxShadow='none';}}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Password</label>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="Enter password" style={inp({paddingRight:44})}
                    onFocus={e=>{e.target.style.borderColor=primary;e.target.style.background='#fff';e.target.style.boxShadow=`0 0 0 3px ${primary}18`;}}
                    onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#FAFAFA';e.target.style.boxShadow='none';}}
                  />
                  <button type="button" onClick={()=>setShowPass(p=>!p)}
                    style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.5 10.5A3 3 0 0013.5 13.5M6.5 6.5A9.77 9.77 0 003 12c1.9 4 5.8 7 9 7 1.8 0 3.5-.6 5-1.5M9 5.1A9.2 9.2 0 0112 5c3.2 0 7.1 3 9 7a10.6 10.6 0 01-1.7 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12c1.9-4 5.8-7 9-7s7.1 3 9 7c-1.9 4-5.8 7-9 7s-7.1-3-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{width:'100%',padding:'14px',background:loading?'#9CA3AF':`linear-gradient(135deg,${primary},${primary}CC)`,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',boxShadow:loading?'none':`0 4px 18px ${primary}55`,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,position:'relative',overflow:'hidden'}}>
                {!loading && <div style={{position:'absolute',top:0,left:'-100%',width:'100%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)',animation:'shimmer 2.5s infinite'}}/>}
                {loading
                  ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"/><path d="M12 3a9 9 0 019 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>Signing in…</>
                  : <><span>Sign In</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>}
              </button>
            </form>
          </div>

          <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)',borderRadius:12,padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,paddingBottom:10,borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="75 92 310 100" width="110" height="36">
                  <circle cx="116" cy="136" r="35" fill="none" stroke="#1565C0" strokeWidth="1.5"/>
                  <circle cx="116" cy="101" r="6" fill="#E8640A"/>
                  <circle cx="151" cy="136" r="4" fill="#90CAF9"/>
                  <circle cx="116" cy="136" r="26" fill="#E8640A"/>
                  <rect x="108" y="124" width="4.5" height="23" rx="2" fill="white"/>
                  <rect x="108" y="124" width="15" height="4.5" rx="2" fill="white"/>
                  <rect x="108" y="132.5" width="11" height="3.5" rx="1.5" fill="rgba(255,255,255,0.65)"/>
                  <rect x="108" y="142.5" width="15" height="4.5" rx="2" fill="white"/>
                  <text x="165" y="125" fontFamily="sans-serif" fontSize="22" fontWeight="600" fill="white">Edu<tspan fill="#E8640A">Erpee</tspan></text>
                  <text x="165" y="143" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#F4975A" letterSpacing="1">Simplify · Automate · Grow</text>
                </svg>
              <div style={{borderLeft:'1px solid rgba(255,255,255,0.1)',paddingLeft:10}}>
                <div style={{fontSize:11,fontWeight:800,color:'white',lineHeight:1.3}}>Eduerpee Technology Pvt. Ltd.</div>
                <div style={{fontSize:9,color:'#64748B',marginTop:2,fontWeight:500}}>Azamgarh · Gr. Noida</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <p style={{fontSize:8,fontWeight:700,color:'#E8640A',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Registered Office</p>
                <p style={{fontSize:10,color:'#CBD5E1',fontWeight:600,lineHeight:1.7,margin:0}}>519/216A, KATRA,<br/>Mubarak Pur, Azamgarh,<br/>UP – 276404, India</p>
              </div>
              <div style={{borderLeft:'1px solid rgba(255,255,255,0.08)',paddingLeft:10}}>
                <p style={{fontSize:8,fontWeight:700,color:'#E8640A',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Branch Office</p>
                <p style={{fontSize:10,color:'#CBD5E1',fontWeight:600,lineHeight:1.7,margin:0}}>Near Shiva Smart City-2,<br/>Talabpur Dadri, Gr. Noida,<br/>UP – 203207, India</p>
              </div>
            </div>
            <div style={{display:'flex',gap:12,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.08)',flexWrap:'wrap'}}>
              <a href="https://www.eduerpee.com" target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#90CAF9',fontWeight:700,textDecoration:'none'}}>
                <i className="ti ti-world" style={{fontSize:12}}/> www.eduerpee.com
              </a>
              <a href="mailto:support@eduerpee.com" style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#90CAF9',fontWeight:700,textDecoration:'none'}}>
                <i className="ti ti-mail" style={{fontSize:12}}/> support@eduerpee.com
              </a>
            </div>
          </div>

          <p style={{textAlign:'center',marginTop:20,fontSize:11,color:'#CBD5E1'}}>
            © {new Date().getFullYear()} {name} · EduErpee v1.0
          </p>
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:'"Segoe UI",system-ui,sans-serif',overflow:'hidden',position:'relative'}}>
      <style>{`
        @keyframes shimmer{0%{left:-100%}100%{left:200%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;}input::placeholder{color:#CBD5E1;}body{margin:0;}
      `}</style>

      {/* Left panel */}
      <div style={{flex:'0 0 52%',background:`linear-gradient(150deg,${primary} 0%,${primary}CC 55%,${accent}55 100%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 56px',position:'relative',overflow:'hidden'}}>
        <Particles/>
        <div style={{position:'absolute',inset:0,opacity:.04,backgroundImage:`linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)`,backgroundSize:'40px 40px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,transparent,${accent},${accent},transparent)`}}/>
        <div style={{width:110,height:110,borderRadius:28,background:'rgba(255,255,255,.12)',border:'2px solid rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:28,overflow:'hidden',backdropFilter:'blur(8px)',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
          {logo ? <img src={logo} alt="Logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span style={{fontSize:52}}>🏫</span>}
        </div>
        <h1 style={{fontSize:34,fontWeight:900,color:'#fff',textAlign:'center',lineHeight:1.15,margin:'0 0 10px',letterSpacing:'-.02em',textShadow:'0 2px 20px rgba(0,0,0,.2)'}}>{name}</h1>
        <div style={{width:60,height:3,borderRadius:99,background:`linear-gradient(90deg,transparent,${accent},transparent)`,margin:'0 0 14px'}}/>
        <p style={{fontSize:15,color:'rgba(255,255,255,.75)',textAlign:'center',lineHeight:1.6,margin:'0 0 48px',maxWidth:320}}>{tagline}</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',maxWidth:380}}>
          {[
            ['ti-books',      '#90CAF9', 'Academics'],
            ['ti-credit-card','#F59E0B', 'Fee Management'],
            ['ti-school',     '#86EFAC', 'Admissions'],
            ['ti-chart-bar',  '#FDA4AF', 'Reports'],
            ['ti-bus',        '#6EE7B7', 'Transport'],
            ['ti-writing',    '#FCD34D', 'Examinations'],
          ].map(([icon,color,label])=>(
            <div key={label} style={{padding:'7px 16px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.18)',borderRadius:100,fontSize:12,fontWeight:600,color:'rgba(255,255,255,.85)',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(4px)'}}>
              <i className={'ti '+icon} style={{fontSize:15,color:color}}/>
              {label}
            </div>
          ))}
        </div>
        <div style={{position:'absolute',bottom:28,left:0,right:0,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.35)'}}>
          {schoolInfo.address && <span>{schoolInfo.address}{schoolInfo.city?', '+schoolInfo.city:''}</span>}
          {schoolInfo.phone && <><span style={{margin:'0 10px'}}>·</span><span>{schoolInfo.phone}</span></>}
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1,background:'#F8FAFC',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 40px',position:'relative'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`,pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-80,left:-40,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${primary}12 0%,transparent 70%)`,pointerEvents:'none'}}/>
        <div style={{width:'100%',maxWidth:400,position:'relative'}}>
          <div style={{marginBottom:36}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:100,background:`${primary}12`,marginBottom:14}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:accent}}/>
              <span style={{fontSize:11,fontWeight:700,color:primary,textTransform:'uppercase',letterSpacing:'.1em'}}>School Management System</span>
            </div>
            <h2 style={{fontSize:30,fontWeight:800,color:'#0F172A',margin:'0 0 8px',letterSpacing:'-.02em'}}>Welcome Back</h2>
            
          </div>

          {error && (
            <div style={{padding:'12px 16px',borderRadius:12,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'flex-start',gap:10,marginBottom:20,fontSize:13,color:'#991B1B',animation:'fadeIn .2s ease'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          <div style={{background:'#fff',borderRadius:20,border:'1px solid #E2E8F0',padding:'32px 28px',boxShadow:'0 4px 32px rgba(15,23,42,.06)',marginBottom:20}}>
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:18}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Username</label>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" autoFocus autoComplete="off" style={inp({padding:'13px 14px 13px 42px'})}
                    onFocus={e=>{e.target.style.borderColor=primary;e.target.style.background='#fff';e.target.style.boxShadow=`0 0 0 3px ${primary}18`;}}
                    onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#FAFAFA';e.target.style.boxShadow='none';}}/>
                </div>
              </div>
              <div style={{marginBottom:28}}>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Password</label>
                <div style={{position:'relative'}}>
                  <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9CA3AF',pointerEvents:'none'}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="new-password" style={inp({padding:'13px 44px 13px 42px'})}
                    onFocus={e=>{e.target.style.borderColor=primary;e.target.style.background='#fff';e.target.style.boxShadow=`0 0 0 3px ${primary}18`;}}
                    onBlur={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.background='#FAFAFA';e.target.style.boxShadow='none';}}/>
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}>
                    {showPass
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.5 10.5A3 3 0 0113.5 13.5M6.5 6.5A9.77 9.77 0 003 12c1.9 4 5.8 7 9 7 1.8 0 3.5-.6 5-1.5M9 5.1A9.2 9.2 0 0112 5c3.2 0 7.1 3 9 7a10.6 10.6 0 01-1.7 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 12c1.9-4 5.8-7 9-7s7.1 3 9 7c-1.9 4-5.8 7-9 7s-7.1-3-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{width:'100%',padding:'14px',background:loading?'#9CA3AF':`linear-gradient(135deg,${primary} 0%,${primary}CC 100%)`,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',letterSpacing:'.01em',boxShadow:loading?'none':`0 4px 20px ${primary}55`,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,position:'relative',overflow:'hidden'}}>
                {!loading && <div style={{position:'absolute',top:0,left:'-100%',width:'100%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)',animation:'shimmer 2.5s infinite'}}/>}
                {loading
                  ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"/><path d="M12 3a9 9 0 019 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>Signing in…</>
                  : <><span>Sign In</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>}
              </button>
            </form>
          </div>

          <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)',borderRadius:14,padding:'18px 20px'}}>
            {/* Logo + Company name */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="75 92 310 100" width="140" height="45">
                  <circle cx="116" cy="136" r="35" fill="none" stroke="#1565C0" strokeWidth="1.5"/>
                  <circle cx="116" cy="101" r="6" fill="#E8640A"/>
                  <circle cx="151" cy="136" r="4" fill="#90CAF9"/>
                  <circle cx="116" cy="136" r="26" fill="#E8640A"/>
                  <rect x="108" y="124" width="4.5" height="23" rx="2" fill="white"/>
                  <rect x="108" y="124" width="15" height="4.5" rx="2" fill="white"/>
                  <rect x="108" y="132.5" width="11" height="3.5" rx="1.5" fill="rgba(255,255,255,0.65)"/>
                  <rect x="108" y="142.5" width="15" height="4.5" rx="2" fill="white"/>
                  <text x="165" y="125" fontFamily="sans-serif" fontSize="22" fontWeight="600" fill="white">Edu<tspan fill="#E8640A">Erpee</tspan></text>
                  <text x="165" y="143" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="#F4975A" letterSpacing="1">Simplify · Automate · Grow</text>
                </svg>
              <div style={{borderLeft:'1px solid rgba(255,255,255,0.1)',paddingLeft:12}}>
                <div style={{fontSize:12,fontWeight:800,color:'white',lineHeight:1.3}}>Eduerpee Technology Pvt. Ltd.</div>
                <div style={{fontSize:10,color:'#64748B',marginTop:2,fontWeight:500}}>Azamgarh · Gr. Noida</div>
              </div>
            </div>
            {/* Offices */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <p style={{fontSize:9,fontWeight:700,color:'#E8640A',textTransform:'uppercase',letterSpacing:'1px',marginBottom:5}}>Registered Office</p>
                <p style={{fontSize:11,color:'#CBD5E1',fontWeight:600,lineHeight:1.8,margin:0}}>519/216A, KATRA,<br/>Mubarak Pur, Azamgarh – Sadar,<br/>Uttar Pradesh – 276404, India</p>
              </div>
              <div style={{borderLeft:'1px solid rgba(255,255,255,0.08)',paddingLeft:12}}>
                <p style={{fontSize:9,fontWeight:700,color:'#E8640A',textTransform:'uppercase',letterSpacing:'1px',marginBottom:5}}>Branch Office</p>
                <p style={{fontSize:11,color:'#CBD5E1',fontWeight:600,lineHeight:1.8,margin:0}}>Near Shiva Smart City-2,<br/>Talabpur Dadri, Gr. Noida,<br/>Uttar Pradesh – 203207, India</p>
              </div>
            </div>
            {/* Links */}
            <div style={{display:'flex',gap:16,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              <a href="https://www.eduerpee.com" target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#90CAF9',fontWeight:700,textDecoration:'none'}}>
                <i className="ti ti-world" style={{fontSize:13}}/> www.eduerpee.com
              </a>
              <a href="mailto:support@eduerpee.com" style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#90CAF9',fontWeight:700,textDecoration:'none'}}>
                <i className="ti ti-mail" style={{fontSize:13}}/> support@eduerpee.com
              </a>
            </div>
          </div>
          <p style={{textAlign:'center',marginTop:24,fontSize:11,color:'#CBD5E1'}}>
            © {new Date().getFullYear()} {name} · EduErpee v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
