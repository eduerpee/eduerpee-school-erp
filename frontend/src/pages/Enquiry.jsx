import React, { useState, useEffect, useCallback } from 'react';
import { enquiryAPI, registrationAPI, schoolAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  new:       { bg:'#DBEAFE', c:'#1E40AF', label:'🆕 New'       },
  hot:       { bg:'#FEE2E2', c:'#991B1B', label:'🔥 Hot Lead'  },
  warm:      { bg:'#FEF3C7', c:'#92400E', label:'🌡️ Warm Lead' },
  cold:      { bg:'#F3F4F6', c:'#374151', label:'🧊 Cold Lead' },
  converted: { bg:'#D1FAE5', c:'#065F46', label:'✅ Converted' },
};

const SOURCES  = ['walk_in','phone','website','reference','social_media','newspaper'];
const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

const MOCK = [
  { id:'mock1', enquiry_no:'ENQ001', student_name:'Riya Gupta',   parent_name:'Sanjay Gupta',  mobile:'9811001100', email:'', class_interested:'Class 6',  source:'walk_in',   created_at:'2025-06-05', status:'hot',  remarks:'Very interested' },
  { id:'mock2', enquiry_no:'ENQ002', student_name:'Rahul Sharma', parent_name:'Amit Sharma',   mobile:'9822002200', email:'', class_interested:'Class 9',  source:'phone',     created_at:'2025-06-04', status:'warm', remarks:'Wants demo class' },
  { id:'mock3', enquiry_no:'ENQ003', student_name:'Pooja Verma',  parent_name:'Dinesh Verma',  mobile:'9833003300', email:'', class_interested:'Class 7',  source:'reference', created_at:'2025-06-03', status:'hot',  remarks:'Referred by parent' },
  { id:'mock4', enquiry_no:'ENQ004', student_name:'Akash Yadav',  parent_name:'Suresh Yadav',  mobile:'9844004400', email:'', class_interested:'Class 11', source:'website',   created_at:'2025-06-02', status:'cold', remarks:'Just checking' },
  { id:'mock5', enquiry_no:'ENQ005', student_name:'Sneha Pandey', parent_name:'Vijay Pandey',  mobile:'9855005500', email:'', class_interested:'Class 8',  source:'walk_in',   created_at:'2025-06-01', status:'warm', remarks:'Visit requested' },
];

const EMPTY_FORM = { name:'', parent:'', phone:'', email:'', class_:'', source:'walk_in', remarks:'', status:'warm' };

