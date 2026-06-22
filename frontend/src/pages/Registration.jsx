import React, { useState, useEffect, useCallback, useRef } from 'react';
import { registrationAPI, schoolAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };
const DEFAULT_CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const MOCK_REGS = [
  { id:1, registration_no:'REG001', student_name:'Riya Gupta',   parent_name:'Sanjay Gupta',  mobile:'9811001100', desired_class:'Class 6', registration_fee:500, fee_paid:true,  created_at:'2025-06-05', status:'pending',   photo_url:null, enquiry_id:null },
  { id:2, registration_no:'REG002', student_name:'Rahul Sharma', parent_name:'Amit Sharma',   mobile:'9822002200', desired_class:'Class 9', registration_fee:500, fee_paid:false, created_at:'2025-06-04', status:'pending',   photo_url:null, enquiry_id:null },
  { id:3, registration_no:'REG003', student_name:'Pooja Verma',  parent_name:'Dinesh Verma',  mobile:'9833003300', desired_class:'Class 7', registration_fee:500, fee_paid:true,  created_at:'2025-06-03', status:'converted', photo_url:null, enquiry_id:null },
];

// ── Standalone Photo Upload (no external state references) ──
function PhotoUpload({ value, onChange, size }) {
  const ref = useRef();
  const sz  = size || 100;
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Photo must be under 3MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div
        onClick={() => ref.current.click()}
        style={{ width:sz, height:sz, borderRadius:12, border: value ? 'none' : '2px dashed #C4B5FD', background: value ? 'transparent' : '#EDE9F8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}
      >
        {value
          ? <img src={value} alt="photo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <><span style={{ fontSize:26 }}>📷</span><span style={{ fontSize:9, color:'#7C3AED', fontWeight:600, marginTop:4, textAlign:'center' }}>Upload Photo</span></>}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
      {value
        ? <button type="button" onClick={() => onChange(null)} style={{ fontSize:10, color:'#DC2626', background:'none', border:'none', cursor:'pointer' }}>Remove</button>
        : <span style={{ fontSize:9, color:'#9CA3AF' }}>JPG/PNG, max 3MB</span>}
    </div>
  );
}

export default function Registration() {
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────
  const [regs,       setRegs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [isMock,     setIsMock]     = useState(false);
  const [total,      setTotal]      = useState(0);
  const [classes,    setClasses]    = useState(DEFAULT_CLASSES);
  const [showAdd,    setShowAdd]    = useState(false);
  const [showAddCls, setShowAddCls] = useState(false);
  const [converting,     setConverting]     = useState(null);
  const [pendingAdmits,  setPendingAdmits]  = useState([]);
  const [confirmingFee,  setConfirmingFee]  = useState(null);
  const [confirmingLoad, setConfirmingLoad] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [newCls,     setNewCls]     = useState('');
  const [photo,      setPhoto]      = useState(null);

  // Add form
  const [form, setForm] = useState({ name:'', parent:'', phone:'', email:'', dob:'', gender:'male', category:'general', class_:'', prevSchool:'', regFee:'500', feePaid:false });

  // Edit state
  const [editReg,    setEditReg]    = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [editPhoto,  setEditPhoto]  = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // ── Load data ───────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      const res = await schoolAPI.getClasses();
      const c = (res.data.data || []).map(x => x.name);
      if (c.length) setClasses(c);
    } catch {}
  }, []);

  const loadRegs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await registrationAPI.getAll({ limit: 100 });
      setRegs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setIsMock(false);
    } catch {
      setRegs(MOCK_REGS);
      setTotal(MOCK_REGS.length);
      setIsMock(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadClasses(); loadRegs(); }, [loadClasses, loadRegs]);

  // ── Add class ───────────────────────────────────────────
  const handleAddClass = async () => {
    if (!newCls.trim()) return;
    if (classes.includes(newCls.trim())) { toast.error('Already exists!'); return; }
    try {
      await schoolAPI.addClass({ name: newCls.trim() });
      toast.success('Class added to database!');
      await loadClasses();
    } catch {
      setClasses(p => [...p, newCls.trim()]);
      toast.success('Class added (demo)');
    }
    setNewCls(''); setShowAddCls(false);
  };

  // ── Save new registration ───────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await registrationAPI.create({
        studentName:     form.name,
        parentName:      form.parent,
        mobile:          form.phone,
        email:           form.email || undefined,
        desiredClass:    form.class_ || undefined,
        previousSchool:  form.prevSchool || undefined,
        registrationFee: parseInt(form.regFee) || 500,
        feePaid:         form.feePaid,
        photoUrl:        photo || undefined,
        dateOfBirth:     form.dob || undefined,
        gender:          form.gender,
        category:        form.category,
      });
      toast.success('✅ Registration saved to database!');
      setShowAdd(false); setPhoto(null);
      setForm({ name:'', parent:'', phone:'', email:'', dob:'', gender:'male', category:'general', class_:'', prevSchool:'', regFee:'500', feePaid:false });
      loadRegs();
    } catch {
      const mock = { id:Date.now(), registration_no:'REG'+String(regs.length+1).padStart(3,'0'), student_name:form.name, parent_name:form.parent, mobile:form.phone, desired_class:form.class_, registration_fee:parseInt(form.regFee)||500, fee_paid:form.feePaid, created_at:new Date().toISOString().split('T')[0], status:'pending', photo_url:photo, enquiry_id:null };
      setRegs(p => [mock, ...p]);
      setIsMock(true);
      toast.success('Registration added (demo mode)');
      setShowAdd(false); setPhoto(null);
    } finally { setSaving(false); }
  };

  // ── Open edit ───────────────────────────────────────────
  const openEdit = (reg) => {
    setEditForm({
      name:       reg.student_name    || '',
      parent:     reg.parent_name     || '',
      phone:      reg.mobile          || '',
      email:      reg.email           || '',
      class_:     reg.desired_class   || '',
      prevSchool: reg.previous_school || '',
      regFee:     String(reg.registration_fee || 500),
      feePaid:    reg.fee_paid        || false,
    });
    setEditPhoto(reg.photo_url || null);
    setEditReg(reg);
  };

  // ── Save edit ───────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editReg) return;
    setEditSaving(true);
    try {
      await registrationAPI.update(editReg.id, {
        studentName:     editForm.name,
        parentName:      editForm.parent,
        mobile:          editForm.phone,
        email:           editForm.email || undefined,
        desiredClass:    editForm.class_ || undefined,
        previousSchool:  editForm.prevSchool || undefined,
        registrationFee: parseInt(editForm.regFee) || 500,
        feePaid:         editForm.feePaid,
        photoUrl:        editPhoto || undefined,
      });
      toast.success('✅ Registration updated in database!');
      setRegs(p => p.map(r => r.id === editReg.id ? {
        ...r,
        student_name:     editForm.name,
        parent_name:      editForm.parent,
        mobile:           editForm.phone,
        email:            editForm.email,
        desired_class:    editForm.class_,
        previous_school:  editForm.prevSchool,
        registration_fee: parseInt(editForm.regFee) || 500,
        fee_paid:         editForm.feePaid,
        photo_url:        editPhoto,
      } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
      setEditReg(null);
      setEditPhoto(null);
    }
  };

  // ── Convert to student ──────────────────────────────────
  const handleConfirmFee = async (student) => {
    setConfirmingLoad(true);
    try {
      const res = await studentAPI_ext.confirmAdmission(student.id);
      toast.success('✅ ' + res.data.message);
      setConfirmingFee(null);
      setPendingAdmits(p => p.filter(s => s.id !== student.id));
      setTimeout(() => navigate('/students', { state: { refresh: true } }), 800);
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setConfirmingLoad(false); }
  };

  const handleConvert = async (reg) => {
    setSaving(true);
    try {
      const res = await registrationAPI.convert(reg.id);
      const admNo = res.data?.data?.student?.admission_no || res.data?.data?.admissionNo || res.data?.admissionNo || '';
      toast.success('🎓 ' + reg.student_name + ' admitted! Adm No: ' + admNo);
      setRegs(p => p.map(r => r.id === reg.id ? { ...r, status:'converted' } : r));
      setConverting(null);
      setTimeout(() => navigate('/students', { state: { refresh: true, admNo } }), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Conversion failed';
      toast.error('❌ ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const pending   = regs.filter(r => r.status === 'pending').length;
  const converted = regs.filter(r => r.status === 'converted').length;
  const feePaid   = regs.filter(r => r.fee_paid).length;

  // ── Render ──────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Registration Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {total} registrations &nbsp;
            {isMock
              ? <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Demo mode</span>
              : <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={() => setShowAddCls(true)} style={{padding:'9px 14px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontSize:12,fontWeight:700,cursor:'pointer'}}><><i className="ti ti-plus" style={{fontSize:14}}/> Add Class</></button>
          <button onClick={() => setShowAdd(true)}    style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}><><i className="ti ti-plus" style={{fontSize:16}}/> New Registration</></button>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#EDE9F8',borderRadius:10,marginBottom:14,fontSize:12,color:'#1E1B4B',fontWeight:600}}>
        <span>📞 Enquiry</span><span style={{color:'#A78BFA',fontSize:16}}>→</span>
        <span style={{fontWeight:800,textDecoration:'underline'}}>📄 Registration</span><span style={{color:'#A78BFA',fontSize:16}}>→</span>
        <span>🎓 Students</span>
        <span style={{marginLeft:'auto',fontSize:11,color:'#6B52B0'}}>✏️ Edit pending · → Admit when ready</span>
      </div>

      {/* Pending Fee Admissions Banner */}
      {pendingAdmits.length > 0 && (
        <div style={{background:'#FEF3C7',border:'1px solid #F59E0B',borderRadius:12,padding:'12px 16px',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,color:'#92400E',marginBottom:8}}>
            ⏳ {pendingAdmits.length} student(s) admitted but admission fee pending — confirm to move to Students module
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {pendingAdmits.map(s => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#fff',borderRadius:8,border:'1px solid #F59E0B'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#111827'}}>{s.first_name} {s.last_name||''}</span>
                <span style={{fontSize:10,color:'#9CA3AF'}}>{s.admission_no} · {s.class_name||'—'}</span>
                <button onClick={()=>setConfirmingFee(s)}
                  style={{padding:'3px 10px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                  💰 Confirm Fee
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[['Total',regs.length,'#EDE9F8','#1E1B4B'],['Pending',pending,'#FEF3C7','#92400E'],['Admitted',converted,'#D1FAE5','#065F46'],['Fee Paid',feePaid,'#DBEAFE','#1E40AF']].map(([l,v,bg,c]) => (
          <div key={l} style={{padding:'14px',background:bg,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:c,marginTop:4,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F9FAFB'}}>
            {['Photo','Reg No','Student','Parent / Mobile','Class','Reg Fee','Date','Status','Actions'].map(h => (
              <th key={h} style={{padding:'10px 12px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{padding:36,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</td></tr>}
            {!loading && regs.length === 0 && (
              <tr><td colSpan={9} style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
                <div style={{fontSize:36,marginBottom:8}}>📄</div>No registrations yet
              </td></tr>
            )}
            {!loading && regs.map(r => (
              <tr key={r.id} style={{borderBottom:'0.5px solid #F3F4F6',transition:'background .1s'}}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{padding:'8px 12px'}}>
                  {r.photo_url
                    ? <img src={r.photo_url} alt="" style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'1.5px solid #E5E7EB'}}/>
                    : <div style={{width:36,height:36,borderRadius:8,background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#9CA3AF'}}>👤</div>}
                </td>
                <td style={{padding:'10px 12px',fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{r.registration_no}</td>
                <td style={{padding:'10px 12px',fontWeight:700,color:'#111827'}}>{r.student_name}</td>
                <td style={{padding:'10px 12px'}}>
                  <div style={{fontWeight:500}}>{r.parent_name}</div>
                  <div style={{fontSize:10,color:'#9CA3AF'}}>{r.mobile}</div>
                </td>
                <td style={{padding:'10px 12px',color:'#6B7280'}}>{r.desired_class || '—'}</td>
                <td style={{padding:'10px 12px'}}>
                  <div style={{fontWeight:700}}>₹{r.registration_fee}</div>
                  <span style={{padding:'1px 6px',borderRadius:10,fontSize:9,background:r.fee_paid?'#D1FAE5':'#FEE2E2',color:r.fee_paid?'#065F46':'#991B1B',fontWeight:700}}>{r.fee_paid ? '✓ Paid' : 'Unpaid'}</span>
                </td>
                <td style={{padding:'10px 12px',color:'#6B7280',fontSize:11}}>{(r.created_at || '').split('T')[0]}</td>
                <td style={{padding:'10px 12px'}}>
                  <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:r.status==='converted'?'#D1FAE5':'#FEF3C7',color:r.status==='converted'?'#065F46':'#92400E'}}>
                    {r.status === 'converted' ? '✅ Admitted' : '⏳ Pending'}
                  </span>
                </td>
                <td style={{padding:'10px 12px'}}>
                  <div style={{display:'flex',gap:6}}>
                    {r.status === 'pending' && <>
                      <button onClick={() => setConverting(r)} style={{padding:'5px 12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer'}}>→ Admit</button>
                      <button onClick={() => openEdit(r)} style={{padding:'5px 10px',border:'1.5px solid #F59E0B',borderRadius:7,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️</button>
                    </>}
                    {r.status === 'converted' && (
                      <button onClick={() => navigate('/students')} style={{padding:'5px 12px',border:'1px solid #E5E7EB',borderRadius:7,background:'#fff',fontSize:11,cursor:'pointer'}}>View</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'9px 14px',borderTop:'0.5px solid #E5E7EB',fontSize:11,color:'#6B7280'}}>{total} total · {converted} admitted</div>
      </div>

      {/* ── CONFIRM ADMIT MODAL ── */}
      {converting && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>🎓 Confirm Admission</div>
              <button onClick={() => setConverting(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:22}}>
              <div style={{display:'flex',gap:14,padding:14,background:'#EDE9F8',borderRadius:12,marginBottom:14,alignItems:'center'}}>
                {converting.photo_url
                  ? <img src={converting.photo_url} alt="" style={{width:60,height:60,borderRadius:10,objectFit:'cover',flexShrink:0}}/>
                  : <div style={{width:60,height:60,borderRadius:10,background:'#C4B5FD',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>👤</div>}
                <div>
                  <div style={{fontWeight:800,fontSize:15,color:'#1E1B4B'}}>{converting.student_name}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:12,marginTop:5}}>
                    {[['Parent',converting.parent_name],['Phone',converting.mobile],['Class',converting.desired_class||'—'],['Reg No',converting.registration_no]].map(([k,v]) => (
                      <div key={k}><span style={{color:'#6B7280'}}>{k}: </span><strong>{v}</strong></div>
                    ))}
                  </div>
                  {converting.photo_url && <div style={{fontSize:10,color:'#065F46',marginTop:4,fontWeight:600}}>✅ Photo will carry to student & ID card</div>}
                </div>
              </div>
              <div style={{padding:'10px 12px',background:'#FEF3C7',borderRadius:9,marginBottom:14,fontSize:12,color:'#92400E'}}>
                ⚠️ Creates a student record with auto-generated Admission Number.
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={() => setConverting(null)} style={{flex:1,padding:'11px',border:'1.5px solid #E5E7EB',borderRadius:10,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={() => handleConvert(converting)} disabled={saving}
                  style={{flex:2,padding:'11px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer'}}>
                  {saving ? '⏳ Creating student record…' : '🎓 Confirm Admission →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT REGISTRATION MODAL ── */}
      {editReg && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:560,maxWidth:'100%',maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>✏️ Edit Registration — {editReg.registration_no}</div>
                <div style={{fontSize:11,color:'#92400E',marginTop:2}}>⚠️ Only pending registrations can be edited</div>
              </div>
              <button onClick={() => setEditReg(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:20}}>
              {/* Photo upload section */}
              <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16,padding:'12px 14px',background:'#F9FAFB',borderRadius:10,border:'0.5px solid #E5E7EB'}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Student Photo</div>
                  <PhotoUpload value={editPhoto} onChange={setEditPhoto} size={80}/>
                </div>
                <div style={{flex:1,paddingTop:4}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#111827',marginBottom:2}}>{editForm.name}</div>
                  <div style={{fontSize:11,color:'#6B7280'}}>{editReg.registration_no}</div>
                  <div style={{fontSize:11,color:'#9CA3AF',marginTop:8,lineHeight:1.5}}>
                    📸 Photo will be saved with registration and auto-carried to student admission & ID card
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Student Name *</label><input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp} autoFocus/></div>
                <div><label style={lbl}>Parent Name *</label><input value={editForm.parent} onChange={e=>setEditForm({...editForm,parent:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Mobile *</label><input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})} maxLength={10} style={inp}/></div>
                <div><label style={lbl}>Email</label><input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'end',marginBottom:12}}>
                <div>
                  <label style={lbl}>Class</label>
                  <select value={editForm.class_} onChange={e=>setEditForm({...editForm,class_:e.target.value})} style={inp}>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setShowAddCls(true)} style={{padding:'10px 14px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontWeight:800,cursor:'pointer',fontSize:18,height:44}}>+</button>
              </div>
              <div style={{marginBottom:12}}><label style={lbl}>Previous School</label><input value={editForm.prevSchool} onChange={e=>setEditForm({...editForm,prevSchool:e.target.value})} style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Registration Fee (₹)</label><input type="number" value={editForm.regFee} onChange={e=>setEditForm({...editForm,regFee:e.target.value})} style={inp}/></div>
                <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:24}}>
                  <input type="checkbox" id="efp" checked={editForm.feePaid} onChange={e=>setEditForm({...editForm,feePaid:e.target.checked})} style={{width:18,height:18,accentColor:'#1E1B4B',cursor:'pointer'}}/>
                  <label htmlFor="efp" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Fee Paid</label>
                </div>
              </div>
              {editReg.enquiry_id && (
                <div style={{padding:'10px 12px',background:'#EDE9F8',borderRadius:9,marginBottom:14,fontSize:11,color:'#1E1B4B'}}>
                  ℹ️ Changes to name and mobile will sync back to the linked Enquiry record.
                </div>
              )}
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={() => setEditReg(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSaveEdit} disabled={editSaving}
                  style={{padding:'10px 22px',background:editSaving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:editSaving?'not-allowed':'pointer'}}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CLASS MODAL ── */}
      {showAddCls && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:440,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>+ Add New Class</div>
              <button onClick={() => setShowAddCls(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Class Name *</label>
                <input value={newCls} onChange={e => setNewCls(e.target.value)} placeholder="e.g. Class 6, LKG, Nursery"
                  style={inp} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddClass()}/>
                <div style={{fontSize:10,color:'#6B7280',marginTop:4}}>Will be saved to database and appear in all dropdowns</div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6B7280',marginBottom:6}}>Existing Classes:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{classes.map(c => <span key={c} style={{padding:'2px 9px',background:'#EDE9F8',borderRadius:20,fontSize:11,color:'#1E1B4B'}}>{c}</span>)}</div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={() => setShowAddCls(false)} style={{padding:'9px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleAddClass} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}><><i className="ti ti-plus" style={{fontSize:14}}/> Add Class</></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW REGISTRATION MODAL ── */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:640,maxWidth:'100%',maxHeight:'92vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div style={{fontWeight:700,fontSize:15}}>📄 New Registration</div>
              <button onClick={() => { setShowAdd(false); setPhoto(null); }} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleAdd} style={{padding:20}}>
              {/* Photo + basic info */}
              <div style={{display:'flex',gap:20,marginBottom:16,padding:16,background:'#F9FAFB',borderRadius:12}}>
                <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Photo</div>
                  <PhotoUpload value={photo} onChange={setPhoto} size={90}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                    <div><label style={lbl}>Student Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp} autoFocus/></div>
                    <div><label style={lbl}>Parent Name *</label><input required value={form.parent} onChange={e=>setForm({...form,parent:e.target.value})} style={inp}/></div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    <div><label style={lbl}>Mobile *</label><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} maxLength={10} style={inp}/></div>
                    <div><label style={lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} style={inp}/></div>
                    <div><label style={lbl}>Gender</label><select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} style={inp}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                  </div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option></select></div>
                <div><label style={lbl}>Previous School</label><input value={form.prevSchool} onChange={e=>setForm({...form,prevSchool:e.target.value})} style={inp}/></div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'end',marginBottom:12}}>
                <div>
                  <label style={lbl}>Class *</label>
                  <select required value={form.class_} onChange={e=>setForm({...form,class_:e.target.value})} style={inp}>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div style={{fontSize:10,color:'#9CA3AF',marginTop:3}}>Not in list? Click + to add</div>
                </div>
                <button type="button" onClick={() => setShowAddCls(true)} style={{padding:'10px 14px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontWeight:800,cursor:'pointer',fontSize:18,height:44}}>+</button>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Registration Fee (₹)</label><input type="number" value={form.regFee} onChange={e=>setForm({...form,regFee:e.target.value})} style={inp}/></div>
                <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:24}}>
                  <input type="checkbox" id="fp" checked={form.feePaid} onChange={e=>setForm({...form,feePaid:e.target.checked})} style={{width:18,height:18,accentColor:'#1E1B4B',cursor:'pointer'}}/>
                  <label htmlFor="fp" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Fee Paid</label>
                </div>
              </div>

              {photo && (
                <div style={{padding:'10px 12px',background:'#D1FAE5',borderRadius:9,marginBottom:12,fontSize:12,color:'#065F46',display:'flex',alignItems:'center',gap:8}}>
                  <img src={photo} alt="" style={{width:28,height:28,borderRadius:6,objectFit:'cover'}}/>
                  ✅ Photo saved with registration — carries forward to student admission & ID card
                </div>
              )}

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={() => { setShowAdd(false); setPhoto(null); }} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer'}}>
                  {saving ? 'Saving…' : 'Save Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM FEE MODAL ── */}
      {confirmingFee && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>💰 Confirm Admission Fee</div>
              <button onClick={()=>setConfirmingFee(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:20}}>
              <div style={{padding:'14px',background:'#EDE9F8',borderRadius:10,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,color:'#111827'}}>{confirmingFee.first_name} {confirmingFee.last_name||''}</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:3}}>
                  {confirmingFee.admission_no} · {confirmingFee.class_name||'—'} · Parent: {confirmingFee.parent_name||'—'}
                </div>
              </div>
              <div style={{padding:'12px 14px',background:'#D1FAE5',borderRadius:10,marginBottom:20,fontSize:13,color:'#065F46',fontWeight:600}}>
                ✅ Once confirmed, this student will appear in the <strong>Students module</strong> and all academic features (attendance, fee, exams, timetable) will be accessible.
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setConfirmingFee(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={()=>handleConfirmFee(confirmingFee)} disabled={confirmingLoad}
                  style={{padding:'10px 22px',background:confirmingLoad?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {confirmingLoad?'⏳ Confirming…':'✅ Confirm & Move to Students'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
