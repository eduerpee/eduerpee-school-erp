import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { schoolAPI } from '../services/api';
import { useResponsive } from '../utils/responsive';
import toast from 'react-hot-toast';

const regAPI = {
  getAll:  ()      => api.get('/registrations'),
  create:  (d)     => api.post('/registrations', d),
  update:  (id, d) => api.put('/registrations/'+id, d),
  delete:  (id)    => api.delete('/registrations/'+id),
  convert: (id)    => api.post('/registrations/'+id+'/convert'),
};

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

const BLANK = {
  firstName:'', lastName:'', dateOfBirth:'', gender:'', bloodGroup:'',
  classId:'', sectionId:'', parentName:'', parentPhone:'', parentEmail:'',
  address:'', category:'', photoUrl:'', previousSchool:'', remarks:''
};

export default function Registration() {
  const { isMobile } = useResponsive();
  const [registrations, setRegistrations] = useState([]);
  const [classes,       setClasses]       = useState([]);
  const [sections,      setSections]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editReg,       setEditReg]       = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [converting,    setConverting]    = useState(null);
  const [search,        setSearch]        = useState('');
  const [form,          setForm]          = useState(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await regAPI.getAll();
      setRegistrations(res.data.data || []);
    } catch(err) {
      toast.error('Failed to load: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    schoolAPI.getClasses()
      .then(r => setClasses(r.data.data || []))
      .catch(() => {});
  }, [load]);

  useEffect(() => {
    if (form.classId) {
      api.get('/schools/sections?classId=' + form.classId)
        .then(r => setSections(r.data.data || []))
        .catch(() => setSections([]));
    } else { setSections([]); }
  }, [form.classId]);

  const openAdd = () => { setForm(BLANK); setEditReg(null); setShowForm(true); };

  const openEdit = (reg) => {
    setForm({
      firstName:      reg.first_name      || '',
      lastName:       reg.last_name       || '',
      dateOfBirth:    reg.date_of_birth ? reg.date_of_birth.split('T')[0] : '',
      gender:         reg.gender          || '',
      bloodGroup:     reg.blood_group     || '',
      classId:        reg.class_id        || '',
      sectionId:      reg.section_id      || '',
      parentName:     reg.parent_name     || '',
      parentPhone:    reg.parent_phone    || '',
      parentEmail:    reg.parent_email    || '',
      address:        reg.address         || '',
      category:       reg.category        || '',
      photoUrl:       reg.photo_url       || '',
      previousSchool: reg.previous_school || '',
      remarks:        reg.remarks         || '',
    });
    setEditReg(reg); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) { toast.error('First name required'); return; }
    if (!form.parentPhone.trim()) { toast.error('Parent phone required'); return; }
    setSaving(true);
    try {
      const payload = {
        firstName:      form.firstName.trim(),
        lastName:       form.lastName.trim()||undefined,
        dateOfBirth:    form.dateOfBirth||undefined,
        gender:         form.gender||undefined,
        bloodGroup:     form.bloodGroup||undefined,
        classId:        form.classId||undefined,
        sectionId:      form.sectionId||undefined,
        parentName:     form.parentName.trim()||undefined,
        parentPhone:    form.parentPhone.trim(),
        parentEmail:    form.parentEmail.trim()||undefined,
        address:        form.address.trim()||undefined,
        category:       form.category||undefined,
        photoUrl:       form.photoUrl.trim()||undefined,
        previousSchool: form.previousSchool.trim()||undefined,
        remarks:        form.remarks.trim()||undefined,
      };
      if (editReg) {
        await regAPI.update(editReg.id, payload);
        toast.success('✅ Registration updated!');
      } else {
        await regAPI.create(payload);
        toast.success('✅ Registration added!');
      }
      setShowForm(false); setEditReg(null); setForm(BLANK); load();
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (reg) => {
    if (!window.confirm(`Delete registration of ${reg.first_name}?`)) return;
    try { await regAPI.delete(reg.id); toast.success('Deleted'); load(); }
    catch(err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleConvert = async (reg) => {
    if (!window.confirm(
      `Admit ${reg.first_name} ${reg.last_name||''} as Student?\n\nThis will create a student record with auto admission number.`
    )) return;
    setConverting(reg.id);
    try {
      const res = await regAPI.convert(reg.id);
      const admNo = res.data?.data?.admissionNo || res.data?.data?.student?.admission_no || '';
      toast.success(`🎉 Admitted! Admission No: ${admNo}`);
      load();
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setConverting(null); }
  };

  const filtered = registrations.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [r.first_name, r.last_name, r.parent_phone, r.parent_name, r.class_name]
      .join(' ').toLowerCase().includes(s);
  });

  const pending  = filtered.filter(r => r.status !== 'admitted');
  const admitted = filtered.filter(r => r.status === 'admitted');

  const stColor = (s) => {
    if (s === 'admitted') return { bg:'#D1FAE5', c:'#065F46' };
    if (s === 'approved') return { bg:'#DBEAFE', c:'#1E40AF' };
    return { bg:'#FEF3C7', c:'#92400E' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:isMobile?17:20, fontWeight:700, color:'#111827' }}>Registration</h2>
          <p style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
            {pending.length} pending · {admitted.length} admitted &nbsp;
            <span style={{ padding:'2px 8px', background:'#D1FAE5', color:'#065F46', borderRadius:10, fontSize:10, fontWeight:700 }}>🟢 Live DB</span>
          </p>
        </div>
        <button onClick={openAdd}
          style={{ padding:'10px 20px', background:'#1E1B4B', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + New Registration
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search by name, phone, class…"
        style={{ ...inp, width:isMobile?'100%':320, marginBottom:16 }}/>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total',    value:registrations.length, bg:'#EDE9F8', c:'#4C1D95' },
          { label:'Pending',  value:pending.length,       bg:'#FEF3C7', c:'#92400E' },
          { label:'Admitted', value:admitted.length,      bg:'#D1FAE5', c:'#065F46' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.value}</div>
            <div style={{ fontSize:11, color:s.c, opacity:.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'#9CA3AF' }}>⏳ Loading registrations…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:64, textAlign:'center', background:'#F9FAFB', borderRadius:14, border:'2px dashed #E5E7EB' }}>
          <div style={{ fontSize:48, marginBottom:10 }}>📋</div>
          <div style={{ fontWeight:700, color:'#374151' }}>No registrations found</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>
            {search ? 'Try different search' : 'Click "+ New Registration" to add'}
          </div>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#111827', marginBottom:10 }}>
                ⏳ Pending Admissions ({pending.length})
              </div>
              <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, overflow:'hidden' }}>
                {isMobile ? (
                  pending.map((reg, idx) => (
                    <div key={reg.id} style={{ padding:'14px', borderBottom:idx < pending.length-1 ? '0.5px solid #F3F4F6' : 'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#111827' }}>{reg.first_name} {reg.last_name||''}</div>
                          <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{reg.parent_name} · {reg.parent_phone}</div>
                          {reg.class_name && <div style={{ fontSize:11, color:'#6B7280' }}>Class: {reg.class_name}</div>}
                        </div>
                        <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'#FEF3C7', color:'#92400E' }}>Pending</span>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => handleConvert(reg)} disabled={!!converting}
                          style={{ flex:1, padding:'8px', background:'#1E1B4B', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          {converting === reg.id ? '⏳ Admitting…' : '🎓 Admit Student'}
                        </button>
                        <button onClick={() => openEdit(reg)}
                          style={{ padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:8, background:'#F9FAFB', fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => handleDelete(reg)}
                          style={{ padding:'8px 12px', border:'1px solid #FEE2E2', borderRadius:8, background:'#FFF5F5', color:'#DC2626', fontSize:12, cursor:'pointer' }}>🗑</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#F9FAFB' }}>
                        {['Student Name','Parent','Phone','Class','Remarks','Status','Actions'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map(reg => {
                        const sc = stColor(reg.status);
                        return (
                          <tr key={reg.id}
                            onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
                            onMouseLeave={e => e.currentTarget.style.background=''}>
                            <td style={{ padding:'11px 14px', fontWeight:600, color:'#111827' }}>
                              {reg.first_name} {reg.last_name||''}
                            </td>
                            <td style={{ padding:'11px 14px', color:'#6B7280' }}>{reg.parent_name||'—'}</td>
                            <td style={{ padding:'11px 14px', color:'#6B7280' }}>{reg.parent_phone||'—'}</td>
                            <td style={{ padding:'11px 14px', color:'#6B7280' }}>{reg.class_name||'—'}</td>
                            <td style={{ padding:'11px 14px', color:'#9CA3AF', fontSize:11, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reg.remarks||'—'}</td>
                            <td style={{ padding:'11px 14px' }}>
                              <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:sc.bg, color:sc.c, textTransform:'capitalize' }}>
                                {reg.status||'pending'}
                              </span>
                            </td>
                            <td style={{ padding:'11px 14px' }}>
                              <div style={{ display:'flex', gap:6 }}>
                                <button onClick={() => handleConvert(reg)} disabled={!!converting}
                                  style={{ padding:'6px 14px', background: converting===reg.id?'#9CA3AF':'#1E1B4B', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  {converting === reg.id ? '⏳ Admitting…' : '🎓 Admit'}
                                </button>
                                <button onClick={() => openEdit(reg)}
                                  style={{ padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:7, background:'#F9FAFB', fontSize:12, cursor:'pointer' }}>✏️</button>
                                <button onClick={() => handleDelete(reg)}
                                  style={{ padding:'6px 10px', border:'1px solid #FEE2E2', borderRadius:7, background:'#FFF5F5', color:'#DC2626', fontSize:12, cursor:'pointer' }}>🗑</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Admitted */}
          {admitted.length > 0 && (
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#111827', marginBottom:10 }}>✅ Admitted ({admitted.length})</div>
              <div style={{ background:'#fff', border:'0.5px solid #E5E7EB', borderRadius:14, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#F0FDF4' }}>
                      {['Student Name','Parent','Phone','Class','Status'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#065F46', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #D1FAE5' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admitted.map(reg => (
                      <tr key={reg.id} style={{ opacity:.7 }}>
                        <td style={{ padding:'10px 14px', fontWeight:600, color:'#111827' }}>{reg.first_name} {reg.last_name||''}</td>
                        <td style={{ padding:'10px 14px', color:'#6B7280' }}>{reg.parent_name||'—'}</td>
                        <td style={{ padding:'10px 14px', color:'#6B7280' }}>{reg.parent_phone||'—'}</td>
                        <td style={{ padding:'10px 14px', color:'#6B7280' }}>{reg.class_name||'—'}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:'#D1FAE5', color:'#065F46' }}>✅ Admitted</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:600, maxHeight:'92vh', overflow:'auto' }}>
            <div style={{ padding:'16px 20px', borderBottom:'0.5px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{editReg ? '✏️ Edit Registration' : '📋 New Registration'}</div>
              <button onClick={() => { setShowForm(false); setEditReg(null); }}
                style={{ background:'#F3F4F6', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Student Information</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={lbl}>First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm({...form, firstName:e.target.value})} placeholder="First name" style={inp} autoFocus/></div>
                <div><label style={lbl}>Last Name</label>
                  <input value={form.lastName} onChange={e => setForm({...form, lastName:e.target.value})} placeholder="Last name" style={inp}/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={lbl}>Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender:e.target.value})} style={inp}>
                    <option value="">Select</option>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select></div>
                <div><label style={lbl}>Blood Group</label>
                  <select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup:e.target.value})} style={inp}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                  </select></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
                <div><label style={lbl}>Class</label>
                  <select value={form.classId} onChange={e => setForm({...form, classId:e.target.value, sectionId:''})} style={inp}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div><label style={lbl}>Section</label>
                  <select value={form.sectionId} onChange={e => setForm({...form, sectionId:e.target.value})} style={inp}>
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div><label style={lbl}>Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} style={inp}>
                    <option value="">Select</option>
                    {['general','obc','sc','st','other'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select></div>
              </div>

              <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Parent / Guardian</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={lbl}>Parent Name</label>
                  <input value={form.parentName} onChange={e => setForm({...form, parentName:e.target.value})} placeholder="Parent / guardian name" style={inp}/></div>
                <div><label style={lbl}>Phone *</label>
                  <input required type="tel" value={form.parentPhone} onChange={e => setForm({...form, parentPhone:e.target.value})} placeholder="Mobile number" style={inp}/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={lbl}>Email</label>
                  <input type="email" value={form.parentEmail} onChange={e => setForm({...form, parentEmail:e.target.value})} placeholder="Email (optional)" style={inp}/></div>
                <div><label style={lbl}>Previous School</label>
                  <input value={form.previousSchool} onChange={e => setForm({...form, previousSchool:e.target.value})} placeholder="Previous school name" style={inp}/></div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Address</label>
                <input value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Home address" style={inp}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Remarks</label>
                <input value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value})} placeholder="Any notes" style={inp}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditReg(null); }}
                  style={{ padding:'10px 18px', border:'1.5px solid #E5E7EB', borderRadius:9, background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding:'10px 24px', background:saving?'#9CA3AF':'#1E1B4B', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {saving ? '⏳ Saving…' : editReg ? '💾 Update' : '📋 Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
