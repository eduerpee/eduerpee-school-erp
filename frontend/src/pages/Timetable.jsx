import React, { useState, useEffect, useCallback } from 'react';
import { schoolAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const timetableAPI = {
  get:  (p) => api.get('/timetable', { params: p }),
  save: (d) => api.post('/timetable', d),
  del:  (id) => api.delete('/timetable/' + id),
};

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const HOURS = ['08:00','08:45','09:30','10:15','11:15','12:00','12:45','13:30','14:15'];
const PERIODS = 8;
const PERIOD_COLORS = ['#EDE9F8','#DBEAFE','#D1FAE5','#FEF3C7','#FCE7F3','#FEE2E2','#E0F2FE','#F3F4F6'];
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

export default function Timetable() {
  const [classes,       setClasses]       = useState([]);
  const [selClass,      setSelClass]       = useState(null);
  const [selSection,    setSelSection]     = useState('A');
  const [grid,          setGrid]           = useState({});
  const [loading,       setLoading]        = useState(false);
  const [isLive,        setIsLive]         = useState(false);
  const [showEdit,      setShowEdit]       = useState(null);
  const [saving,        setSaving]         = useState(false);
  const [editForm,      setEditForm]       = useState({ subject:'', teacher:'', teacherId:'', startTime:'', endTime:'' });
  const [teachers,      setTeachers]       = useState([]);
  const [subjects,      setSubjects]       = useState([]);
  const [teacherSearch, setTeacherSearch]  = useState('');

  useEffect(() => {
    // Load teachers (with user_id for FK)
    api.get('/employees?employeeType=teaching&limit=200')
      .then(r => setTeachers(r.data.data || []))
      .catch(() => {});
    // Load subjects from DB
    schoolAPI.getSubjects()
      .then(r => setSubjects((r.data.data||[]).map(s=>s.name)))
      .catch(() => {});
    // Load classes
    schoolAPI.getClasses()
      .then(res => {
        const cls = res.data.data || [];
        setClasses(cls);
        if (cls.length) setSelClass(cls[0]);
        setIsLive(true);
      })
      .catch(() => setIsLive(false));
  }, []);

  const loadTimetable = useCallback(async () => {
    if (!selClass) return;
    setLoading(true);
    try {
      const res  = await timetableAPI.get({ classId: selClass.id });
      const data = res.data.data || [];
      const g = {};
      data.forEach(row => {
        const key = row.day_of_week + '_' + row.period_no;
        g[key] = {
          subject:    row.subject_name  || '',
          teacher:    row.teacher_name  || '',
          teacherId:  row.teacher_id    || '',   // users.id
          employeeId: row.employee_id_ref || '',  // employees.id
          startTime:  row.start_time    || '',
          endTime:    row.end_time      || '',
          slotId:     row.id,
        };
      });
      setGrid(g);
    } catch { setGrid({}); }
    finally { setLoading(false); }
  }, [selClass]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  const cellKey = (dayIdx, period) => (dayIdx + 1) + '_' + period;

  const openEdit = (dayIdx, period) => {
    const key  = cellKey(dayIdx, period);
    const cell = grid[key] || {};
    setTeacherSearch(cell.teacher || '');
    setEditForm({
      subject:    cell.subject    || '',
      teacher:    cell.teacher    || '',
      teacherId:  cell.employeeId || cell.teacherId || '', // store employee.id
      startTime:  cell.startTime  || HOURS[period-1] || '',
      endTime:    cell.endTime    || HOURS[period]   || '',
    });
    setShowEdit({ day: dayIdx, period, slotId: cell.slotId || null });
  };

  const handleSave = async () => {
    if (!showEdit || !selClass) return;
    if (!editForm.subject) { toast.error('Please select a subject'); return; }
    setSaving(true);
    const key = cellKey(showEdit.day, showEdit.period);
    try {
      const res = await timetableAPI.save({
        classId:     selClass.id,
        sectionId:   null,
        dayOfWeek:   showEdit.day + 1,
        periodNo:    showEdit.period,
        subjectName: editForm.subject,
        teacherId:   editForm.teacherId || null, // backend resolves employee.id → user_id
        startTime:   editForm.startTime || null,
        endTime:     editForm.endTime   || null,
      });
      toast.success('✅ Slot saved to database!');
      setGrid(p => ({ ...p, [key]: {
        subject:    editForm.subject,
        teacher:    editForm.teacher,
        teacherId:  res.data?.data?.teacher_id || editForm.teacherId,
        employeeId: editForm.teacherId,
        startTime:  editForm.startTime,
        endTime:    editForm.endTime,
        slotId:     res.data?.data?.id || showEdit.slotId,
      }}));
      setIsLive(true);
      setShowEdit(null);
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const clearSlot = async (dayIdx, period, e) => {
    e.stopPropagation();
    const key  = cellKey(dayIdx, period);
    const cell = grid[key];
    if (cell?.slotId) {
      try { await timetableAPI.del(cell.slotId); } catch {}
    }
    setGrid(p => { const n={...p}; delete n[key]; return n; });
    toast.success('Slot cleared');
  };

  const handleBulkSave = async () => {
    setSaving(true);
    let saved = 0;
    for (const [key, val] of Object.entries(grid)) {
      if (!val.subject) continue;
      const [day, period] = key.split('_').map(Number);
      try {
        await timetableAPI.save({
          classId: selClass?.id, sectionId: null,
          dayOfWeek: day, periodNo: period,
          subjectName: val.subject,
          teacherId: val.employeeId || val.teacherId || null,
          startTime: val.startTime || null, endTime: val.endTime || null,
        });
        saved++;
      } catch {}
    }
    setSaving(false);
    toast.success(saved > 0 ? '✅ ' + saved + ' slots saved!' : '⚠️ Nothing to save');
    if (saved > 0) setIsLive(true);
  };

  const filteredTeachers = teacherSearch
    ? teachers.filter(t => (t.first_name+' '+(t.last_name||'')).toLowerCase().includes(teacherSearch.toLowerCase()))
    : [];

  const filledCount = Object.values(grid).filter(v=>v.subject).length;

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Timetable</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {selClass?.name} · {filledCount} slots filled &nbsp;
            {isLive
              ? <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
              : <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Demo mode</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>{
            const text = DAYS.map((day,di)=>day+'\n'+Array.from({length:PERIODS},(_,p)=>{const c=grid[cellKey(di,p+1)];return (p+1)+'. '+(c?.subject||'—')+(c?.teacher?' ('+c.teacher+')':'');}).join('\n')).join('\n\n');
            const b=new Blob([selClass?.name+' Timetable\n\n'+text],{type:'text/plain'});
            const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Timetable_'+selClass?.name+'.txt';a.click();
          }} style={{padding:'9px 14px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontSize:12,fontWeight:700,cursor:'pointer'}}>📥 Export</button>
          {filledCount>0 && <button onClick={handleBulkSave} disabled={saving} style={{padding:'9px 20px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {saving?'⏳ Saving…':'💾 Save All to DB'}
          </button>}
        </div>
      </div>

      {/* Class + Section selector */}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {classes.map(cls=>(
            <button key={cls.id} onClick={()=>{setSelClass(cls);setGrid({});}}
              style={{padding:'7px 14px',border:'1.5px solid '+(selClass?.id===cls.id?'#1E1B4B':'#E5E7EB'),borderRadius:9,background:selClass?.id===cls.id?'#1E1B4B':'#fff',color:selClass?.id===cls.id?'#fff':'#374151',fontSize:12,fontWeight:selClass?.id===cls.id?700:500,cursor:'pointer'}}>
              {cls.name}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:6}}>
          {['A','B','C','D'].map(s=>(
            <button key={s} onClick={()=>setSelSection(s)}
              style={{width:34,height:34,border:'1.5px solid '+(selSection===s?'#7C3AED':'#E5E7EB'),borderRadius:8,background:selSection===s?'#EDE9F8':'#fff',color:selSection===s?'#5B21B6':'#374151',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {s}
            </button>
          ))}
        </div>
        {loading && <span style={{fontSize:12,color:'#9CA3AF'}}>⏳ Loading…</span>}
      </div>

      {/* Grid */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead>
            <tr style={{background:'#F9FAFB'}}>
              <th style={{padding:'12px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',width:110}}>Period / Day</th>
              {DAYS.map(d=>(
                <th key={d} style={{padding:'12px 14px',textAlign:'center',fontSize:12,fontWeight:700,color:'#1E1B4B',borderBottom:'1px solid #E5E7EB',borderLeft:'0.5px solid #F3F4F6'}}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length:PERIODS},(_,p)=>(
              <tr key={p} style={{borderBottom:'0.5px solid #F3F4F6'}}>
                <td style={{padding:'8px 12px',background:'#F9FAFB',borderRight:'1px solid #E5E7EB'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#1E1B4B'}}>Period {p+1}</div>
                  <div style={{fontSize:10,color:'#9CA3AF'}}>{HOURS[p]}–{HOURS[p+1]||'—'}</div>
                </td>
                {DAYS.map((day,di)=>{
                  const key  = cellKey(di, p+1);
                  const cell = grid[key];
                  const clr  = PERIOD_COLORS[p % PERIOD_COLORS.length];
                  return (
                    <td key={di} onClick={()=>openEdit(di,p+1)}
                      style={{padding:6,borderLeft:'0.5px solid #F3F4F6',cursor:'pointer',verticalAlign:'top',minWidth:110}}
                      onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      {cell?.subject ? (
                        <div style={{background:clr,borderRadius:8,padding:'6px 8px',position:'relative',minHeight:52}}>
                          <div style={{fontSize:12,fontWeight:700,color:'#1E1B4B',lineHeight:1.3}}>{cell.subject}</div>
                          {cell.teacher && <div style={{fontSize:10,color:'#6B7280',marginTop:2}}>👤 {cell.teacher}</div>}
                          {cell.startTime && <div style={{fontSize:9,color:'#9CA3AF',marginTop:2}}>🕐 {cell.startTime}</div>}
                          <button onClick={(e)=>clearSlot(di,p+1,e)}
                            style={{position:'absolute',top:3,right:3,background:'rgba(255,255,255,.7)',border:'none',borderRadius:4,width:16,height:16,fontSize:10,cursor:'pointer',color:'#DC2626'}}>✕</button>
                        </div>
                      ) : (
                        <div style={{height:52,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px dashed #E5E7EB',borderRadius:8,color:'#D1D5DB',fontSize:18}}>+</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:12,padding:'10px 14px',background:'#EDE9F8',borderRadius:10,fontSize:11,color:'#1E1B4B',display:'flex',gap:20,flexWrap:'wrap'}}>
        <span>🖱️ Click any cell to assign a subject</span>
        <span>✕ Click X on a cell to clear it</span>
        <span>💾 Save All to DB persists everything</span>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:440,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>📅 {DAYS[showEdit.day]} · Period {showEdit.period}</div>
              <button onClick={()=>setShowEdit(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Subject *</label>
                <select value={editForm.subject} onChange={e=>setEditForm({...editForm,subject:e.target.value})} style={inp}>
                  <option value="">— Select Subject —</option>
                  {(subjects.length > 0 ? subjects : ['Mathematics','Science','English','Hindi','Social Science','Computer','Physical Education','Art','Music','Sanskrit','GK']).map(s=>(
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Teacher (optional)</label>
                <input
                  value={teacherSearch}
                  onChange={e => { setTeacherSearch(e.target.value); if (!e.target.value) setEditForm({...editForm,teacher:'',teacherId:''}); }}
                  placeholder="Search teacher by name…"
                  style={inp}
                />
                {teacherSearch && !editForm.teacherId && filteredTeachers.length > 0 && (
                  <div style={{border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',boxShadow:'0 4px 16px rgba(0,0,0,.12)',maxHeight:160,overflowY:'auto',marginTop:4}}>
                    {filteredTeachers.map(t => (
                      <div key={t.id}
                        onClick={()=>{ const name=t.first_name+' '+(t.last_name||''); setTeacherSearch(name); setEditForm({...editForm,teacher:name,teacherId:t.id}); }}
                        style={{padding:'9px 14px',cursor:'pointer',fontSize:12,borderBottom:'0.5px solid #F3F4F6',display:'flex',alignItems:'center',gap:10}}
                        onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <div style={{width:28,height:28,borderRadius:7,background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#1E1B4B',flexShrink:0}}>
                          {t.first_name[0]}
                        </div>
                        <div>
                          <div style={{fontWeight:600,color:'#111827'}}>{t.first_name} {t.last_name||''}</div>
                          <div style={{fontSize:10,color:'#9CA3AF'}}>{t.employee_id} · {t.department||'Teaching'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editForm.teacherId && (
                  <div style={{marginTop:6,padding:'6px 10px',background:'#D1FAE5',borderRadius:7,fontSize:11,color:'#065F46',fontWeight:600}}>
                    ✅ {editForm.teacher} selected
                  </div>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Start Time</label><input type="time" value={editForm.startTime} onChange={e=>setEditForm({...editForm,startTime:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>End Time</label><input type="time" value={editForm.endTime} onChange={e=>setEditForm({...editForm,endTime:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowEdit(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSave} disabled={saving||!editForm.subject}
                  style={{padding:'10px 22px',background:saving||!editForm.subject?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving||!editForm.subject?'not-allowed':'pointer'}}>
                  {saving?'⏳ Saving…':'💾 Save Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
