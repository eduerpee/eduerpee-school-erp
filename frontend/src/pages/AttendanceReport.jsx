import React, { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, schoolAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';

function fmtDate(d) { return d ? String(d).split('T')[0] : '—'; }

function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','));
  const blob  = new Blob(['\uFEFF' + lines.join('\r\n')], { type:'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const S = {
  present: { short:'P',  label:'Present', bg:'#D1FAE5', c:'#065F46', bar:'#10B981' },
  absent:  { short:'A',  label:'Absent',  bg:'#FEE2E2', c:'#991B1B', bar:'#EF4444' },
  leave:   { short:'L',  label:'Leave',   bg:'#FEF3C7', c:'#92400E', bar:'#F59E0B' },
  late:    { short:'Lt', label:'Late',    bg:'#EDE9FE', c:'#5B21B6', bar:'#7C3AED' },
};

const th  = { padding:'10px 12px', textAlign:'left', background:'#F9FAFB', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap' };
const td  = { padding:'10px 12px', borderBottom:'0.5px solid #F3F4F6', fontSize:12 };
const inp = { padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' };
const TABS = ['Date-wise Report', 'Class Summary', 'Monthly Overview'];

export default function AttendanceReport() {
  const today = new Date().toISOString().split('T')[0];
  const [tab,      setTab]      = useState(0);
  const [date,     setDate]     = useState(today);
  const [cls,      setCls]      = useState('');
  const [clsId,    setClsId]    = useState('');
  const [classList,setClassList]= useState([]);
  const [loading,  setLoading]  = useState(false);
  const [isLiveDB, setIsLiveDB] = useState(false);

  // Tab 1 — Date-wise student list
  const [dateRows, setDateRows] = useState([]);
  // Tab 2 — Class summary
  const [summaryRows, setSummaryRows] = useState([]);
  // Tab 3 — Monthly
  const [monthYear, setMonthYear] = useState(() => today.slice(0, 7));
  const [monthRows, setMonthRows] = useState([]);

  // Load classes on mount
  useEffect(() => {
    schoolAPI.getClasses()
      .then(res => { setClassList(res.data.data || []); setIsLiveDB(true); })
      .catch(() => {});
  }, []);

  // ── Tab 1: load date-wise student attendance ─────────────
  const loadDateReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getClass({
        classId: clsId || undefined,
        date,
      });
      setDateRows(res.data.data || []);
      setIsLiveDB(true);
    } catch (err) {
      toast.error('Could not load attendance: ' + (err.response?.data?.message || err.message));
      setDateRows([]);
    } finally { setLoading(false); }
  }, [clsId, date]);

  // ── Tab 2: class summary report ─────────────────────────
  const loadSummaryReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getReport({
        date,
        classId: clsId || undefined,
      });
      setSummaryRows(res.data.data || []);
      setIsLiveDB(true);
    } catch (err) {
      toast.error('Could not load summary: ' + (err.response?.data?.message || err.message));
      setSummaryRows([]);
    } finally { setLoading(false); }
  }, [clsId, date]);

  // ── Tab 3: monthly per-student overview ─────────────────
  const loadMonthlyReport = useCallback(async () => {
    if (!clsId) { toast.error('Select a class for monthly report'); return; }
    setLoading(true);
    try {
      const [year, month] = monthYear.split('-');
      // Load all students in the class
      const stuRes  = await studentAPI.getAll({ limit:200 });
      const allStus = (stuRes.data.data || []).filter(s => s.class_name === cls);

      // Load attendance for each student this month
      const rows = await Promise.all(allStus.map(async (s) => {
        try {
          const ar = await attendanceAPI.getMonthly(s.id, { month, year });
          const records = ar.data.data || [];
          const counts = { present:0, absent:0, leave:0, late:0 };
          records.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
          const total = records.length;
          const pct   = total > 0 ? Math.round((counts.present/total)*100) : 0;
          return { ...s, ...counts, total, pct };
        } catch { return { ...s, present:0, absent:0, leave:0, late:0, total:0, pct:0 }; }
      }));
      setMonthRows(rows);
      setIsLiveDB(true);
    } catch (err) {
      toast.error('Could not load monthly data: ' + (err.message));
      setMonthRows([]);
    } finally { setLoading(false); }
  }, [clsId, cls, monthYear]);

  // Load when tab/filters change
  useEffect(() => {
    if (tab === 0) loadDateReport();
    if (tab === 1) loadSummaryReport();
  }, [tab, date, clsId, loadDateReport, loadSummaryReport]);

  // Summary counts from date rows
  const counts = { present:0, absent:0, leave:0, late:0, unmarked:0 };
  dateRows.forEach(r => { if (r.status && counts[r.status]!==undefined) counts[r.status]++; else counts.unmarked++; });
  const total = dateRows.length;

  const handleCsvTab0 = () => {
    downloadCSV('Attendance_' + date + '_' + (cls||'All') + '.csv',
      ['Adm No','Name','Class','Section','Status','Date'],
      dateRows.map(r => [r.admission_no, ((r.first_name||'')+' '+(r.last_name||'')).trim(), r.class_name||'', r.section_name||'', r.status||'not marked', date])
    );
  };

  const handleCsvTab1 = () => {
    downloadCSV('ClassSummary_' + date + '.csv',
      ['Class','Total','Present','Absent','Leave','Late','Not Marked'],
      summaryRows.map(r => [r.class_name, r.total_students, r.present, r.absent, r.leave, r.late, r.not_marked])
    );
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Attendance Report</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {isLiveDB
              ? <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live data from PostgreSQL</span>
              : <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>⚠️ Connect backend to see real data</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {tab===0 && <button onClick={handleCsvTab0} style={{padding:'8px 16px',border:'1.5px solid #1E40AF',borderRadius:9,background:'#DBEAFE',color:'#1E40AF',fontSize:12,fontWeight:700,cursor:'pointer'}}>📥 Download CSV</button>}
          {tab===1 && <button onClick={handleCsvTab1} style={{padding:'8px 16px',border:'1.5px solid #1E40AF',borderRadius:9,background:'#DBEAFE',color:'#1E40AF',fontSize:12,fontWeight:700,cursor:'pointer'}}>📥 Download CSV</button>}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'flex-end'}}>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'}}>{tab===2?'Month':'Date'}</label>
          {tab===2
            ? <input type="month" value={monthYear} onChange={e=>setMonthYear(e.target.value)} style={inp}/>
            : <input type="date"  value={date}      onChange={e=>setDate(e.target.value)}       style={inp}/>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'}}>Class</label>
          <select value={cls} onChange={e=>{
            const opt = e.target.options[e.target.selectedIndex];
            setCls(e.target.value); setClsId(opt.getAttribute('data-id')||'');
          }} style={{...inp,minWidth:140}}>
            <option value="" data-id="">All Classes</option>
            {classList.map(c=><option key={c.id} value={c.name} data-id={c.id}>{c.name}</option>)}
          </select>
        </div>
        {tab===2 && <button onClick={loadMonthlyReport} disabled={loading}
          style={{alignSelf:'flex-end',padding:'9px 18px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          {loading?'⏳ Loading…':'📊 Generate Report'}
        </button>}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:0,borderBottom:'2px solid #E5E7EB'}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{padding:'10px 20px',border:'none',borderBottom:tab===i?'2px solid #1E1B4B':'2px solid transparent',background:'transparent',color:tab===i?'#1E1B4B':'#6B7280',fontSize:13,fontWeight:tab===i?700:500,cursor:'pointer',marginBottom:-2,whiteSpace:'nowrap'}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:'0 0 14px 14px',overflow:'hidden',marginTop:0}}>

        {/* ── TAB 0: Date-wise student list ── */}
        {tab===0 && <>
          {/* Summary bar */}
          <div style={{display:'flex',gap:12,padding:'12px 16px',background:'#F9FAFB',borderBottom:'1px solid #E5E7EB',flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:700,color:'#374151'}}>{date} · {total} students</span>
            {Object.entries(S).map(([k,v])=>(
              <span key={k} style={{padding:'3px 10px',borderRadius:20,background:v.bg,color:v.c,fontSize:11,fontWeight:700}}>{v.label}: {counts[k]||0}</span>
            ))}
            {counts.unmarked>0&&<span style={{padding:'3px 10px',borderRadius:20,background:'#F3F4F6',color:'#6B7280',fontSize:11,fontWeight:700}}>Not marked: {counts.unmarked}</span>}
          </div>
          {loading ? <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div> :
          dateRows.length===0 ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
            <div style={{fontSize:36,marginBottom:8}}>📋</div>
            <div style={{fontWeight:600,color:'#6B7280'}}>No data for {date}</div>
            <div style={{fontSize:12,marginTop:4}}>Go to Mark Attendance and save attendance for this date first</div>
          </div> :
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr>{['Adm No','Student','Class','Section','Status','Remarks'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {dateRows.map((r,i)=>{
                const name=((r.first_name||'')+' '+(r.last_name||'')).trim();
                const st=S[r.status];
                return <tr key={r.student_id||i} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{r.admission_no}</td>
                  <td style={{...td,fontWeight:600}}>{name}</td>
                  <td style={td}>{r.class_name||'—'}</td>
                  <td style={td}>{r.section_name||'—'}</td>
                  <td style={td}>
                    {r.status
                      ? <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.c}}>{st.label}</span>
                      : <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,background:'#F3F4F6',color:'#9CA3AF'}}>Not marked</span>}
                  </td>
                  <td style={{...td,color:'#6B7280'}}>{r.remarks||'—'}</td>
                </tr>;
              })}
            </tbody>
          </table>}
        </>}

        {/* ── TAB 1: Class summary ── */}
        {tab===1 && <>
          {loading ? <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div> :
          summaryRows.length===0 ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
            <div style={{fontSize:36,marginBottom:8}}>📊</div>
            <div style={{fontWeight:600,color:'#6B7280'}}>No class data for {date}</div>
            <div style={{fontSize:12,marginTop:4}}>Mark and save attendance for this date first</div>
          </div> :
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr>{['Class','Total','Present','Absent','Leave','Late','Not Marked','% Present'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {summaryRows.map((r,i)=>{
                const pct = r.total_students>0 ? Math.round((r.present/r.total_students)*100) : 0;
                return <tr key={r.class_id||i} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{...td,fontWeight:700,color:'#1E1B4B'}}>{r.class_name}</td>
                  <td style={{...td,fontWeight:700}}>{r.total_students}</td>
                  <td style={{...td}}><span style={{color:'#065F46',fontWeight:700}}>{r.present}</span></td>
                  <td style={{...td}}><span style={{color:'#991B1B',fontWeight:700}}>{r.absent}</span></td>
                  <td style={{...td}}><span style={{color:'#92400E',fontWeight:700}}>{r.leave}</span></td>
                  <td style={{...td}}><span style={{color:'#5B21B6',fontWeight:700}}>{r.late}</span></td>
                  <td style={{...td,color:'#9CA3AF'}}>{r.not_marked}</td>
                  <td style={td}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:8,background:'#F3F4F6',borderRadius:4}}>
                        <div style={{width:pct+'%',height:'100%',background:pct>=75?'#10B981':pct>=50?'#F59E0B':'#EF4444',borderRadius:4,transition:'width .4s'}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:pct>=75?'#065F46':pct>=50?'#92400E':'#991B1B',minWidth:32}}>{pct}%</span>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>}
        </>}

        {/* ── TAB 2: Monthly overview ── */}
        {tab===2 && <>
          {loading ? <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Generating monthly report…</div> :
          monthRows.length===0 ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
            <div style={{fontSize:36,marginBottom:8}}>📅</div>
            <div style={{fontWeight:600,color:'#6B7280'}}>Select a class and click Generate Report</div>
            <div style={{fontSize:12,marginTop:4}}>Shows monthly attendance per student</div>
          </div> :
          <>
            <div style={{padding:'10px 16px',background:'#F9FAFB',borderBottom:'1px solid #E5E7EB',fontSize:12,fontWeight:700,color:'#374151'}}>
              {cls} · {monthYear} · {monthRows.length} students
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Adm No','Student','Present','Absent','Leave','Late','Total Days','% Attendance'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {monthRows.map((r,i)=>{
                  const name=((r.first_name||'')+' '+(r.last_name||'')).trim();
                  const color = r.pct>=75?'#065F46':r.pct>=50?'#92400E':'#991B1B';
                  return <tr key={r.id||i} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{r.admission_no}</td>
                    <td style={{...td,fontWeight:600}}>{name}</td>
                    <td style={{...td}}><span style={{color:'#065F46',fontWeight:700}}>{r.present}</span></td>
                    <td style={{...td}}><span style={{color:'#991B1B',fontWeight:700}}>{r.absent}</span></td>
                    <td style={{...td}}><span style={{color:'#92400E',fontWeight:700}}>{r.leave}</span></td>
                    <td style={{...td}}><span style={{color:'#5B21B6',fontWeight:700}}>{r.late}</span></td>
                    <td style={{...td,color:'#6B7280'}}>{r.total}</td>
                    <td style={td}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:8,background:'#F3F4F6',borderRadius:4}}>
                          <div style={{width:r.pct+'%',height:'100%',background:color,borderRadius:4}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color,minWidth:32}}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'flex-end',padding:12,borderTop:'0.5px solid #E5E7EB'}}>
              <button onClick={()=>{
                downloadCSV('Monthly_'+cls+'_'+monthYear+'.csv',
                  ['Adm No','Name','Present','Absent','Leave','Late','Total','% Attendance'],
                  monthRows.map(r=>[r.admission_no,((r.first_name||'')+' '+(r.last_name||'')).trim(),r.present,r.absent,r.leave,r.late,r.total,r.pct+'%'])
                );
              }} style={{padding:'8px 16px',border:'1.5px solid #1E40AF',borderRadius:9,background:'#DBEAFE',color:'#1E40AF',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                📥 Download CSV
              </button>
            </div>
          </>}
        </>}

      </div>
    </div>
  );
}
