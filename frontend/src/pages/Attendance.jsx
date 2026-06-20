import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { attendanceAPI, schoolAPI, studentAPI } from '../services/api';
import { useResponsive } from '../utils/responsive';
import toast from 'react-hot-toast';

const SC = {
  present: { label:'Present', short:'P',  bg:'#D1FAE5', c:'#065F46', color:'#10B981', emoji:'✅' },
  absent:  { label:'Absent',  short:'A',  bg:'#FEE2E2', c:'#991B1B', color:'#EF4444', emoji:'❌' },
  leave:   { label:'Leave',   short:'L',  bg:'#FEF3C7', c:'#92400E', color:'#F59E0B', emoji:'🟡' },
  late:    { label:'Late',    short:'Lt', bg:'#EDE9FE', c:'#5B21B6', color:'#7C3AED', emoji:'🕐' },
};
const PAGE = 10;

function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map(r =>
    r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')
  );
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Attendance() {
  const today = new Date().toISOString().split('T')[0];
  const { isMobile, isTablet } = useResponsive();

  const [allStudents,      setAllStudents]      = useState([]);
  const [classList,        setClassList]        = useState([]);
  const [isLiveDB,         setIsLiveDB]         = useState(false);
  const [selClass,         setSelClass]         = useState('');
  const [selClassId,       setSelClassId]       = useState('');
  const [selSec,           setSelSec]           = useState('');
  const [date,             setDate]             = useState(today);
  const [localAtt,         setLocalAtt]         = useState({});
  const [page,             setPage]             = useState(0);
  const [saved,            setSaved]            = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [loadingStudents,  setLoadingStudents]  = useState(false);
  const [showSummary,      setShowSummary]      = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await schoolAPI.getClasses();
      const cls = res.data.data || [];
      if (cls.length) { setClassList(cls); setIsLiveDB(true); }
    } catch {}
  }, []);

  const loadStudents = useCallback(async (classId, className) => {
    if (!classId && !className) {
      try {
        const res  = await studentAPI.getAll({ limit:200 });
        const data = res.data.data || [];
        setAllStudents(data.map(s => ({ ...s, student_id: s.id })));
        setIsLiveDB(true);
      } catch { setIsLiveDB(false); }
      return;
    }
    setLoadingStudents(true);
    try {
      const res  = await attendanceAPI.getClass({ classId: classId || undefined, date });
      const data = res.data.data || [];
      setAllStudents(data.map(s => ({ ...s, student_id: s.student_id || s.id })));
      const existing = {};
      data.forEach(r => { if (r.status) existing[date+'|'+(r.student_id||r.id)] = r.status; });
      if (Object.keys(existing).length) setLocalAtt(p => ({ ...p, ...existing }));
      setIsLiveDB(true);
    } catch {
      try {
        const params = className ? { className, limit:200 } : { limit:200 };
        const res2   = await studentAPI.getAll(params);
        const data2  = res2.data.data || [];
        setAllStudents(data2.map(s => ({ ...s, student_id: s.id })));
        setIsLiveDB(true);
      } catch { setIsLiveDB(false); }
    } finally { setLoadingStudents(false); }
  }, [date]);

  useEffect(() => { loadClasses(); loadStudents('', ''); }, [loadClasses]);

  const handleClassChange = useCallback((name, id) => {
    setSelClass(name); setSelClassId(id || '');
    setSelSec(''); setPage(0); setSaved(false);
    loadStudents(id, name);
  }, [loadStudents]);

  const handleDateChange = useCallback((newDate) => {
    setDate(newDate); setSaved(false); setPage(0);
    if (selClassId) {
      setLoadingStudents(true);
      attendanceAPI.getClass({ classId: selClassId, date: newDate })
        .then(res => {
          const data = res.data.data || [];
          setAllStudents(data.map(s => ({ ...s, student_id: s.student_id||s.id })));
          const existing = {};
          data.forEach(r => { if (r.status) existing[newDate+'|'+(r.student_id||r.id)] = r.status; });
          setLocalAtt(existing);
        })
        .catch(() => {})
        .finally(() => setLoadingStudents(false));
    }
  }, [selClassId]);

  const sections = useMemo(() =>
    [...new Set(allStudents.map(s => s.section_name || s.sec || '').filter(Boolean))].sort()
  , [allStudents]);

  const filtered = useMemo(() =>
    allStudents.filter(s => !selSec || (s.section_name||s.sec) === selSec)
  , [allStudents, selSec]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageStudents = filtered.slice(page * PAGE, (page+1) * PAGE);

  const keyOf    = id     => `${date}|${id}`;
  const getStatus = id    => localAtt[keyOf(id)] || '';
  const setStatus = (id, status) => {
    setLocalAtt(p => ({ ...p, [keyOf(id)]: status }));
    setSaved(false);
  };

  const markAll = (status) => {
    const next = { ...localAtt };
    filtered.forEach(s => { next[keyOf(s.student_id||s.id)] = status; });
    setLocalAtt(next); setSaved(false);
    toast.success(`All ${filtered.length} marked ${SC[status].label}`);
  };

  const handleSave = async () => {
    if (!filtered.length) { toast.error('No students loaded. Select a class first.'); return; }
    setSaving(true);
    const attendanceArr = filtered
      .map(s => { const id = s.student_id||s.id; const status = localAtt[keyOf(id)]; return status ? { studentId:id, status } : null; })
      .filter(Boolean);
    if (!attendanceArr.length) { toast.error('Please mark at least one student before saving.'); setSaving(false); return; }
    try {
      const res = await attendanceAPI.mark({ date, classId: selClassId||undefined, attendance: attendanceArr });
      toast.success('✅ ' + (res.data?.message || 'Saved!'));
      setSaved(true); setIsLiveDB(true);
    } catch (err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message || 'Save failed'));
    } finally { setSaving(false); }
  };

  const handleDownload = () => {
    const headers = ['S.No','Adm No','Student Name','Class','Section','Status','Date'];
    const rows    = filtered.map((s,i) => {
      const nm = ((s.first_name||'')+' '+(s.last_name||'')).trim();
      return [i+1, s.admission_no||'', nm, s.class_name||'', s.section_name||'', getStatus(s.student_id||s.id)||'not marked', date];
    });
    downloadCSV(`Attendance_${selClass||'All'}_${date}.csv`, headers, rows);
    toast.success('Downloaded!');
  };

  const summary = useMemo(() => {
    const c = { present:0, absent:0, leave:0, late:0, unmarked:0 };
    filtered.forEach(s => {
      const v = getStatus(s.student_id||s.id);
      if (v && c[v] !== undefined) c[v]++; else c.unmarked++;
    });
    return c;
  }, [filtered, localAtt, date]);

  const pct = filtered.length > 0 ? Math.round((summary.present/filtered.length)*100) : 0;
  const inp = { padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize: isMobile?17:20, fontWeight:700, color:'#111827' }}>Mark Attendance</h2>
          <span style={{ padding:'2px 8px', background: isLiveDB?'#D1FAE5':'#FEF3C7', color: isLiveDB?'#065F46':'#92400E', borderRadius:10, fontSize:10, fontWeight:700 }}>
            {isLiveDB ? '🟢 Live DB' : '⚠️ Backend not connected'}
          </span>
        </div>
        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {!isMobile && <>
            <button onClick={()=>markAll('present')} style={{ padding:'8px 12px', border:'1.5px solid #10B981', borderRadius:9, background:'#D1FAE5', color:'#065F46', fontSize:12, fontWeight:700, cursor:'pointer' }}>✅ All Present</button>
            <button onClick={()=>markAll('absent')}  style={{ padding:'8px 12px', border:'1.5px solid #EF4444', borderRadius:9, background:'#FEE2E2', color:'#991B1B', fontSize:12, fontWeight:700, cursor:'pointer' }}>❌ All Absent</button>
            <button onClick={handleDownload} style={{ padding:'8px 12px', border:'1.5px solid #1E40AF', borderRadius:9, background:'#DBEAFE', color:'#1E40AF', fontSize:12, fontWeight:700, cursor:'pointer' }}>📥 CSV</button>
          </>}
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'8px 16px', background: saving?'#9CA3AF':'#1E1B4B', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor: saving?'not-allowed':'pointer' }}>
            {saving ? '⏳ Saving…' : '💾 Save'}
          </button>
          {isMobile && (
            <button onClick={()=>setShowSummary(s=>!s)}
              style={{ padding:'8px 12px', border:'1.5px solid #7C3AED', borderRadius:9, background:'#EDE9FE', color:'#5B21B6', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              📊 {pct}%
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE MARK ALL BUTTONS ── */}
      {isMobile && (
        <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
          <button onClick={()=>markAll('present')} style={{ flex:1, padding:'8px 6px', border:'1.5px solid #10B981', borderRadius:9, background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, cursor:'pointer' }}>✅ All Present</button>
          <button onClick={()=>markAll('absent')}  style={{ flex:1, padding:'8px 6px', border:'1.5px solid #EF4444', borderRadius:9, background:'#FEE2E2', color:'#991B1B', fontSize:11, fontWeight:700, cursor:'pointer' }}>❌ All Absent</button>
          <button onClick={handleDownload} style={{ flex:1, padding:'8px 6px', border:'1.5px solid #1E40AF', borderRadius:9, background:'#DBEAFE', color:'#1E40AF', fontSize:11, fontWeight:700, cursor:'pointer' }}>📥 CSV</button>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto auto auto 1fr', gap:10, marginBottom:14, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Date</div>
          <input type="date" value={date} onChange={e=>handleDateChange(e.target.value)} style={inp}/>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Class</div>
          <select value={selClass}
            onChange={e => { const opt = e.target.options[e.target.selectedIndex]; handleClassChange(e.target.value, opt.getAttribute('data-id')); }}
            style={inp}>
            <option value="" data-id="">All Classes</option>
            {classList.map(c => <option key={c.id} value={c.name} data-id={c.id}>{c.name}</option>)}
          </select>
        </div>
        {sections.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Section</div>
            <select value={selSec} onChange={e=>{setSelSec(e.target.value);setPage(0);}} style={inp}>
              <option value="">All</option>
              {sections.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div style={{ padding:'9px 12px', background:'#EDE9F8', borderRadius:9, fontSize:12, fontWeight:700, color:'#1E1B4B', whiteSpace:'nowrap', gridColumn: isMobile?'span 2':'auto' }}>
          👥 {filtered.length} students {selClass ? `· ${selClass}` : ''}
          {saved && <span style={{ marginLeft:8, color:'#065F46' }}>✅ Saved</span>}
        </div>
      </div>

      {/* ── MOBILE SUMMARY PANEL (collapsible) ── */}
      {isMobile && showSummary && (
        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, padding:14, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
            <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
              <svg width="64" height="64" viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${pct} ${100-pct}`} strokeLinecap="round"/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#1E1B4B' }}>{pct}%</div>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800 }}>{summary.present}/{filtered.length}</div>
              <div style={{ fontSize:11, color:'#6B7280' }}>Present today</div>
              {summary.unmarked > 0 && <div style={{ fontSize:10, color:'#F59E0B', fontWeight:600 }}>⚠️ {summary.unmarked} unmarked</div>}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
              {Object.entries(SC).map(([k,v]) => (
                <div key={k} style={{ padding:'4px 10px', background:v.bg, color:v.c, borderRadius:20, fontSize:11, fontWeight:700 }}>
                  {v.short}: {summary[k]||0}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile||isTablet ? '1fr' : '1fr 270px', gap:14 }}>

        {/* ── MARK SHEET ── */}
        <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, overflow:'hidden' }}>

          {/* Column headers — desktop */}
          {!isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 88px 88px 88px 88px', padding:'10px 14px', background:'#F9FAFB', borderBottom:'1px solid #E5E7EB', alignItems:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF' }}>#</div>
              <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em' }}>Student</div>
              {Object.entries(SC).map(([k,v]) => (
                <div key={k} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:v.c, background:v.bg, padding:'3px 0', borderRadius:6, margin:'0 2px' }}>
                  {v.short} {v.label}
                </div>
              ))}
            </div>
          )}

          {/* Student rows */}
          <div>
            {loadingStudents ? (
              <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>⏳ Loading students…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>👨‍🎓</div>
                <div style={{ fontWeight:600, color:'#6B7280' }}>No students found</div>
                <div style={{ fontSize:12, marginTop:4 }}>{selClass ? `No students in ${selClass}` : 'Select a class above'}</div>
              </div>
            ) : pageStudents.map((s, idx) => {
              const id  = s.student_id || s.id;
              const cur = getStatus(id);
              const nm  = ((s.first_name||'')+' '+(s.last_name||'')).trim();

              // ── MOBILE ROW ──
              if (isMobile) return (
                <div key={id} style={{ padding:'10px 12px', borderBottom:'0.5px solid #F3F4F6', background: idx%2?'#FAFAFA':'#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, width:20, flexShrink:0 }}>{page*PAGE+idx+1}</div>
                    {s.photo_url
                      ? <img src={s.photo_url} alt="" style={{ width:34, height:34, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
                      : <div style={{ width:34, height:34, borderRadius:8, background:'#EDE9F8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#1E1B4B', flexShrink:0 }}>{nm[0]||'?'}</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nm}</div>
                      <div style={{ fontSize:10, color:'#9CA3AF' }}>{s.admission_no||''}{s.class_name ? ` · ${s.class_name}${s.section_name?'-'+s.section_name:''}` : ''}</div>
                    </div>
                    {/* Current status badge */}
                    {cur && (
                      <div style={{ padding:'3px 10px', background:SC[cur].bg, color:SC[cur].c, borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {SC[cur].short}
                      </div>
                    )}
                  </div>
                  {/* Status buttons — full width touch targets */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                    {Object.entries(SC).map(([k,v]) => {
                      const isActive = cur === k;
                      return (
                        <button key={k} onClick={() => setStatus(id, k)}
                          style={{ padding:'8px 4px', border:`2px solid ${isActive?v.color:'#E5E7EB'}`, borderRadius:8, background: isActive?v.bg:'#F9FAFB', color: isActive?v.c:'#9CA3AF', fontSize:11, fontWeight: isActive?700:500, cursor:'pointer', transition:'all .12s' }}>
                          {v.emoji} {v.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );

              // ── DESKTOP ROW ──
              return (
                <div key={id}
                  style={{ display:'grid', gridTemplateColumns:'36px 1fr 88px 88px 88px 88px', padding:'9px 14px', borderBottom:'0.5px solid #F3F4F6', alignItems:'center', background: idx%2?'#FAFAFA':'#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background='#F5F3FF'}
                  onMouseLeave={e => e.currentTarget.style.background=idx%2?'#FAFAFA':'#fff'}>
                  <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{page*PAGE+idx+1}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {s.photo_url
                      ? <img src={s.photo_url} alt="" style={{ width:30, height:30, borderRadius:7, objectFit:'cover', flexShrink:0 }}/>
                      : <div style={{ width:30, height:30, borderRadius:7, background:'#EDE9F8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#1E1B4B', flexShrink:0 }}>{nm[0]||'?'}</div>}
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#111827' }}>{nm}</div>
                      <div style={{ fontSize:10, color:'#9CA3AF' }}>{s.admission_no||''}{s.class_name?` · ${s.class_name}${s.section_name?'-'+s.section_name:''}`:''}</div>
                    </div>
                  </div>
                  {Object.entries(SC).map(([k,v]) => {
                    const isActive = cur === k;
                    return (
                      <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div onClick={() => setStatus(id, k)}
                          style={{ cursor:'pointer', width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background: isActive?v.bg:'transparent', border:`2px solid ${isActive?v.color:'#E5E7EB'}`, transition:'all .15s' }}>
                          <span style={{ fontSize:16, color: isActive?v.color:'#D1D5DB', lineHeight:1 }}>{isActive?'●':'○'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE && (
            <div style={{ padding:'10px 14px', borderTop:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F9FAFB' }}>
              <span style={{ fontSize:12, color:'#6B7280' }}>
                {page*PAGE+1}–{Math.min((page+1)*PAGE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                  style={{ width:34, height:34, border:'1.5px solid #E5E7EB', borderRadius:8, background: page===0?'#F9FAFB':'#fff', color: page===0?'#D1D5DB':'#1E1B4B', cursor: page===0?'not-allowed':'pointer', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
                <span style={{ padding:'6px 12px', background:'#1E1B4B', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12 }}>{page+1}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                  style={{ width:34, height:34, border:'1.5px solid #E5E7EB', borderRadius:8, background: page>=totalPages-1?'#F9FAFB':'#fff', color: page>=totalPages-1?'#D1D5DB':'#1E1B4B', cursor: page>=totalPages-1?'not-allowed':'pointer', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
              </div>
            </div>
          )}
        </div>

        {/* ── SUMMARY PANEL — Desktop only ── */}
        {!isMobile && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'12px 14px', borderBottom:'0.5px solid #F3F4F6', fontWeight:700, fontSize:13, color:'#111827' }}>📊 {date}</div>
              <div style={{ padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
                    <svg width="72" height="72" viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${pct} ${100-pct}`} strokeLinecap="round"/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#1E1B4B' }}>{pct}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{summary.present}/{filtered.length}</div>
                    <div style={{ fontSize:11, color:'#6B7280' }}>Present today</div>
                    {summary.unmarked > 0 && <div style={{ fontSize:10, color:'#F59E0B', fontWeight:600, marginTop:2 }}>⚠️ {summary.unmarked} unmarked</div>}
                  </div>
                </div>
                {Object.entries(SC).map(([k,v]) => {
                  const cnt = summary[k]||0;
                  const p   = filtered.length > 0 ? Math.round((cnt/filtered.length)*100) : 0;
                  return (
                    <div key={k} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                        <span style={{ fontWeight:600, color:'#374151' }}>{v.label}</span>
                        <span style={{ fontWeight:700, color:v.c }}>{cnt} ({p}%)</span>
                      </div>
                      <div style={{ height:6, background:'#F3F4F6', borderRadius:3 }}>
                        <div style={{ height:'100%', width:`${p}%`, background:v.color, borderRadius:3, transition:'width .4s' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background:'#EDE9F8', borderRadius:12, padding:12, fontSize:11, color:'#4C1D95', lineHeight:1.9 }}>
              <strong style={{ display:'block', marginBottom:4 }}>📋 How to use:</strong>
              1. Pick date & class<br/>
              2. Students load from DB<br/>
              3. Click ● to mark status<br/>
              4. Click Save → stores in DB<br/>
              {isLiveDB
                ? <strong style={{ color:'#065F46' }}>✅ Connected to PostgreSQL</strong>
                : <span style={{ color:'#92400E' }}>⚠️ Start backend first</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
