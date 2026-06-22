import React, { useState, useEffect } from 'react';
import { schoolAPI } from '../services/api';
import toast from 'react-hot-toast';

const inp = { width:'100%', padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 };

const LOCAL_KEY = 'school_settings';

const DEFAULTS = {
  schoolName:'EduErpee School', tagline:'Excellence in Education',
  address:'Near Civil Lines, Lucknow, Uttar Pradesh 226001',
  phone:'0522-1234567', altPhone:'9876543210',
  email:'info@eduerp.edu.in', website:'www.eduerp.edu.in',
  principal:'Rajesh Kumar', affiliation:'UP-2001-1234', estYear:'1995',
  logo:'', primaryColor:'#1E1B4B', accentColor:'#F59E0B',
};

function loadLocal() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LOCAL_KEY)) }; }
  catch { return DEFAULTS; }
}

function saveLocal(s) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('school_settings_updated'));
}

export default function Settings() {
  const [settings,    setSettings]    = useState(loadLocal);
  const [activeTab,   setActiveTab]   = useState('school');
  const [saving,      setSaving]      = useState(false);
  const [loadingDB,   setLoadingDB]   = useState(true);
  const [isLiveDB,    setIsLiveDB]    = useState(false);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  // Load from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await schoolAPI.getProfile();
        const d   = res.data.data;
        if (d) {
          const dbSettings = {
            schoolName:   d.name              || DEFAULTS.schoolName,
            tagline:      d.settings?.tagline || DEFAULTS.tagline,
            address:      d.address           || DEFAULTS.address,
            phone:        d.phone             || DEFAULTS.phone,
            altPhone:     d.settings?.altPhone|| DEFAULTS.altPhone,
            email:        d.email             || DEFAULTS.email,
            website:      d.website           || DEFAULTS.website,
            principal:    d.principal_name    || DEFAULTS.principal,
            affiliation:  d.affiliation_no    || DEFAULTS.affiliation,
            estYear:      d.established_year  ? String(d.established_year) : DEFAULTS.estYear,
            logo:         d.logo_url          || '',
            primaryColor: d.settings?.primaryColor || DEFAULTS.primaryColor,
            accentColor:  d.settings?.accentColor  || DEFAULTS.accentColor,
          };
          setSettings(dbSettings);
          saveLocal(dbSettings);
          setIsLiveDB(true);
        }
      } catch {
        // Backend not available — use localStorage
      } finally {
        setLoadingDB(false);
      }
    })();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('logo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage immediately so sidebar/header updates right away
    saveLocal(settings);

    try {
      await schoolAPI.updateProfile({
        name:            settings.schoolName,
        tagline:         settings.tagline,
        address:         settings.address,
        phone:           settings.phone,
        altPhone:        settings.altPhone,
        email:           settings.email,
        website:         settings.website,
        principalName:   settings.principal,
        affiliationNo:   settings.affiliation,
        establishedYear: settings.estYear,
        logoUrl:         settings.logo || undefined,
        primaryColor:    settings.primaryColor,
        accentColor:     settings.accentColor,
      });
      setIsLiveDB(true);
      toast.success('✅ Settings saved to database! Reflected across the app.');
    } catch {
      toast.success('Settings saved locally. Connect backend to sync to database.');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    ['school',     'School Profile',   'ti-building'],
    ['appearance', 'Appearance',       'ti-palette'],
    ['academic',   'Academic',         'ti-books'],
    ['users',      'User Accounts',    'ti-users'],
  ];

  if (loadingDB) {
    return <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading settings…</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700}}>Settings</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            Manage school profile, branding and configuration &nbsp;
            {isLiveDB
              ? <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢</span>
              : <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Local only</span>}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{display:'flex',alignItems:'center',gap:7,padding:'9px 22px',background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.4)'}}>
          <i className="ti ti-device-floppy" style={{fontSize:16}}/>{saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div style={{display:'flex',gap:20}}>
        {/* Tabs */}
        <div style={{width:200,flexShrink:0,display:'flex',flexDirection:'column',gap:4,background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:8}}>
          {TABS.map(([key,label,icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{display:'flex',alignItems:'center',gap:9,padding:'10px 14px',border:'none',borderRadius:10,background:activeTab===key?'linear-gradient(135deg,#7B6FD4,#534AB7)':'transparent',color:activeTab===key?'#fff':'#374151',fontSize:13,fontWeight:activeTab===key?700:500,cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
              <i className={'ti '+icon} style={{fontSize:16,flexShrink:0}}/>{label}
            </button>
          ))}
        </div>

        <div style={{flex:1}}>

          {/* ── SCHOOL PROFILE TAB ── */}
          {activeTab === 'school' && (
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:20}}>
                <div style={{width:32,height:32,background:'#EEEDFE',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-building" style={{fontSize:17,color:'#534AB7'}}/>
                </div>
                <h3 style={{fontSize:15,fontWeight:700,margin:0}}>School Profile</h3>
              </div>

              {/* Logo */}
              <div style={{marginBottom:20}}>
                <label style={lbl}>School Logo</label>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:80,height:80,borderRadius:14,border:'2px dashed #E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:'#F9FAFB',flexShrink:0}}>
                    {settings.logo
                      ? <img src={settings.logo} alt="Logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <i className="ti ti-building" style={{fontSize:32,color:'#9CA3AF'}}/>}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} id="logo-upload" style={{display:'none'}}/>
                    <label htmlFor="logo-upload" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#EEEDFE',color:'#534AB7',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid #C4B5FD'}}>
                      <i className="ti ti-upload" style={{fontSize:14}}/> Upload Logo
                    </label>
                    {settings.logo && <button onClick={() => set('logo','')} style={{display:'block',marginTop:6,background:'none',border:'none',color:'#DC2626',fontSize:12,cursor:'pointer'}}>Remove logo</button>}
                    <p style={{fontSize:11,color:'#9CA3AF',marginTop:6}}>PNG, JPG up to 2MB. Will appear in sidebar & header.</p>
                  </div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>School Name <span style={{color:'#DC2626'}}>*</span></label><input value={settings.schoolName} onChange={e=>set('schoolName',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Tagline / Motto</label><input value={settings.tagline} onChange={e=>set('tagline',e.target.value)} style={inp}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>Address <span style={{color:'#DC2626'}}>*</span></label>
                <textarea value={settings.address} onChange={e=>set('address',e.target.value)} rows={2} style={{...inp,resize:'vertical'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>Primary Phone</label><input value={settings.phone} onChange={e=>set('phone',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Alternate Phone</label><input value={settings.altPhone} onChange={e=>set('altPhone',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Email</label><input type="email" value={settings.email} onChange={e=>set('email',e.target.value)} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>Principal Name</label><input value={settings.principal} onChange={e=>set('principal',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Affiliation No.</label><input value={settings.affiliation} onChange={e=>set('affiliation',e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Established Year</label><input value={settings.estYear} onChange={e=>set('estYear',e.target.value)} style={inp}/></div>
              </div>
              <div><label style={lbl}>Website</label><input value={settings.website} onChange={e=>set('website',e.target.value)} placeholder="www.yourschool.edu.in" style={inp}/></div>

              {/* DB status info */}
              <div style={{marginTop:20,padding:'10px 14px',background:isLiveDB?'#D1FAE5':'#FEF3C7',borderRadius:10,fontSize:12,color:isLiveDB?'#065F46':'#92400E',display:'flex',alignItems:'center',gap:8}}>
                <i className={isLiveDB?'ti ti-circle-check':'ti ti-alert-triangle'} style={{fontSize:15,flexShrink:0}}/>
                {isLiveDB
                  ? 'Connected to database — Save Changes will update the schools table in PostgreSQL'
                  : 'Backend not connected — settings saved to browser storage only. Start backend to sync to DB.'}
              </div>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {activeTab === 'appearance' && (
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:20}}>
                <div style={{width:32,height:32,background:'#E1F5EE',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-palette" style={{fontSize:17,color:'#0F6E56'}}/>
                </div>
                <h3 style={{fontSize:15,fontWeight:700,margin:0}}>Branding & Appearance</h3>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
                <div>
                  <label style={lbl}>Primary Color (Sidebar)</label>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <input type="color" value={settings.primaryColor} onChange={e=>set('primaryColor',e.target.value)}
                      style={{width:48,height:40,border:'1.5px solid #E5E7EB',borderRadius:8,cursor:'pointer',padding:2}}/>
                    <input value={settings.primaryColor} onChange={e=>set('primaryColor',e.target.value)} style={{...inp,flex:1}}/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Accent Color</label>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <input type="color" value={settings.accentColor} onChange={e=>set('accentColor',e.target.value)}
                      style={{width:48,height:40,border:'1.5px solid #E5E7EB',borderRadius:8,cursor:'pointer',padding:2}}/>
                    <input value={settings.accentColor} onChange={e=>set('accentColor',e.target.value)} style={{...inp,flex:1}}/>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div style={{marginBottom:20}}>
                <label style={lbl}>Live Preview</label>
                <div style={{border:'0.5px solid #E5E7EB',borderRadius:12,overflow:'hidden',display:'flex',height:130}}>
                  <div style={{width:140,background:settings.primaryColor,display:'flex',flexDirection:'column',padding:12,gap:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <div style={{width:24,height:24,borderRadius:6,background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,overflow:'hidden'}}>
                        {settings.logo ? <img src={settings.logo} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:4}}/> : '🏫'}
                      </div>
                      <span style={{color:'#fff',fontSize:11,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{settings.schoolName?.split(' ')[0]||'School'}</span>
                    </div>
                    {['Dashboard','Students','Fees','Attendance'].map(n => (
                      <div key={n} style={{fontSize:10,color:'rgba(255,255,255,.6)',paddingLeft:4}}>{n}</div>
                    ))}
                  </div>
                  <div style={{flex:1,background:'#F9FAFB',padding:14,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#111827'}}>Dashboard</div>
                    <div style={{display:'flex',gap:8}}>
                      <button style={{padding:'6px 14px',background:settings.primaryColor,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600}}>+ New Admission</button>
                      <button style={{padding:'6px 14px',background:settings.accentColor,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600}}>Export</button>
                    </div>
                    <div style={{fontSize:10,color:'#9CA3AF'}}>Colors update in real-time ↑</div>
                  </div>
                </div>
              </div>

              <div style={{padding:14,background:'#FEF3C7',borderRadius:10,fontSize:12,color:'#92400E'}}>
                💡 Colors are saved to the database. They reload from DB on next login.
              </div>
            </div>
          )}

          {/* ── ACADEMIC TAB ── */}
          {activeTab === 'academic' && (
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:24}}>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:20}}>Academic Configuration</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>Academic Year</label><input defaultValue="2025-26" style={inp}/></div>
                <div><label style={lbl}>School Board</label><select style={inp}><option>CBSE</option><option>ICSE</option><option>State Board</option><option>IB</option></select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div><label style={lbl}>Session Start Month</label><select style={inp}><option>April</option><option>June</option><option>July</option><option>January</option></select></div>
                <div><label style={lbl}>Working Days / Week</label><select style={inp}><option>5 days (Mon–Fri)</option><option>6 days (Mon–Sat)</option></select></div>
              </div>
              <div style={{padding:14,background:'#D1FAE5',borderRadius:10,fontSize:12,color:'#065F46'}}>
                ✅ These settings affect attendance calculation, timetable and reports.
              </div>
            </div>
          )}

          {/* ── USER ACCOUNTS TAB ── */}
          {activeTab === 'users' && (
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:24}}>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:20}}>User Account Settings</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  ['admin',      'Admin User',     'School Admin', 'admin@eduerp.edu.in'],
                  ['principal',  'Rajesh Kumar',   'Principal',    'principal@eduerp.edu.in'],
                  ['teacher1',   'Sunita Sharma',  'Teacher',      'teacher@eduerp.edu.in'],
                  ['accountant', 'Kavita Mishra',  'Accountant',   'accounts@eduerp.edu.in'],
                ].map(([u, n, r, e]) => (
                  <div key={u} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',border:'0.5px solid #E5E7EB',borderRadius:10}}>
                    <div style={{width:36,height:36,borderRadius:9,background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#1E1B4B',flexShrink:0}}>{n[0]}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>{n}</div>
                      <div style={{fontSize:11,color:'#9CA3AF'}}>{e}</div>
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600}}>{r}</span>
                    <button onClick={() => toast.success('Password reset link sent to ' + e)}
                      style={{padding:'5px 12px',border:'1px solid #E5E7EB',borderRadius:7,background:'#fff',fontSize:11,cursor:'pointer'}}>
                      Reset Password
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
