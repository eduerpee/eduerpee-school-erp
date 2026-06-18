import React, { useState, useEffect, useCallback } from 'react';
import { noticeAPI, studentAPI, employeeAPI, schoolAPI } from '../services/api';
import toast from 'react-hot-toast';

const TYPES = ['general','circular','event','holiday','urgent'];
const TYPE_COLORS = {
  general:  ['#F3F4F6','#374151'],
  circular: ['#DBEAFE','#1E40AF'],
  event:    ['#EDE9F8','#5B21B6'],
  holiday:  ['#D1FAE5','#065F46'],
  urgent:   ['#FEE2E2','#991B1B'],
};
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

function printNotice(notice) {
  const school = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
  const today  = new Date(notice.publish_date||Date.now()).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
  const win = window.open('','_blank','width=700,height=700');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Notice</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Times New Roman',serif;background:#fff;padding:30px;display:flex;justify-content:center;}
.card{width:640px;border:2px solid #333;border-radius:12px;padding:30px 36px;}
.logo-row{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px;}
.logo{width:60px;height:60px;object-fit:contain;}
.school-info{text-align:center;}
.sname{font-size:16px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
.saddr{font-size:11px;color:#555;margin-top:2px;}
.divider{border:none;border-top:2px solid #333;margin:12px 0;}
.title-row{text-align:center;margin-bottom:16px;}
.title-row h2{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;}
.title-row h3{font-size:14px;font-weight:700;margin-top:4px;}
.meta{display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:18px;}
.content{font-size:13px;line-height:1.9;text-align:justify;margin-bottom:20px;}
.sign{margin-top:24px;font-size:13px;}
.sign-line{margin-top:6px;}
@media print{@page{size:A4;margin:10mm;}body{padding:0;}button{display:none!important;}}
</style></head><body>
<div class="card">
  <div class="logo-row">
    ${school.logo?`<img src="${school.logo}" class="logo" onerror="this.style.display='none'"/>`:''}
    <div class="school-info">
      <div class="sname">${school.schoolName||'School Name'}</div>
      <div class="saddr">${[school.address,school.city,school.state].filter(Boolean).join(', ')}</div>
    </div>
  </div>
  <hr class="divider"/>
  <div class="title-row">
    <h2>${school.schoolName||'School'}</h2>
    <h3>NOTICE</h3>
  </div>
  <div class="meta">
    <span>Ref No: ${notice.id?.slice(-8).toUpperCase()||'—'}</span>
    <span>DATE: ${today}</span>
  </div>
  <div class="content">${(notice.content||'').replace(/\n/g,'<br/>')}</div>
  <div style="text-align:center;color:#c0392b;font-family:'Western',serif;font-weight:700;font-size:14px;margin:10px 0;font-style:italic">
    ${notice.notice_type==='holiday'?'We Wish You A Very Happy Holiday!':''}
  </div>
  <div class="sign">
    <div>Sd/--</div>
    <div class="sign-line" style="font-weight:700;text-transform:uppercase;">PRINCIPAL</div>
    <div style="font-size:11px;color:#555;">${school.schoolName||''}</div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);}</script>
</body></html>`);
  win.document.close();
}

function sendWhatsAppNotice(notice, phones) {
  const school = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
  const today  = new Date(notice.publish_date||Date.now()).toLocaleDateString('en-IN');
  const msg = `🏫 *${school.schoolName||'School'} - Notice*\n\n` +
    `📢 *${notice.title}*\n` +
    `Date: ${today}\n\n` +
    `${notice.content||''}\n\n` +
    `_Thank you_`;
  // Open WhatsApp for first phone, copy message for rest
  if (phones.length === 0) { toast.error('No phone numbers found'); return; }
  const encoded = encodeURIComponent(msg);
  phones.slice(0,1).forEach(p => {
    const num = p.replace(/\D/g,'');
    if (num) window.open(`https://wa.me/91${num}?text=${encoded}`, '_blank');
  });
  if (phones.length > 1) {
    navigator.clipboard.writeText(decodeURIComponent(encoded)).catch(()=>{});
    toast.success(`WhatsApp opened for 1 recipient. Message copied for ${phones.length-1} more.`, {duration:4000});
  }
}