export default function Enquiry() {
  const navigate = useNavigate();
  const [enquiries,   setEnquiries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [isMock,      setIsMock]      = useState(false);
  const [total,       setTotal]       = useState(0);
  const [filter,      setFilter]      = useState('');
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [converting,  setConverting]  = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editForm,    setEditForm]    = useState(EMPTY_FORM);
  const [dbClasses,   setDbClasses]   = useState([]);
  // Follow-up modal
  const [showFollowUp,  setShowFollowUp]  = useState(null); // enquiry object
  const [followUpForm,  setFollowUpForm]  = useState({ date:'', remarks:'' });
  const [savingFollowUp,setSavingFollowUp]= useState(false);

  /* ── Load enquiries ─────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enquiryAPI.getAll({ status: filter||undefined, search: search||undefined, limit:100 });
      setEnquiries(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setIsMock(false);
    } catch {
      let d = [...MOCK];
      if (filter) d = d.filter(e => e.status === filter);
      if (search) d = d.filter(e => e.student_name.toLowerCase().includes(search.toLowerCase()) || e.mobile.includes(search));
      setEnquiries(d); setTotal(d.length); setIsMock(true);
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => {
    load();
    schoolAPI.getClasses().then(r => setDbClasses(r.data.data || [])).catch(()=>{});
  }, [load]);

  /* ── Add new enquiry ────────────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await enquiryAPI.create({ studentName:form.name, parentName:form.parent, mobile:form.phone, email:form.email||undefined, classInterested:form.class_||undefined, source:form.source, remarks:form.remarks||undefined, status:form.status });
      toast.success('✅ Enquiry saved to database!');
      setShowAdd(false); setForm(EMPTY_FORM); load();
    } catch {
      const mock = { id:'mock'+Date.now(), enquiry_no:'ENQ'+String(enquiries.length+1).padStart(3,'0'), student_name:form.name, parent_name:form.parent, mobile:form.phone, email:form.email, class_interested:form.class_, source:form.source, created_at:new Date().toISOString().split('T')[0], status:form.status, remarks:form.remarks };
      setEnquiries(p => [mock,...p]); setIsMock(true);
      toast.success('Enquiry added (demo mode)'); setShowAdd(false); setForm(EMPTY_FORM);
    } finally { setSaving(false); }
  };

  /* ── Open edit mode ─────────────────────────────── */
  const openEdit = (enq) => {
    setEditForm({
      name:    enq.student_name   || '',
      parent:  enq.parent_name    || '',
      phone:   enq.mobile         || '',
      email:   enq.email          || '',
      class_:  enq.class_interested || '',
      source:  enq.source         || 'walk_in',
      remarks: enq.remarks        || '',
      status:  enq.status         || 'warm',
    });
    setEditMode(true);
  };

  /* ── Save edited enquiry ────────────────────────── */
  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const updated = {
      studentName:     editForm.name,
      parentName:      editForm.parent,
      mobile:          editForm.phone,
      email:           editForm.email || undefined,
      classInterested: editForm.class_ || undefined,
      source:          editForm.source,
      remarks:         editForm.remarks || undefined,
      status:          editForm.status,
    };
    try {
      await enquiryAPI.update(selected.id, updated);
      toast.success('✅ Enquiry updated in database!');
    } catch {
      toast.success('Enquiry updated (demo mode)');
    }
    // Update local state
    const updatedEnq = {
      ...selected,
      student_name:    editForm.name,
      parent_name:     editForm.parent,
      mobile:          editForm.phone,
      email:           editForm.email,
      class_interested:editForm.class_,
      source:          editForm.source,
      remarks:         editForm.remarks,
      status:          editForm.status,
    };
    setEnquiries(p => p.map(e => e.id === selected.id ? updatedEnq : e));
    setSelected(updatedEnq);
    setEditMode(false);
    setSaving(false);
  };

  /* ── Status change (inline dropdown) ───────────── */
  const handleStatusChange = async (id, status) => {
    try { await enquiryAPI.update(id, { status }); } catch {}
    setEnquiries(p => p.map(e => e.id === id ? {...e, status} : e));
    toast.success('Status updated');
  };

  /* ── Convert → Registration ─────────────────────── */
  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.date) { toast.error('Please select a follow-up date'); return; }
    setSavingFollowUp(true);
    try {
      await enquiryAPI.update(showFollowUp.id, {
        followUpDate: followUpForm.date,
        remarks:      followUpForm.remarks || showFollowUp.remarks || undefined,
        status:       'follow_up',
      });
      toast.success('✅ Follow-up scheduled for ' + new Date(followUpForm.date).toLocaleDateString('en-IN'));
      setShowFollowUp(null);
      setFollowUpForm({ date:'', remarks:'' });
      setSelected(null);
      load();
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSavingFollowUp(false); }
  };

  const handleConvert = async (enq) => {
    setConverting(true);
    try {
      await registrationAPI.create({
        studentName:     enq.student_name,
        parentName:      enq.parent_name,
        mobile:          enq.mobile,
        email:           enq.email || undefined,
        desiredClass:    enq.class_interested || undefined,
        registrationFee: 500,
        feePaid:         false,
        enquiryId:       isMock ? undefined : enq.id,
      });
      if (!isMock) await enquiryAPI.update(enq.id, { status:'converted' });
      setEnquiries(p => p.map(e => e.id===enq.id ? {...e, status:'converted'} : e));
      toast.success('✅ ' + enq.student_name + ' converted to Registration! Redirecting…');
      setSelected(null);
      setTimeout(() => navigate('/registration'), 1200);
    } catch {
      setEnquiries(p => p.map(e => e.id===enq.id ? {...e, status:'converted'} : e));
      toast.success('Converted (demo mode)'); setSelected(null); navigate('/registration');
    } finally { setConverting(false); }
  };

  const counts = Object.fromEntries(Object.keys(STATUS_CFG).map(k => [k, enquiries.filter(e=>e.status===k).length]));

  /* ── Render ─────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Enquiry Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {total} enquiries &nbsp;
            {isMock
              ? <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Demo mode</span>
              : <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{padding:'9px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ New Enquiry</button>
      </div>

      {/* Pipeline */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#EDE9F8',borderRadius:10,marginBottom:14,fontSize:12,color:'#1E1B4B',fontWeight:600}}>
        <span style={{fontWeight:800,textDecoration:'underline'}}>📞 Enquiry</span>
        <span style={{color:'#A78BFA',fontSize:16}}>→</span><span>📄 Registration</span>
        <span style={{color:'#A78BFA',fontSize:16}}>→</span><span>🎓 Admission</span>
        <span style={{marginLeft:'auto',fontSize:11,fontWeight:500,color:'#6B52B0'}}>
          Click "View" to edit or convert pending enquiries
        </span>
      </div>

      {/* Status filter pills */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input placeholder="🔍 Search name or phone…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inp,maxWidth:220,flex:1,padding:'8px 12px'}}/>
        {Object.entries(STATUS_CFG).map(([key,{bg,c,label}]) => (
          <div key={key} onClick={()=>setFilter(filter===key?'':key)}
            style={{padding:'6px 12px',borderRadius:20,background:filter===key?c:bg,color:filter===key?'#fff':c,fontSize:11,fontWeight:700,cursor:'pointer',border:'1.5px solid '+c+'33',userSelect:'none',transition:'all .15s'}}>
            {label} ({counts[key]||0})
          </div>
        ))}
        {filter && <button onClick={()=>setFilter('')} style={{padding:'6px 12px',borderRadius:20,background:'#F3F4F6',border:'1px solid #E5E7EB',fontSize:11,cursor:'pointer',color:'#6B7280'}}>Clear ✕</button>}
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F9FAFB'}}>
            {['Enq No','Student','Parent / Phone','Class','Date','Follow-up Date','Status','Change Status','Actions'].map(h=>(
              <th key={h} style={{padding:'10px 12px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{padding:36,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</td></tr>}
            {!loading && enquiries.length===0 && (
              <tr><td colSpan={9} style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
                <div style={{fontSize:36,marginBottom:8}}>📞</div>No enquiries yet
              </td></tr>
            )}
            {!loading && enquiries.map(e => {
              const st = STATUS_CFG[e.status] || STATUS_CFG.new;
              const canEdit = e.status !== 'converted';
              const followUpDate = e.follow_up_date ? String(e.follow_up_date).split('T')[0] : null;
              const isOverdue = followUpDate && followUpDate < new Date().toISOString().split('T')[0];
              const isToday   = followUpDate && followUpDate === new Date().toISOString().split('T')[0];
              return (
                <tr key={e.id} style={{borderBottom:'0.5px solid #F3F4F6',transition:'background .1s'}}
                  onMouseEnter={ev=>ev.currentTarget.style.background='#F5F3FF'}
                  onMouseLeave={ev=>ev.currentTarget.style.background=''}>
                  <td style={{padding:'10px 12px',fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{e.enquiry_no}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:'#111827'}}>{e.student_name}</td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{fontWeight:500}}>{e.parent_name}</div>
                    <div style={{fontSize:10,color:'#9CA3AF'}}>{e.mobile}</div>
                  </td>
                  <td style={{padding:'10px 12px',color:'#6B7280'}}>{e.class_interested||'—'}</td>
                  <td style={{padding:'10px 12px',color:'#6B7280',fontSize:11}}>{(e.created_at||'').split('T')[0]}</td>
                  <td style={{padding:'10px 12px'}}>
                    {followUpDate
                      ? <div>
                          <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,
                            background: isOverdue?'#FEE2E2':isToday?'#FEF3C7':'#D1FAE5',
                            color: isOverdue?'#991B1B':isToday?'#92400E':'#065F46'}}>
                            {isOverdue?'⚠️ ':isToday?'📅 Today ':'✅ '}{followUpDate}
                          </span>
                        </div>
                      : <span style={{color:'#D1D5DB',fontSize:11}}>—</span>
                    }
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:st.bg,color:st.c}}>{st.label}</span>
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    {canEdit
                      ? <select value={e.status} onChange={ev=>handleStatusChange(e.id,ev.target.value)}
                          style={{padding:'5px 8px',border:'1px solid #E5E7EB',borderRadius:7,fontSize:11,background:'#fff',outline:'none',cursor:'pointer'}}>
                          {Object.entries(STATUS_CFG).filter(([k])=>k!=='converted').map(([k,v])=>(
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      : <span style={{fontSize:11,color:'#9CA3AF'}}>—</span>}
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>{setSelected(e);setEditMode(false);}}
                        style={{padding:'5px 12px',border:'1px solid #1E1B4B',borderRadius:7,background:'#EDE9F8',color:'#1E1B4B',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                        View
                      </button>
                      {canEdit && (
                        <button onClick={()=>{setSelected(e);openEdit(e);}}
                          style={{padding:'5px 12px',border:'1px solid #F59E0B',borderRadius:7,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:'9px 14px',borderTop:'0.5px solid #E5E7EB',fontSize:11,color:'#6B7280'}}>{total} total · {counts.converted||0} converted</div>
      </div>

      {/* ── VIEW / EDIT / CONVERT MODAL ── */}
      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:18,width:520,maxHeight:'92vh',overflow:'auto',display:'flex',flexDirection:'column'}}>
            {/* Modal header */}
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>
                  {editMode ? '✏️ Edit Enquiry — ' : '📋 Enquiry — '}{selected.enquiry_no}
                </div>
                {selected.status !== 'converted' && !editMode && (
                  <div style={{fontSize:11,color:'#6B52B0',marginTop:2}}>
                    This enquiry can be edited or converted to registration
                  </div>
                )}
                {editMode && (
                  <div style={{fontSize:11,color:'#92400E',marginTop:2}}>
                    ⚠️ Editing is only allowed for non-converted enquiries
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {/* Edit / Cancel Edit toggle */}
                {selected.status !== 'converted' && !editMode && (
                  <button onClick={()=>openEdit(selected)}
                    style={{padding:'6px 14px',border:'1.5px solid #F59E0B',borderRadius:8,background:'#FEF3C7',color:'#92400E',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    ✏️ Edit
                  </button>
                )}
                {editMode && (
                  <button onClick={()=>setEditMode(false)}
                    style={{padding:'6px 14px',border:'1.5px solid #E5E7EB',borderRadius:8,background:'#fff',color:'#6B7280',fontSize:12,cursor:'pointer'}}>
                    Cancel Edit
                  </button>
                )}
                <button onClick={()=>{setSelected(null);setEditMode(false);}}
                  style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
              </div>
            </div>

            <div style={{padding:22,flex:1,overflowY:'auto'}}>
              {/* Status badge */}
              <div style={{padding:'10px 14px',background:(STATUS_CFG[selected.status]||STATUS_CFG.new).bg,borderRadius:10,marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,color:(STATUS_CFG[selected.status]||STATUS_CFG.new).c,fontSize:14}}>
                  {(STATUS_CFG[selected.status]||STATUS_CFG.new).label}
                </span>
                <span style={{fontSize:11,color:(STATUS_CFG[selected.status]||STATUS_CFG.new).c}}>#{selected.enquiry_no}</span>
              </div>

              {/* ── EDIT FORM ── */}
              {editMode ? (
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <div><label style={lbl}>Student Name *</label><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp} autoFocus/></div>
                    <div><label style={lbl}>Parent Name *</label><input value={editForm.parent} onChange={e=>setEditForm({...editForm,parent:e.target.value})} style={inp}/></div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                    <div><label style={lbl}>Mobile *</label><input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})} maxLength={10} style={inp}/></div>
                    <div><label style={lbl}>Email</label><input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} style={inp}/></div>
                    <div><label style={lbl}>Class</label>
                      <select value={editForm.class_} onChange={e=>setEditForm({...editForm,class_:e.target.value})} style={inp}>
                        <option value="">Select Class</option>{dbClasses.map(cl=><option key={cl.id} value={cl.name}>{cl.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <div><label style={lbl}>Source</label>
                      <select value={editForm.source} onChange={e=>setEditForm({...editForm,source:e.target.value})} style={inp}>
                        {SOURCES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Lead Status</label>
                      <select value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})} style={inp}>
                        {Object.entries(STATUS_CFG).filter(([k])=>k!=='converted').map(([k,v])=>(
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{marginBottom:16}}><label style={lbl}>Remarks</label>
                    <textarea value={editForm.remarks} onChange={e=>setEditForm({...editForm,remarks:e.target.value})} rows={3} style={{...inp,resize:'vertical'}}/>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setEditMode(false)} style={{flex:1,padding:'11px',border:'1.5px solid #E5E7EB',borderRadius:10,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={saving}
                      style={{flex:2,padding:'11px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer'}}>
                      {saving ? '⏳ Saving…' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── VIEW MODE ── */
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                    {[
                      ['Student',          selected.student_name],
                      ['Parent/Guardian',  selected.parent_name],
                      ['Mobile',           selected.mobile],
                      ['Email',            selected.email||'—'],
                      ['Class Interested', selected.class_interested||'—'],
                      ['Source',           (selected.source||'').replace(/_/g,' ')],
                      ['Enquiry Date',     (selected.created_at||'').split('T')[0]],
                      ['Status',           (STATUS_CFG[selected.status]||STATUS_CFG.new).label],
                    ].map(([k,v]) => (
                      <div key={k} style={{padding:'9px 12px',background:'#F9FAFB',borderRadius:9}}>
                        <div style={{fontSize:10,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{k}</div>
                        <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {selected.remarks && (
                    <div style={{padding:'10px 12px',background:'#FEF3C7',borderRadius:9,marginBottom:16,fontSize:12,color:'#92400E'}}>
                      <strong>Remarks:</strong> {selected.remarks}
                    </div>
                  )}

                  {selected.status !== 'converted' ? (
                    <div>
                      <div style={{padding:'10px 14px',background:'#EDE9F8',borderRadius:9,marginBottom:12,fontSize:11,color:'#1E1B4B',lineHeight:1.7}}>
                        ℹ️ <strong>Convert to Registration</strong> will create a Registration record automatically with this student's details pre-filled and mark this enquiry as converted.
                      </div>
                      <div style={{display:'flex',gap:10}}>
                        <button onClick={()=>handleConvert(selected)} disabled={converting}
                          style={{flex:1,padding:'12px',background:converting?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:converting?'not-allowed':'pointer'}}>
                          {converting ? '⏳ Converting…' : '📄 Convert to Registration →'}
                        </button>
                        <button onClick={()=>{setShowFollowUp(selected);setFollowUpForm({date:'',remarks:selected.remarks||''}); setSelected(null);}}
                          style={{padding:'12px 14px',border:'1.5px solid #E5E7EB',borderRadius:10,background:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>
                          📅 Follow-up
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{padding:14,background:'#D1FAE5',borderRadius:10,textAlign:'center',color:'#065F46',fontWeight:600,fontSize:13}}>
                      ✅ Already converted to Registration
                      <button onClick={()=>{navigate('/registration');setSelected(null);}}
                        style={{display:'block',margin:'8px auto 0',padding:'6px 18px',background:'#065F46',color:'#fff',border:'none',borderRadius:7,fontSize:12,cursor:'pointer'}}>
                        View in Registration →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD NEW ENQUIRY MODAL ── */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:520,maxWidth:'100%',maxHeight:'92vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>📞 New Enquiry</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Student Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name" style={inp} autoFocus/></div>
                <div><label style={lbl}>Parent Name *</label><input required value={form.parent} onChange={e=>setForm({...form,parent:e.target.value})} placeholder="Parent name" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Mobile *</label><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit" maxLength={10} style={inp}/></div>
                <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="optional" style={inp}/></div>
                <div><label style={lbl}>Class Interested</label>
                  <select value={form.class_} onChange={e=>setForm({...form,class_:e.target.value})} style={inp}>
                    <option value="">Select Class</option>{dbClasses.map(cl=><option key={cl.id} value={cl.name}>{cl.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Source</label>
                  <select value={form.source} onChange={e=>setForm({...form,source:e.target.value})} style={inp}>
                    {SOURCES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Lead Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inp}>
                    {Object.entries(STATUS_CFG).filter(([k])=>k!=='converted').map(([k,v])=>(
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:16}}><label style={lbl}>Remarks</label>
                <textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Any notes…" rows={3} style={{...inp,resize:'vertical'}}/>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'10px 18px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer'}}>
                  {saving ? '⏳ Saving…' : '💾 Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UP MODAL ── */}
      {showFollowUp && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F9FAFB'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'#111827'}}>📅 Schedule Follow-up</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>{showFollowUp.student_name} · {showFollowUp.enquiry_no}</div>
              </div>
              <button onClick={()=>setShowFollowUp(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleFollowUp} style={{padding:20}}>
              {/* Student info */}
              <div style={{padding:'10px 14px',background:'#EDE9F8',borderRadius:10,marginBottom:16,fontSize:12,color:'#1E1B4B'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div><span style={{color:'#6B7280'}}>Student: </span><strong>{showFollowUp.student_name}</strong></div>
                  <div><span style={{color:'#6B7280'}}>Parent: </span><strong>{showFollowUp.parent_name}</strong></div>
                  <div><span style={{color:'#6B7280'}}>Mobile: </span><strong>{showFollowUp.mobile}</strong></div>
                  <div><span style={{color:'#6B7280'}}>Class: </span><strong>{showFollowUp.class_interested||'—'}</strong></div>
                </div>
              </div>

              {/* Follow-up date */}
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Follow-up Date *</label>
                <input required type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={followUpForm.date}
                  onChange={e=>setFollowUpForm({...followUpForm,date:e.target.value})}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',boxSizing:'border-box'}}
                  autoFocus
                />
              </div>

              {/* Remarks */}
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Remarks / Notes</label>
                <textarea
                  value={followUpForm.remarks}
                  onChange={e=>setFollowUpForm({...followUpForm,remarks:e.target.value})}
                  placeholder="What to discuss, parent concerns, next steps…"
                  rows={3}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}
                />
              </div>

              <div style={{padding:'10px 14px',background:'#FEF3C7',borderRadius:9,marginBottom:16,fontSize:12,color:'#92400E'}}>
                ℹ️ Status will be updated to <strong>Follow-up</strong> and follow-up date will be saved to database.
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowFollowUp(null)}
                  style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>
                  Cancel
                </button>
                <button type="submit" disabled={savingFollowUp}
                  style={{padding:'10px 22px',background:savingFollowUp?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:savingFollowUp?'not-allowed':'pointer'}}>
                  {savingFollowUp ? '⏳ Saving…' : '📅 Schedule Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
