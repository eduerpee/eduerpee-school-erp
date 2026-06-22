import React, { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const tcAPI = {
  getAll:  ()      => api.get('/tc'),
  create:  (d)     => api.post('/tc', d),
  update:  (id, d) => api.put('/tc/'+id, d),
  delete:  (id)    => api.delete('/tc/'+id),
};

const inp  = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl  = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

function printTC(tc, school) {
  const today = new Date(tc.issue_date||Date.now());
  const dateStr = today.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const name = ((tc.first_name||'')+' '+(tc.last_name||'')).trim();
  const dob  = tc.date_of_birth ? new Date(tc.date_of_birth).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—';

  const win = window.open('','_blank','width=800,height=900');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Transfer Certificate</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Times New Roman',serif;background:#f0f0f0;display:flex;flex-direction:column;align-items:center;padding:20px;}
.page{width:700px;background:#fff;border:2px solid #1a3a2a;overflow:hidden;}
.top-bar{height:14px;background:#1a3a2a;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.top-bar::after{content:'';position:absolute;top:3px;left:0;right:0;height:8px;background:#c8a200;}
.header{padding:16px 28px 12px;display:flex;align-items:center;gap:16px;border-bottom:2px solid #1a3a2a;}
.logo-area{flex-shrink:0;width:70px;height:70px;display:flex;align-items:center;justify-content:center;}
.school-info{flex:1;text-align:center;}
.school-name{font-size:19px;font-weight:900;color:#1a3a2a;letter-spacing:.02em;text-transform:uppercase;}
.school-addr{font-size:11px;color:#555;margin-top:3px;}
.tc-title-bar{background:#1a3a2a;padding:7px 0;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.tc-title{font-size:19px;font-weight:700;color:#c8a200;letter-spacing:.1em;font-family:'Times New Roman',serif;font-style:italic;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.serial-date{display:flex;justify-content:space-between;padding:9px 28px;background:#f9f6ee;font-size:12px;border-bottom:1px solid #ddd;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.body{padding:18px 28px;}
.field-row{display:flex;margin-bottom:10px;align-items:baseline;gap:8px;}
.field-label{font-size:12px;color:#1a3a2a;font-weight:700;min-width:215px;flex-shrink:0;}
.field-dots{flex:1;border-bottom:1px dotted #888;min-height:17px;padding-bottom:1px;}
.field-value{font-size:12.5px;font-weight:600;color:#111;padding:0 4px;}
.para{font-size:12px;line-height:1.85;color:#222;margin:12px 0;text-align:justify;}
.sign-row{display:flex;justify-content:space-between;gap:20px;margin-top:28px;}
.sign-box{flex:1;text-align:center;padding-top:36px;border-top:1px solid #333;font-size:11px;font-weight:700;color:#1a3a2a;text-transform:uppercase;}
.bottom-bar{height:14px;background:#1a3a2a;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.bottom-bar::after{content:'';position:absolute;top:3px;left:0;right:0;height:8px;background:#c8a200;}
.watermark{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(26,58,42,.03);font-weight:900;letter-spacing:8px;pointer-events:none;white-space:nowrap;}
.content{position:relative;}
@media print{
  @page{size:A4;margin:6mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
  body{background:#fff!important;padding:0!important;margin:0!important;}
  .page{border:1.5px solid #1a3a2a!important;width:100%!important;max-width:100%!important;}
  .noprint{display:none!important;}
}
</style></head><body>
<div class="page">
  <div class="top-bar"></div>
  <div class="header">
    <div class="logo-area">
      ${school.logo
        ? `<img src="${school.logo}" style="max-width:70px;max-height:70px;object-fit:contain"/>`
        : `<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#1a3a2a"/><text x="30" y="36" text-anchor="middle" font-size="22" font-weight="900" fill="#c8a200" font-family="serif">${(school.schoolName||'S')[0]}</text></svg>`}
    </div>
    <div class="school-info">
      <div class="school-name">${school.schoolName||'School Name'}</div>
      <div class="school-addr">${[school.address, school.city, school.state].filter(Boolean).join(', ')}</div>
      ${school.phone ? `<div class="school-addr">Ph: ${school.phone}${school.email?' | '+school.email:''}</div>` : ''}
    </div>
  </div>
  <div class="tc-title-bar">
    <div class="tc-title">School Transfer Certificate</div>
  </div>
  <div class="serial-date">
    <span><strong>TC No:</strong> ${tc.tc_no}</span>
    <span><strong>Date of Issue:</strong> ${dateStr}</span>
  </div>
  <div class="body" style="position:relative;">
    <div class="watermark">ORIGINAL</div>
    <div class="content">
      <div class="field-row"><span class="field-label">1. Name of Student</span><span class="field-dots"><span class="field-value">${name}</span></span></div>
      <div class="field-row"><span class="field-label">2. Mother's / Father's Name</span><span class="field-dots"><span class="field-value">${tc.parent_name||'—'}</span></span></div>
      <div class="field-row"><span class="field-label">3. Nationality</span><span class="field-dots"><span class="field-value">Indian</span></span></div>
      <div class="field-row"><span class="field-label">4. Date of Birth (in words)</span><span class="field-dots"><span class="field-value">${dob}</span></span></div>
      <div class="field-row"><span class="field-label">5. Class in which studied</span><span class="field-dots"><span class="field-value">${tc.class_name||tc.leaving_class||'—'}${tc.section_name?' – Section '+tc.section_name:''}</span></span></div>
      <div class="field-row"><span class="field-label">6. School / Board Exam appeared</span><span class="field-dots"><span class="field-value">${tc.last_exam_class||'—'}</span></span></div>
      <div class="field-row"><span class="field-label">7. Whether passed the last exam</span><span class="field-dots"><span class="field-value">${tc.last_exam_result||'Passed'}</span></span></div>
      <div class="field-row"><span class="field-label">8. Date of leaving school</span><span class="field-dots"><span class="field-value">${tc.leaving_date ? new Date(tc.leaving_date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : dateStr}</span></span></div>
      <div class="field-row"><span class="field-label">9. Reason for leaving</span><span class="field-dots"><span class="field-value">${tc.reason||"Parent's request"}</span></span></div>
      <div class="field-row"><span class="field-label">10. General Conduct</span><span class="field-dots"><span class="field-value">${tc.conduct||'Good'}</span></span></div>
      <div class="field-row"><span class="field-label">11. All dues paid</span><span class="field-dots"><span class="field-value">${tc.fee_paid !== false ? 'Yes' : 'No'}</span></span></div>
      ${tc.remarks ? `<div class="field-row"><span class="field-label">12. Remarks</span><span class="field-dots"><span class="field-value">${tc.remarks}</span></span></div>` : ''}

      <div class="para">
        This is to certify that <strong>${name}</strong>, ${tc.gender==='female'?'daughter':'son'} of
        <strong>${tc.parent_name||'—'}</strong>, was a bonafide student of this school.
        ${tc.gender==='female'?'She':'He'} has passed all the school examinations conducted during
        ${tc.last_exam_year||new Date().getFullYear()} academic year.
        ${tc.gender==='female'?'Her':'His'} conduct and character were <strong>${tc.conduct||'Good'}</strong>
        throughout ${tc.gender==='female'?'her':'his'} stay at this institution.
        ${tc.gender==='female'?'She':'He'} is hereby granted this Transfer Certificate to facilitate
        ${tc.gender==='female'?'her':'his'} admission to another school/institution.
      </div>

      <div class="sign-row" style="display:flex;justify-content:space-between;gap:20px;margin-top:28px;">
        <div class="sign-box">Class Teacher</div>
        <div class="sign-box">Head Teacher / Vice Principal</div>
        <div class="sign-box">Principal<br/><span style="font-size:9px;color:#555">${school.schoolName||''}</span></div>
      </div>
    </div>
  </div>
  <div class="bottom-bar"></div>
</div>
<div class="noprint" style="text-align:center;margin-top:14px">
  <button onclick="window.print()" style="padding:10px 28px;background:#1a3a2a;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px">🖨️ Print TC</button>
  <button onclick="window.close()" style="padding:10px 18px;background:#E5E7EB;color:#374151;border:none;border-radius:8px;cursor:pointer">✕ Close</button>
</div>
</body></html>`);
  win.document.close();
}

export default function TransferCertificate() {
  const [tcs,       setTcs]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [stuSearch, setStuSearch] = useState('');
  const [stuList,   setStuList]   = useState([]);
  const [selStu,    setSelStu]    = useState(null);
  const [school,    setSchool]    = useState({});
  const [form, setForm] = useState({
    leavingDate:    new Date().toISOString().split('T')[0],
    leavingClass:   '',
    reason:         "Parent's request",
    conduct:        'Good',
    lastExamClass:  '',
    lastExamYear:   String(new Date().getFullYear()),
    lastExamResult: 'Passed',
    feePaid:        true,
    remarks:        '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await tcAPI.getAll(); setTcs(r.data.data||[]); }
    catch { toast.error('Failed to load TCs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    try { setSchool(JSON.parse(localStorage.getItem('school_settings'))||{}); } catch {}
  }, [load]);

  // Student search for form
  useEffect(() => {
    if (stuSearch.length < 2) { setStuList([]); return; }
    studentAPI.getAll({ search: stuSearch, limit:10 })
      .then(r => setStuList(r.data.data||[]))
      .catch(()=>{});
  }, [stuSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selStu) { toast.error('Please select a student'); return; }
    setSaving(true);
    try {
      await tcAPI.create({
        studentId:      selStu.id,
        leavingDate:    form.leavingDate,
        leavingClass:   form.leavingClass || selStu.class_name,
        reason:         form.reason,
        conduct:        form.conduct,
        lastExamClass:  form.lastExamClass || selStu.class_name,
        lastExamYear:   form.lastExamYear,
        lastExamResult: form.lastExamResult,
        feePaid:        form.feePaid,
        remarks:        form.remarks||undefined,
      });
      toast.success('✅ Transfer Certificate issued!');
      setShowForm(false); setSelStu(null); setStuSearch('');
      load();
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (tc) => {
    if (!window.confirm(`Delete TC ${tc.tc_no}? This cannot be undone.`)) return;
    try { await tcAPI.delete(tc.id); toast.success('TC deleted'); load(); }
    catch(err) { toast.error(err.response?.data?.message || err.message); }
  };

  const filtered = tcs.filter(tc =>
    !search || [tc.tc_no, tc.first_name, tc.last_name, tc.admission_no, tc.class_name]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Transfer Certificate</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {tcs.length} certificates issued &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        <button onClick={()=>setShowForm(true)}
          style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>
          + Issue TC
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search by TC No., student name, class…"
        style={{...inp,width:340,marginBottom:16}}/>

      {/* TC List */}
      {loading ? (
        <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:64,textAlign:'center',background:'#F9FAFB',borderRadius:14,border:'2px dashed #E5E7EB'}}>
          <div style={{fontSize:48,marginBottom:10}}>📄</div>
          <div style={{fontWeight:700,color:'#374151',fontSize:15}}>No Transfer Certificates</div>
          <div style={{fontSize:12,color:'#9CA3AF',marginTop:4}}>Click "+ Issue TC" to generate one</div>
        </div>
      ) : (
        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#F9FAFB'}}>
                {['TC No.','Student','Class','Issue Date','Leaving Date','Conduct','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tc => (
                <tr key={tc.id}
                  onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#1E1B4B'}}>{tc.tc_no}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {tc.photo_url
                        ? <img src={tc.photo_url} style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                        : <div style={{width:30,height:30,borderRadius:'50%',background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#1E1B4B',flexShrink:0}}>{(tc.first_name||'?')[0]}</div>}
                      <div>
                        <div style={{fontWeight:600,color:'#111827'}}>{tc.first_name} {tc.last_name||''}</div>
                        <div style={{fontSize:10,color:'#9CA3AF'}}>{tc.admission_no}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'11px 14px',color:'#6B7280'}}>{tc.class_name||'—'}{tc.section_name?' – '+tc.section_name:''}</td>
                  <td style={{padding:'11px 14px',color:'#6B7280',whiteSpace:'nowrap'}}>{tc.issue_date ? new Date(tc.issue_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{padding:'11px 14px',color:'#6B7280',whiteSpace:'nowrap'}}>{tc.leaving_date ? new Date(tc.leaving_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{padding:'11px 14px'}}>
                    <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,
                      background:tc.conduct==='Excellent'?'#D1FAE5':tc.conduct==='Good'?'#DBEAFE':'#FEF3C7',
                      color:tc.conduct==='Excellent'?'#065F46':tc.conduct==='Good'?'#1E40AF':'#92400E'}}>
                      {tc.conduct}
                    </span>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:'#D1FAE5',color:'#065F46'}}>
                      {tc.status||'issued'}
                    </span>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>printTC(tc, school)}
                        style={{padding:'5px 12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                        🖨️ Print
                      </button>
                      <button onClick={()=>{
                        const msg = `📄 *Transfer Certificate*\n\nTC No: ${tc.tc_no}\nStudent: ${tc.first_name} ${tc.last_name||''}\nClass: ${tc.class_name||'—'}\nDate of Leaving: ${tc.leaving_date?new Date(tc.leaving_date).toLocaleDateString('en-IN'):'—'}\nConduct: ${tc.conduct}\n\nFor any queries, contact ${school.schoolName||'the school'}.`;
                        const phone = (tc.parent_phone||'').replace(/\D/g,'');
                        window.open('https://wa.me/91'+phone+'?text='+encodeURIComponent(msg),'_blank');
                      }}
                        style={{padding:'5px 12px',background:'#25D366',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                        💬
                      </button>
                      <button onClick={()=>handleDelete(tc)}
                        style={{padding:'5px 10px',border:'1px solid #FEE2E2',borderRadius:7,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer'}}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ISSUE TC MODAL ── */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:580,maxHeight:'92vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div style={{fontWeight:700,fontSize:15}}>📄 Issue Transfer Certificate</div>
              <button onClick={()=>{setShowForm(false);setSelStu(null);setStuSearch('');}} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{padding:20}}>
              {/* Student Search */}
              <div style={{marginBottom:14,padding:14,background:'#F9FAFB',borderRadius:10}}>
                <label style={lbl}>Select Student *</label>
                {selStu ? (
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#EDE9F8',borderRadius:9,border:'1.5px solid #7C3AED'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {selStu.photo_url
                        ? <img src={selStu.photo_url} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>
                        : <div style={{width:36,height:36,borderRadius:'50%',background:'#1E1B4B',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>{(selStu.first_name||'?')[0]}</div>}
                      <div>
                        <div style={{fontWeight:700,color:'#1E1B4B'}}>{selStu.first_name} {selStu.last_name||''}</div>
                        <div style={{fontSize:11,color:'#6B7280'}}>{selStu.admission_no} · {selStu.class_name||'—'}</div>
                      </div>
                    </div>
                    <button type="button" onClick={()=>{setSelStu(null);setStuSearch('');}}
                      style={{background:'none',border:'none',color:'#7C3AED',cursor:'pointer',fontSize:18}}>✕</button>
                  </div>
                ) : (
                  <div style={{position:'relative'}}>
                    <input value={stuSearch} onChange={e=>setStuSearch(e.target.value)}
                      placeholder="Type student name or admission number…" style={inp} autoFocus/>
                    {stuList.length > 0 && (
                      <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:9,boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:10,maxHeight:200,overflowY:'auto'}}>
                        {stuList.map(s=>(
                          <div key={s.id} onClick={()=>{setSelStu(s);setStuSearch('');setStuList([]);
                            setForm(p=>({...p,leavingClass:s.class_name||'',lastExamClass:s.class_name||''}));
                          }}
                            style={{padding:'10px 14px',cursor:'pointer',borderBottom:'0.5px solid #F3F4F6',display:'flex',alignItems:'center',gap:10}}
                            onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'}
                            onMouseLeave={e=>e.currentTarget.style.background=''}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#1E1B4B',flexShrink:0}}>{(s.first_name||'?')[0]}</div>
                            <div>
                              <div style={{fontWeight:600,color:'#111827'}}>{s.first_name} {s.last_name||''}</div>
                              <div style={{fontSize:11,color:'#9CA3AF'}}>{s.admission_no} · {s.class_name||'—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Date of Leaving *</label>
                  <input type="date" required value={form.leavingDate} onChange={e=>setForm({...form,leavingDate:e.target.value})} style={inp}/>
                </div>
                <div><label style={lbl}>Class at time of leaving</label>
                  <input value={form.leavingClass} onChange={e=>setForm({...form,leavingClass:e.target.value})} style={inp} placeholder="e.g. Class 10"/>
                </div>
              </div>

              {/* Exam */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Last Exam Class</label>
                  <input value={form.lastExamClass} onChange={e=>setForm({...form,lastExamClass:e.target.value})} style={inp} placeholder="e.g. Class 10"/>
                </div>
                <div><label style={lbl}>Exam Year</label>
                  <input value={form.lastExamYear} onChange={e=>setForm({...form,lastExamYear:e.target.value})} style={inp} placeholder="2025-26"/>
                </div>
                <div><label style={lbl}>Result</label>
                  <select value={form.lastExamResult} onChange={e=>setForm({...form,lastExamResult:e.target.value})} style={inp}>
                    <option>Passed</option>
                    <option>Promoted</option>
                    <option>Failed</option>
                    <option>Appeared</option>
                    <option>Not Appeared</option>
                  </select>
                </div>
              </div>

              {/* Conduct + Reason */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>General Conduct</label>
                  <select value={form.conduct} onChange={e=>setForm({...form,conduct:e.target.value})} style={inp}>
                    {['Excellent','Very Good','Good','Satisfactory'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Reason for Leaving</label>
                  <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={inp}>
                    {["Parent's request","Transfer of Parents","Admission in other school","Course completed","Other"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Fee + Remarks */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>All Dues Cleared</label>
                  <select value={form.feePaid?'yes':'no'} onChange={e=>setForm({...form,feePaid:e.target.value==='yes'})} style={inp}>
                    <option value="yes">Yes — All dues paid</option>
                    <option value="no">No — Dues pending</option>
                  </select>
                </div>
                <div><label style={lbl}>Remarks (optional)</label>
                  <input value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} style={inp} placeholder="Any special note"/>
                </div>
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>{setShowForm(false);setSelStu(null);setStuSearch('');}}
                  style={{padding:'10px 18px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving||!selStu}
                  style={{padding:'10px 24px',background:saving||!selStu?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:!selStu?'not-allowed':'pointer'}}>
                  {saving ? '⏳ Issuing…' : '📄 Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
