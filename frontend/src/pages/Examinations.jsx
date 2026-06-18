import React, { useState, useEffect, useCallback } from 'react';
import { schoolAPI } from '../services/api';
import api from '../services/api';
import { printResults } from '../utils/printResults';
import toast from 'react-hot-toast';

const examAPI = {
  getAll:         ()    => api.get('/exams'),
  create:         (d)   => api.post('/exams', d),
  getSchedules:   (id)  => api.get('/exams/schedules?examId=' + id),
  addSchedule:    (d)   => api.post('/exams/schedules', d),
  getStudents:    (p)   => api.get('/exams/students', { params: p }),
  saveMarks:      (d)   => api.post('/exams/marks', d),
  getResults:     (p)   => api.get('/exams/results', { params: p }),
};

const EXAM_TYPES = [
  { value:'unit_test',   label:'Unit Test'   },
  { value:'quarterly',   label:'Quarterly'   },
  { value:'half_yearly', label:'Half Yearly' },
  { value:'annual',      label:'Annual'      },
  { value:'practical',   label:'Practical'   },
];
const TYPE_COLOR = {
  unit_test:   ['#DBEAFE','#1E40AF'], quarterly:   ['#EDE9F8','#5B21B6'],
  half_yearly: ['#FEF3C7','#92400E'], annual:      ['#D1FAE5','#065F46'],
  practical:   ['#FEE2E2','#991B1B'],
};
const GRADE_COLOR = {
  'A+':['#D1FAE5','#065F46'], 'A':['#D1FAE5','#065F46'], 'B+':['#DBEAFE','#1E40AF'],
  'B': ['#DBEAFE','#1E40AF'], 'C':['#FEF3C7','#92400E'], 'D':['#FEF3C7','#92400E'],
  'F': ['#FEE2E2','#991B1B'], 'AB':['#F3F4F6','#6B7280'],
};

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };
const th  = { padding:'10px 12px', textAlign:'left', background:'#F9FAFB', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap' };
const td  = { padding:'9px 12px', borderBottom:'0.5px solid #F3F4F6', fontSize:12 };

const MOCK_EXAMS = [
  { id:'e1', name:'Half Yearly Examination 2025', exam_type:'half_yearly', start_date:'2025-09-01', end_date:'2025-09-15' },
  { id:'e2', name:'Unit Test 1 — June 2025',      exam_type:'unit_test',   start_date:'2025-06-10', end_date:'2025-06-12' },
];

export default function Examinations() {
  const [exams,        setExams]        = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [isMock,       setIsMock]       = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [selExam,      setSelExam]      = useState(null);
  const [activeTab,    setActiveTab]    = useState('schedule');
  const [schedules,    setSchedules]    = useState([]);
  const [loadingSch,   setLoadingSch]   = useState(false);

  // Marks tab state
  const [marksSchedule, setMarksSchedule] = useState('');   // selected schedule id
  const [marksClass,    setMarksClass]    = useState('');
  const [markStudents,  setMarkStudents]  = useState([]);
  const [loadingMark,   setLoadingMark]   = useState(false);
  const [marksData,     setMarksData]     = useState({});    // { studentId: { marks, absent } }
  const [savingMarks,   setSavingMarks]   = useState(false);

  // Results tab state
  const [resultsClass,  setResultsClass]  = useState('');
  const [results,       setResults]       = useState([]);
  const [loadingRes,    setLoadingRes]    = useState(false);

  // Schedule form
  const [schForm, setSchForm] = useState({ classId:'', subjectId:'', subjectName:'', examDate:'', startTime:'', endTime:'', maxMarks:'100' });

  // Add subject
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject,     setNewSubject]     = useState('');
  const [savingSubject,  setSavingSubject]  = useState(false);

  // New exam form
  const [form, setForm] = useState({ name:'', type:'unit_test', start:'', end:'' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [exRes, clsRes, subRes] = await Promise.allSettled([
      examAPI.getAll(), schoolAPI.getClasses(), schoolAPI.getSubjects(),
    ]);
    if (exRes.status==='fulfilled')  { setExams(exRes.value.data.data||[]);   setIsMock(false); }
    else                              { setExams(MOCK_EXAMS);                  setIsMock(true);  }
    if (clsRes.status==='fulfilled') setClasses(clsRes.value.data.data||[]);
    if (subRes.status==='fulfilled') setSubjects(subRes.value.data.data||[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadSchedules = useCallback(async (examId) => {
    setLoadingSch(true);
    try { const r=await examAPI.getSchedules(examId); setSchedules(r.data.data||[]); }
    catch { setSchedules([]); }
    finally { setLoadingSch(false); }
  }, []);

  // Load students when schedule selected in Marks tab
  const loadStudentsForMarks = useCallback(async (scheduleId, classId) => {
    if (!classId) return;
    setLoadingMark(true);
    try {
      const r = await examAPI.getStudents({ classId, scheduleId: scheduleId||undefined });
      const students = r.data.data || [];
      setMarkStudents(students);
      // Pre-fill existing marks
      const existing = {};
      students.forEach(s => {
        existing[s.id] = {
          marks:  s.marks_obtained != null ? String(s.marks_obtained) : '',
          absent: s.is_absent || false,
        };
      });
      setMarksData(existing);
    } catch { setMarkStudents([]); }
    finally { setLoadingMark(false); }
  }, []);

  // Load results
  const loadResults = useCallback(async (examId, classId) => {
    setLoadingRes(true);
    try {
      const r = await examAPI.getResults({ examId, classId: classId||undefined });
      setResults(r.data.data||[]);
    } catch { setResults([]); }
    finally { setLoadingRes(false); }
  }, []);

  const openExam = (exam) => {
    setSelExam(exam); setActiveTab('schedule');
    setSchedules([]); setMarkStudents([]); setResults([]);
    setMarksSchedule(''); setMarksClass(''); setResultsClass('');
    loadSchedules(exam.id);
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    setSavingSubject(true);
    try {
      const r = await schoolAPI.addSubject({ name: newSubject.trim() });
      const added = r.data.data;
      setSubjects(p => [...p, added].sort((a,b)=>a.name.localeCompare(b.name)));
      setSchForm(f=>({...f,subjectId:added.id,subjectName:added.name}));
      toast.success('✅ Subject "' + newSubject.trim() + '" saved to database!');
      setNewSubject(''); setShowAddSubject(false);
    } catch(err) {
      if (err.response?.status===409) toast.error('Subject already exists');
      else { const loc={id:'l'+Date.now(),name:newSubject.trim()}; setSubjects(p=>[...p,loc].sort((a,b)=>a.name.localeCompare(b.name))); setSchForm(f=>({...f,subjectId:loc.id,subjectName:loc.name})); toast.error('❌ Failed to add subject'); setNewSubject(''); setShowAddSubject(false); }
    } finally { setSavingSubject(false); }
  };

  const handleAddSchedule = async () => {
    if (!schForm.classId || !schForm.subjectId) { toast.error('Select class and subject'); return; }
    setSaving(true);
    try {
      await examAPI.addSchedule({ examId:selExam.id, classId:schForm.classId, subjectId:schForm.subjectId, subjectName:schForm.subjectName, examDate:schForm.examDate||null, startTime:schForm.startTime||null, endTime:schForm.endTime||null, maxMarks:parseInt(schForm.maxMarks)||100 });
      toast.success('✅ Schedule saved to database!');
      loadSchedules(selExam.id);
      setSchForm({ classId:'', subjectId:'', subjectName:'', examDate:'', startTime:'', endTime:'', maxMarks:'100' });
    } catch(err) { toast.error('❌ ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleSaveMarks = async () => {
    const sch = schedules.find(s=>s.id===marksSchedule);
    if (!sch) { toast.error('Select a schedule first'); return; }
    setSavingMarks(true);
    const marks = markStudents.map(s => ({
      examId:         selExam.id,
      examScheduleId: marksSchedule,
      studentId:      s.id,
      subjectId:      sch.subject_id,
      maxMarks:       sch.max_marks,
      marksObtained:  marksData[s.id]?.absent ? null : (parseFloat(marksData[s.id]?.marks)||0),
      isAbsent:       marksData[s.id]?.absent || false,
    }));
    try {
      await examAPI.saveMarks({ marks });
      toast.success('✅ Marks saved to database!');
    } catch(err) { toast.error('❌ ' + (err.response?.data?.message || err.message)); }
    finally { setSavingMarks(false); }
  };

  const handleAddExam = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await examAPI.create({ name:form.name, examType:form.type, startDate:form.start, endDate:form.end });
      toast.success('✅ Exam saved to database!');
      setShowAdd(false); setForm({ name:'', type:'unit_test', start:'', end:'' }); loadData();
    } catch(err) { toast.error('❌ ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const getStatus = (e) => { if (!e.end_date) return 'Upcoming'; return e.end_date < today ? 'Completed' : e.start_date <= today ? 'Ongoing' : 'Upcoming'; };
  const statusStyle = { Completed:['#D1FAE5','#065F46'], Ongoing:['#FEF3C7','#92400E'], Upcoming:['#DBEAFE','#1E40AF'] };

  // Results grouped by student
  const resultsByStudent = results.reduce((acc, r) => {
    const key = r.student_id;
    if (!acc[key]) acc[key] = { name:`${r.first_name} ${r.last_name}`, admNo:r.admission_no, roll:r.roll_no, photo:r.photo_url||null, subjects:[] };
    acc[key].subjects.push(r);
    return acc;
  }, {});
  const studentResults = Object.values(resultsByStudent);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Examinations</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {exams.length} exams &nbsp;
            {isMock?<span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Demo mode</span>
                   :<span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{padding:'9px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ New Exam</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[['Total',exams.length,'#EDE9F8','#1E1B4B'],['Upcoming',exams.filter(e=>getStatus(e)==='Upcoming').length,'#DBEAFE','#1E40AF'],['Completed',exams.filter(e=>getStatus(e)==='Completed').length,'#D1FAE5','#065F46']].map(([l,v,bg,c])=>(
          <div key={l} style={{padding:'14px',background:bg,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:c,marginTop:4,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
        {loading&&[1,2,3].map(i=><div key={i} style={{height:130,background:'#F9FAFB',borderRadius:12,border:'0.5px solid #E5E7EB'}}/>)}
        {!loading&&exams.map(exam=>{
          const [bg,c]=TYPE_COLOR[exam.exam_type]||['#F3F4F6','#374151'];
          const status=getStatus(exam); const [sBg,sC]=statusStyle[status];
          return (
            <div key={exam.id} style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:18,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)';e.currentTarget.style.borderColor='#C4B5FD';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='#E5E7EB';}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:bg,color:c}}>{EXAM_TYPES.find(t=>t.value===exam.exam_type)?.label||exam.exam_type}</span>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:sBg,color:sC}}>{status}</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:'#111827',marginBottom:8}}>{exam.name}</div>
              <div style={{fontSize:11,color:'#6B7280',marginBottom:12}}>📅 {exam.start_date||'—'} → 🏁 {exam.end_date||'—'}</div>
              <button onClick={()=>openExam(exam)} style={{width:'100%',padding:'7px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>📋 Schedule & Marks →</button>
            </div>
          );
        })}
        {!loading&&exams.length===0&&<div style={{gridColumn:'1/-1',padding:48,textAlign:'center',color:'#9CA3AF',background:'#fff',borderRadius:14,border:'0.5px solid #E5E7EB'}}><div style={{fontSize:40,marginBottom:10}}>📝</div>No exams yet</div>}
      </div>

      {/* Exam detail modal */}
      {selExam&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:18,width:760,maxHeight:'92vh',overflow:'auto',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>{selExam.name}</div>
                <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>📅 {selExam.start_date||'—'} → 🏁 {selExam.end_date||'—'}</div>
              </div>
              <button onClick={()=>setSelExam(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid #E5E7EB',padding:'0 20px',flexShrink:0}}>
              {[['schedule','📅 Schedule'],['marks','✏️ Enter Marks'],['results','📊 Results']].map(([key,label])=>(
                <button key={key} onClick={()=>{setActiveTab(key);if(key==='results')loadResults(selExam.id,resultsClass);}}
                  style={{padding:'10px 16px',border:'none',borderBottom:activeTab===key?'2px solid #1E1B4B':'2px solid transparent',background:'transparent',color:activeTab===key?'#1E1B4B':'#6B7280',fontSize:13,fontWeight:activeTab===key?700:500,cursor:'pointer',marginBottom:-1}}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{padding:20,flex:1,overflowY:'auto'}}>

              {/* ── SCHEDULE TAB ── */}
              {activeTab==='schedule'&&(
                <div>
                  <div style={{background:'#F9FAFB',borderRadius:12,padding:16,marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:12}}>+ Add Schedule Entry</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                      <div><label style={lbl}>Class *</label>
                        <select value={schForm.classId} onChange={e=>setSchForm(f=>({...f,classId:e.target.value}))} style={inp}>
                          <option value="">Select Class</option>
                          {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Subject *</label>
                        <div style={{display:'flex',gap:8}}>
                          <select value={schForm.subjectId} onChange={e=>{const s=subjects.find(x=>x.id===e.target.value);setSchForm(f=>({...f,subjectId:e.target.value,subjectName:s?.name||''}));}} style={{...inp,flex:1}}>
                            <option value="">Select Subject</option>
                            {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button type="button" onClick={()=>setShowAddSubject(true)} style={{padding:'10px 12px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontWeight:800,cursor:'pointer',fontSize:18,height:44,flexShrink:0}}>+</button>
                        </div>
                        <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>Not in list? Click + to add</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
                      <div><label style={lbl}>Exam Date</label><input type="date" value={schForm.examDate} onChange={e=>setSchForm(f=>({...f,examDate:e.target.value}))} style={inp}/></div>
                      <div><label style={lbl}>Start Time</label><input type="time" value={schForm.startTime} onChange={e=>setSchForm(f=>({...f,startTime:e.target.value}))} style={inp}/></div>
                      <div><label style={lbl}>End Time</label><input type="time" value={schForm.endTime} onChange={e=>setSchForm(f=>({...f,endTime:e.target.value}))} style={inp}/></div>
                      <div><label style={lbl}>Max Marks</label><input type="number" value={schForm.maxMarks} onChange={e=>setSchForm(f=>({...f,maxMarks:e.target.value}))} style={inp}/></div>
                    </div>
                    <button onClick={handleAddSchedule} disabled={saving} style={{padding:'9px 20px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      {saving?'⏳ Saving…':'+ Add Schedule'}
                    </button>
                  </div>
                  {loadingSch?<div style={{textAlign:'center',color:'#9CA3AF',padding:20}}>⏳ Loading…</div>:
                  schedules.length===0?<div style={{textAlign:'center',color:'#9CA3AF',padding:20,background:'#F9FAFB',borderRadius:10,fontSize:12}}>No schedules yet — add one above</div>:
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr>{['Subject','Class','Date','Time','Max Marks','Pass Marks'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>{schedules.map((r,i)=>(
                      <tr key={r.id||i} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{...td,fontWeight:600}}>{r.subject_name}</td>
                        <td style={td}>{r.class_name}</td>
                        <td style={td}>{r.exam_date||'—'}</td>
                        <td style={td}>{r.start_time||'—'} {r.end_time?'– '+r.end_time:''}</td>
                        <td style={{...td,fontWeight:700}}>{r.max_marks}</td>
                        <td style={td}>{r.pass_marks}</td>
                      </tr>
                    ))}</tbody>
                  </table>}
                </div>
              )}

              {/* ── ENTER MARKS TAB ── */}
              {activeTab==='marks'&&(
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    <div>
                      <label style={lbl}>Select Schedule (Subject + Class)</label>
                      <select value={marksSchedule} onChange={e=>{
                        const sch=schedules.find(s=>s.id===e.target.value);
                        setMarksSchedule(e.target.value);
                        setMarksClass(sch?.class_id||'');
                        if(sch?.class_id) loadStudentsForMarks(e.target.value,sch.class_id);
                      }} style={inp}>
                        <option value="">Select Schedule</option>
                        {schedules.map(s=><option key={s.id} value={s.id}>{s.subject_name} — {s.class_name} ({s.exam_date||'No date'}) Max: {s.max_marks}</option>)}
                      </select>
                      {schedules.length===0&&<div style={{fontSize:11,color:'#92400E',marginTop:4}}>⚠️ Add schedules in the Schedule tab first</div>}
                    </div>
                    {marksSchedule&&<div style={{display:'flex',alignItems:'flex-end'}}>
                      <div style={{padding:'10px 14px',background:'#EDE9F8',borderRadius:9,fontSize:12,color:'#1E1B4B',fontWeight:600}}>
                        {markStudents.length} students · Max: {schedules.find(s=>s.id===marksSchedule)?.max_marks} marks
                      </div>
                    </div>}
                  </div>

                  {loadingMark?<div style={{textAlign:'center',color:'#9CA3AF',padding:30}}>⏳ Loading students…</div>:
                  markStudents.length===0&&marksSchedule?<div style={{textAlign:'center',color:'#9CA3AF',padding:30,background:'#F9FAFB',borderRadius:10}}>No students found for this class</div>:
                  markStudents.length===0?<div style={{textAlign:'center',color:'#9CA3AF',padding:40,background:'#F9FAFB',borderRadius:10}}>
                    <div style={{fontSize:32,marginBottom:8}}>✏️</div>
                    <div style={{fontWeight:600,color:'#6B7280'}}>Select a schedule above to load students</div>
                  </div>:
                  <div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:14}}>
                      <thead><tr>{['Roll','Adm No','Student Name','Marks (out of '+schedules.find(s=>s.id===marksSchedule)?.max_marks+')','Absent?','Grade'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {markStudents.map((s,i)=>{
                          const md    = marksData[s.id]||{};
                          const max   = schedules.find(x=>x.id===marksSchedule)?.max_marks||100;
                          const pct   = md.absent?0:(parseFloat(md.marks)||0)/max*100;
                          const grade = md.absent?'AB':pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=33?'D':'F';
                          const [gBg,gC]=GRADE_COLOR[grade]||['#F3F4F6','#6B7280'];
                          return (
                            <tr key={s.id} style={{borderBottom:'0.5px solid #F3F4F6',background:i%2?'#FAFAFA':'#fff'}}>
                              <td style={{...td,color:'#9CA3AF',width:40}}>{s.roll_no||i+1}</td>
                              <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{s.admission_no}</td>
                              <td style={{...td,fontWeight:600}}>{s.first_name} {s.last_name}</td>
                              <td style={{...td,width:140}}>
                                <input type="number" value={md.marks||''} min={0} max={max}
                                  disabled={md.absent}
                                  onChange={e=>setMarksData(p=>({...p,[s.id]:{...md,marks:e.target.value}}))}
                                  style={{...inp,padding:'6px 10px',width:80,background:md.absent?'#F3F4F6':'#fff',color:md.absent?'#9CA3AF':'#111827'}}
                                  placeholder="0"/>
                              </td>
                              <td style={{...td,textAlign:'center'}}>
                                <input type="checkbox" checked={md.absent||false}
                                  onChange={e=>setMarksData(p=>({...p,[s.id]:{...md,absent:e.target.checked,marks:e.target.checked?'':md.marks}}))}
                                  style={{width:16,height:16,accentColor:'#EF4444',cursor:'pointer'}}/>
                              </td>
                              <td style={td}>
                                <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:gBg,color:gC}}>{grade}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <button onClick={handleSaveMarks} disabled={savingMarks}
                        style={{padding:'10px 24px',background:savingMarks?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                        {savingMarks?'⏳ Saving…':'💾 Save All Marks to DB'}
                      </button>
                    </div>
                  </div>}
                </div>
              )}

              {/* ── RESULTS TAB ── */}
              {activeTab==='results'&&(
                <div>
                  <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'flex-end'}}>
                    <div style={{flex:1}}>
                      <label style={lbl}>Filter by Class</label>
                      <select value={resultsClass} onChange={e=>{setResultsClass(e.target.value);loadResults(selExam.id,e.target.value);}} style={inp}>
                        <option value="">All Classes</option>
                        {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <button onClick={()=>loadResults(selExam.id,resultsClass)} style={{padding:'10px 16px',background:'#EDE9F8',color:'#1E1B4B',border:'1.5px solid #1E1B4B',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>🔄 Refresh</button>
                    {studentResults.length>0 && (
                      <button onClick={()=>printResults(selExam, studentResults, classes, resultsClass)}
                        style={{padding:'10px 18px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                        🖨️ Print Results
                      </button>
                    )}
                  </div>

                  {loadingRes?<div style={{textAlign:'center',color:'#9CA3AF',padding:30}}>⏳ Loading results…</div>:
                  studentResults.length===0?<div style={{textAlign:'center',color:'#9CA3AF',padding:40,background:'#F9FAFB',borderRadius:10}}>
                    <div style={{fontSize:32,marginBottom:8}}>📊</div>
                    <div style={{fontWeight:600,color:'#6B7280'}}>No results yet</div>
                    <div style={{fontSize:12,marginTop:4}}>Enter marks in the "Enter Marks" tab first</div>
                  </div>:
                  studentResults.map(stu=>{
                    const totalObtained = stu.subjects.filter(s=>!s.is_absent).reduce((sum,s)=>sum+(parseFloat(s.marks_obtained)||0),0);
                    const totalMax      = stu.subjects.reduce((sum,s)=>sum+(s.max_marks||0),0);
                    const pct           = totalMax>0?Math.round((totalObtained/totalMax)*100):0;
                    const passed        = stu.subjects.every(s=>s.is_absent||(parseFloat(s.marks_obtained)||0)>=(s.pass_marks||33));
                    return (
                      <div key={stu.admNo} style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:12,marginBottom:12,overflow:'hidden'}}>
                        <div style={{padding:'10px 16px',background:'#F9FAFB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <span style={{fontWeight:700,color:'#111827'}}>{stu.name}</span>
                            <span style={{fontSize:11,color:'#9CA3AF',marginLeft:8}}>Adm: {stu.admNo}</span>
                          </div>
                          <div style={{display:'flex',gap:10,alignItems:'center'}}>
                            <span style={{fontSize:12,fontWeight:700,color:'#374151'}}>{totalObtained}/{totalMax} ({pct}%)</span>
                            <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:passed?'#D1FAE5':'#FEE2E2',color:passed?'#065F46':'#991B1B'}}>{passed?'PASS':'FAIL'}</span>
                            <button
                              onClick={()=>printResults(selExam,[stu],classes,resultsClass)}
                              title={'Print result for '+stu.name}
                              style={{padding:'4px 12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                              🖨️ Print
                            </button>
                          </div>
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                          <thead><tr style={{background:'#F9FAFB'}}>
                            {['Subject','Max Marks','Marks Obtained','Pass Marks','Grade','Status'].map(h=><th key={h} style={{...th,background:'transparent'}}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {stu.subjects.map((r,i)=>{
                              const [gBg,gC]=GRADE_COLOR[r.grade]||['#F3F4F6','#6B7280'];
                              const subjPassed = r.is_absent?false:(parseFloat(r.marks_obtained)||0)>=(r.pass_marks||33);
                              return (
                                <tr key={i} style={{borderBottom:'0.5px solid #F3F4F6'}}>
                                  <td style={{...td,fontWeight:600}}>{r.subject_name}</td>
                                  <td style={td}>{r.max_marks}</td>
                                  <td style={{...td,fontWeight:700}}>{r.is_absent?'—':(r.marks_obtained||'Not entered')}</td>
                                  <td style={td}>{r.pass_marks||33}</td>
                                  <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:gBg,color:gC}}>{r.is_absent?'AB':(r.grade||'—')}</span></td>
                                  <td style={td}>{r.is_absent?<span style={{color:'#6B7280',fontSize:11}}>Absent</span>:<span style={{color:subjPassed?'#065F46':'#991B1B',fontWeight:600,fontSize:11}}>{subjPassed?'✓ Pass':'✗ Fail'}</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Subject modal */}
      {showAddSubject&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:420,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>+ Add New Subject</div>
              <button onClick={()=>setShowAddSubject(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:12}}><label style={lbl}>Subject Name *</label>
                <input value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="e.g. Mathematics" style={inp} autoFocus onKeyDown={e=>e.key==='Enter'&&handleAddSubject()}/>
                <div style={{fontSize:10,color:'#6B7280',marginTop:4}}>Saved to DB · appears in all dropdowns next time</div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6B7280',marginBottom:6}}>Existing:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,maxHeight:80,overflowY:'auto'}}>
                  {subjects.map(s=><span key={s.id} style={{padding:'2px 9px',background:'#EDE9F8',borderRadius:20,fontSize:11,color:'#1E1B4B'}}>{s.name}</span>)}
                  {!subjects.length&&<span style={{fontSize:12,color:'#9CA3AF'}}>None yet</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowAddSubject(false)} style={{padding:'9px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleAddSubject} disabled={savingSubject||!newSubject.trim()}
                  style={{padding:'9px 20px',background:savingSubject?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {savingSubject?'⏳…':'+ Add Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Exam modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:500}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>📝 New Examination</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleAddExam} style={{padding:20}}>
              <div style={{marginBottom:12}}><label style={lbl}>Exam Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Half Yearly Examination 2025" style={inp} autoFocus/></div>
              <div style={{marginBottom:12}}><label style={lbl}>Exam Type *</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
                  {EXAM_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Start Date *</label><input required type="date" value={form.start} onChange={e=>setForm({...form,start:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>End Date *</label><input required type="date" value={form.end} onChange={e=>setForm({...form,end:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>{saving?'⏳ Saving…':'💾 Save Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