export default function Notices() {
  const [notices,     setNotices]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [editNotice,  setEditNotice]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [filterType,  setFilterType]  = useState('');
  const [form,        setForm]        = useState({ title:'', content:'', type:'general', expiryDate:'' });
  const [showWA,      setShowWA]      = useState(null); // notice for WA send
  const [students,    setStudents]    = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [waTarget,    setWaTarget]    = useState('all'); // all/students/employees/class
  const [waClass,     setWaClass]     = useState('');
  const [classes,     setClasses]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await noticeAPI.getAll({ limit:100, type: filterType||undefined });
      setNotices(res.data.data || []);
    } catch (err) {
      setError('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  // Load contacts for WhatsApp
  useEffect(() => {
    if (showWA) {
      studentAPI.getAll({ limit:500 }).then(r => setStudents(r.data.data||[])).catch(()=>{});
      employeeAPI.getAll({ limit:200 }).then(r => setEmployees(r.data.data||[])).catch(()=>{});
      schoolAPI.getClasses().then(r => setClasses(r.data.data||[])).catch(()=>{});
    }
  }, [showWA]);

  const openEdit = (n) => {
    setForm({ title:n.title, content:n.content, type:n.notice_type, expiryDate:n.expiry_date?String(n.expiry_date).split('T')[0]:'' });
    setEditNotice(n);
    setShowAdd(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { title:form.title, content:form.content, noticeType:form.type, expiryDate:form.expiryDate||undefined };
      if (editNotice) {
        await noticeAPI.update(editNotice.id, payload);
        toast.success('✅ Notice updated!');
      } else {
        await noticeAPI.create(payload);
        toast.success('✅ Notice published!');
      }
      setShowAdd(false); setEditNotice(null);
      setForm({ title:'', content:'', type:'general', expiryDate:'' });
      load();
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this notice?')) return;
    try { await noticeAPI.delete(id); toast.success('Notice removed'); load(); }
    catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleSendWA = () => {
    let phones = [];
    if (waTarget === 'all' || waTarget === 'students') {
      const filtered = waClass ? students.filter(s=>s.class_name===waClass) : students;
      phones.push(...filtered.map(s=>s.parent_phone).filter(Boolean));
    }
    if (waTarget === 'all' || waTarget === 'employees') {
      phones.push(...employees.map(e=>e.phone).filter(Boolean));
    }
    phones = [...new Set(phones)];
    sendWhatsAppNotice(showWA, phones);
    setShowWA(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Notice Board</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {notices.length} notices &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        <button onClick={()=>{setEditNotice(null);setForm({title:'',content:'',type:'general',expiryDate:''});setShowAdd(true);}}
          style={{padding:'9px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          📢 Post Notice
        </button>
      </div>

      {error && <div style={{padding:'12px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,color:'#DC2626',fontSize:13,marginBottom:16}}>❌ {error}</div>}

      {/* Filter */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {['', ...TYPES].map(t=>(
          <button key={t||'all'} onClick={()=>setFilterType(t)}
            style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid '+(filterType===t?'#1E1B4B':'#E5E7EB'),background:filterType===t?'#1E1B4B':'#fff',color:filterType===t?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
            {t||'All'}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {loading
        ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div>
        : notices.length === 0
          ? <div style={{padding:64,textAlign:'center',background:'#F9FAFB',borderRadius:14,border:'2px dashed #E5E7EB'}}>
              <div style={{fontSize:48,marginBottom:12}}>📢</div>
              <div style={{fontWeight:700,color:'#374151',fontSize:15}}>No notices yet</div>
            </div>
          : <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {notices.map(n => {
                const [bg, color] = TYPE_COLORS[n.notice_type] || TYPE_COLORS.general;
                return (
                  <div key={n.id} style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:'14px 18px'}}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <span style={{padding:'4px 10px',background:bg,color,borderRadius:20,fontSize:10,fontWeight:800,textTransform:'uppercase',flexShrink:0,marginTop:2}}>
                        {n.notice_type}
                      </span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:'#111827',marginBottom:4}}>{n.title}</div>
                        <div style={{fontSize:12,color:'#6B7280',lineHeight:1.6,marginBottom:6,whiteSpace:'pre-line'}}>{n.content}</div>
                        <div style={{fontSize:11,color:'#9CA3AF',display:'flex',gap:16,flexWrap:'wrap'}}>
                          <span>📅 {new Date(n.publish_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                          {n.posted_by_name && <span>👤 {n.posted_by_name}</span>}
                          {n.expiry_date && <span>⏰ Expires: {new Date(n.expiry_date).toLocaleDateString('en-IN')}</span>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button onClick={()=>printNotice(n)}
                          style={{padding:'5px 11px',border:'1px solid #E5E7EB',borderRadius:7,background:'#EDE9F8',color:'#1E1B4B',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          🖨️ Print
                        </button>
                        <button onClick={()=>setShowWA(n)}
                          style={{padding:'5px 11px',border:'1px solid #E5E7EB',borderRadius:7,background:'#D1FAE5',color:'#065F46',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          💬 WhatsApp
                        </button>
                        <button onClick={()=>openEdit(n)}
                          style={{padding:'5px 11px',border:'1px solid #E5E7EB',borderRadius:7,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          ✏️ Edit
                        </button>
                        <button onClick={()=>handleDelete(n.id)}
                          style={{padding:'5px 11px',border:'1px solid #FEE2E2',borderRadius:7,background:'#FFF5F5',color:'#DC2626',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      }

      {/* ── POST / EDIT NOTICE MODAL ── */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:580,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>{editNotice?'✏️ Edit Notice':'📢 Post Notice'}</div>
              <button onClick={()=>{setShowAdd(false);setEditNotice(null);}} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{padding:20}}>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Title *</label>
                <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Notice title" style={inp} autoFocus/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Content *</label>
                <textarea required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}
                  placeholder="Notice content…" rows={6} style={{...inp,resize:'vertical',lineHeight:1.7}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={lbl}>Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
                    {TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Expiry Date (optional)</label>
                  <input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} style={inp}/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>{setShowAdd(false);setEditNotice(null);}}
                  style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {saving?'⏳ Saving…':editNotice?'💾 Update Notice':'📢 Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WHATSAPP SEND MODAL ── */}
      {showWA && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F0FDF4'}}>
              <div style={{fontWeight:700,fontSize:15,color:'#065F46'}}>💬 Send via WhatsApp</div>
              <button onClick={()=>setShowWA(null)} style={{background:'#E5E7EB',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:15}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{padding:'10px 14px',background:'#EDE9F8',borderRadius:10,marginBottom:16,fontSize:12}}>
                <div style={{fontWeight:700,color:'#1E1B4B'}}>{showWA.title}</div>
                <div style={{color:'#6B7280',marginTop:2,fontSize:11}}>{showWA.notice_type} · {new Date(showWA.publish_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Send To</label>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[['all','👥 All (Students + Employees)'],['students','👦 Students (Parent Numbers)'],['employees','👤 Employees Only']].map(([val,label])=>(
                    <label key={val} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 12px',border:'1.5px solid '+(waTarget===val?'#1E1B4B':'#E5E7EB'),borderRadius:9,background:waTarget===val?'#EDE9F8':'#fff'}}>
                      <input type="radio" value={val} checked={waTarget===val} onChange={()=>setWaTarget(val)} style={{accentColor:'#1E1B4B'}}/>
                      <span style={{fontSize:13,fontWeight:waTarget===val?700:500}}>{label}</span>
                      <span style={{marginLeft:'auto',fontSize:11,color:'#9CA3AF'}}>
                        {val==='all'?students.length+employees.length:val==='students'?students.length:employees.length} contacts
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {(waTarget==='all'||waTarget==='students') && (
                <div style={{marginBottom:14}}>
                  <label style={lbl}>Filter by Class (optional)</label>
                  <select value={waClass} onChange={e=>setWaClass(e.target.value)} style={inp}>
                    <option value="">All Classes</option>
                    {classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{padding:'10px 14px',background:'#FEF3C7',borderRadius:9,marginBottom:16,fontSize:11,color:'#92400E'}}>
                💡 WhatsApp will open for the first number. Message copied to clipboard for bulk sending.
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShowWA(null)} style={{flex:1,padding:'11px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSendWA}
                  style={{flex:2,padding:'11px',background:'#25D366',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  💬 Send WhatsApp Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
