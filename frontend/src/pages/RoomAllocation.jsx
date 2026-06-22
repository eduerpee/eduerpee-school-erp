import React, { useState, useEffect, useCallback } from 'react';
import { schoolAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const roomAPI = {
  getAll:      ()      => api.get('/rooms'),
  create:      (d)     => api.post('/rooms', d),
  update:      (id,d)  => api.put('/rooms/'+id, d),
  delete:      (id)    => api.delete('/rooms/'+id),
  allocate:    (id,d)  => api.post('/rooms/'+id+'/allocate', d),
  deallocate:  (id)    => api.delete('/rooms/'+id+'/allocate'),
};

const ROOM_TYPES = ['classroom','lab','library','office','hall','sports'];
const TYPE_ICONS  = { classroom:'ti-school', lab:'ti-microscope', library:'ti-books', office:'ti-building-skyscraper', hall:'ti-confetti', sports:'ti-ball-football' };
const TYPE_GRADS  = { classroom:'linear-gradient(135deg,#7B6FD4,#C4BAF2)', lab:'linear-gradient(135deg,#1260A8,#55A8EE)', library:'linear-gradient(135deg,#0E7A5F,#4DCBA6)', office:'linear-gradient(135deg,#C17E10,#F0BF50)', hall:'linear-gradient(135deg,#9C2D50,#E87FA0)', sports:'linear-gradient(135deg,#0E7A5F,#4DCBA6)' };
const TYPE_COLORS = { classroom:['#EDE9F8','#4C1D95'], lab:['#DBEAFE','#1E40AF'], library:['#D1FAE5','#065F46'], office:['#FEF3C7','#92400E'], hall:['#FCE7F3','#9D174D'], sports:['#D1FAE5','#065F46'] };

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };

export default function RoomAllocation() {
  const [rooms,      setRooms]      = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [sections,   setSections]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editRoom,   setEditRoom]   = useState(null);
  const [allocRoom,  setAllocRoom]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search,     setSearch]     = useState('');

  const [form, setForm] = useState({ roomNo:'', roomName:'', floor:'', capacity:'40', roomType:'classroom' });
  const [allocForm, setAllocForm] = useState({ classId:'', sectionId:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, classesRes] = await Promise.all([
        roomAPI.getAll(),
        schoolAPI.getClasses(),
      ]);
      setRooms(roomsRes.data.data || []);
      setClasses(classesRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load sections when class selected in allocate
  useEffect(() => {
    if (allocForm.classId) {
      api.get('/schools/sections?classId='+allocForm.classId)
        .then(r => setSections(r.data.data||[]))
        .catch(() => setSections([]));
    } else { setSections([]); }
  }, [allocForm.classId]);

  const openEdit = (room) => {
    setForm({ roomNo:room.room_no, roomName:room.room_name||'', floor:room.floor||'', capacity:String(room.capacity||40), roomType:room.room_type||'classroom' });
    setEditRoom(room);
    setShowAdd(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.roomNo.trim()) { toast.error('Room number required'); return; }
    setSaving(true);
    try {
      const payload = { roomNo:form.roomNo.trim(), roomName:form.roomName||undefined, floor:form.floor||undefined, capacity:parseInt(form.capacity)||40, roomType:form.roomType };
      if (editRoom) {
        await roomAPI.update(editRoom.id, payload);
        toast.success('✅ Room updated!');
      } else {
        await roomAPI.create(payload);
        toast.success('✅ Room created!');
      }
      setShowAdd(false); setEditRoom(null);
      setForm({ roomNo:'', roomName:'', floor:'', capacity:'40', roomType:'classroom' });
      load();
    } catch (err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocForm.classId) { toast.error('Please select a class'); return; }
    setSaving(true);
    try {
      await roomAPI.allocate(allocRoom.id, { classId: allocForm.classId, sectionId: allocForm.sectionId||undefined });
      toast.success('✅ Class allocated to ' + allocRoom.room_no);
      setAllocRoom(null);
      setAllocForm({ classId:'', sectionId:'' });
      load();
    } catch (err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDeallocate = async (room) => {
    if (!window.confirm(`Remove allocation from ${room.room_no}?`)) return;
    try {
      await roomAPI.deallocate(room.id);
      toast.success('Allocation removed');
      load();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete Room ${room.room_no}?`)) return;
    try { await roomAPI.delete(room.id); toast.success('Room deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const filtered = rooms.filter(r =>
    (!filterType || r.room_type === filterType) &&
    (!search || r.room_no.toLowerCase().includes(search.toLowerCase()) || (r.room_name||'').toLowerCase().includes(search.toLowerCase()) || (r.class_name||'').toLowerCase().includes(search.toLowerCase()))
  );

  const allocated   = filtered.filter(r => r.class_name);
  const unallocated = filtered.filter(r => !r.class_name);

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Room Allocation</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {rooms.length} rooms · {allocated.length} allocated · {unallocated.length} available &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        <button onClick={()=>{setEditRoom(null);setForm({roomNo:'',roomName:'',floor:'',capacity:'40',roomType:'classroom'});setShowAdd(true);}}
          style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>
          <i className="ti ti-plus" style={{fontSize:16}}/> Add Room
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #E5E7EB',borderRadius:10,padding:'8px 14px',width:240}}>
          <i className="ti ti-search" style={{fontSize:16,color:'#9CA3AF'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search room, class…"
            style={{border:'none',outline:'none',fontSize:13,background:'transparent',width:'100%',fontFamily:'inherit'}}/>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setFilterType('')}
            style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:20,border:'none',background:filterType===''?'linear-gradient(135deg,#7B6FD4,#534AB7)':'#fff',color:filterType===''?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',boxShadow:filterType===''?'0 3px 8px rgba(123,111,212,0.35)':'0 1px 3px rgba(0,0,0,0.06)',outline:filterType!==''?'1px solid #E5E7EB':'none'}}>
            <i className="ti ti-layout-grid" style={{fontSize:13}}/> All
          </button>
          {ROOM_TYPES.map(t=>(
            <button key={t} onClick={()=>setFilterType(filterType===t?'':t)}
              style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:20,border:'none',background:filterType===t?'linear-gradient(135deg,#7B6FD4,#534AB7)':'#fff',color:filterType===t?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',boxShadow:filterType===t?'0 3px 8px rgba(123,111,212,0.35)':'0 1px 3px rgba(0,0,0,0.06)',outline:filterType!==t?'1px solid #E5E7EB':'none',textTransform:'capitalize'}}>
              <i className={'ti '+TYPE_ICONS[t]} style={{fontSize:13,color:filterType===t?'white':undefined}}/> {t}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading rooms…</div>
        : <>
            {/* Summary stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
              {[
                { label:'Total Rooms',    value:rooms.length,                                              icon:'ti-building',  grad:'linear-gradient(135deg,#7B6FD4,#C4BAF2)', c:'#534AB7' },
                { label:'Allocated',      value:rooms.filter(r=>r.class_name).length,                     icon:'ti-circle-check',grad:'linear-gradient(135deg,#0E7A5F,#4DCBA6)',c:'#0F6E56' },
                { label:'Available',      value:rooms.filter(r=>!r.class_name).length,                    icon:'ti-door',      grad:'linear-gradient(135deg,#C17E10,#F0BF50)', c:'#BA7517' },
                { label:'Total Seats',    value:rooms.reduce((s,r)=>s+(r.capacity||0),0),                 icon:'ti-armchair',  grad:'linear-gradient(135deg,#1260A8,#55A8EE)', c:'#185FA5' },
              ].map(s=>(
                <div key={s.label} style={{borderRadius:16,overflow:'hidden',boxShadow:'0 2px 14px rgba(0,0,0,0.08)',background:'#fff'}}>
                  <div style={{height:4,background:s.grad}}/>
                  <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,borderRadius:11,background:s.grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <i className={'ti '+s.icon} style={{fontSize:22,color:'white'}}/>
                    </div>
                    <div>
                      <div style={{fontSize:20,fontWeight:700,color:s.c,lineHeight:1}}>{s.value}</div>
                      <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Allocated Rooms */}
            {allocated.length > 0 && (
              <div style={{marginBottom:24}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <div style={{width:28,height:28,background:'#D1FAE5',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className="ti ti-circle-check" style={{fontSize:15,color:'#065F46'}}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#111827'}}>Allocated</span>
                  <span style={{background:'#D1FAE5',color:'#065F46',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700}}>{allocated.length}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {allocated.map(room => {
                    const [bg,col] = TYPE_COLORS[room.room_type]||TYPE_COLORS.classroom;
                    return (
                      <div key={room.id} style={{borderRadius:16,overflow:'hidden',boxShadow:'0 2px 14px rgba(0,0,0,0.08)',background:'#fff'}}>
                        <div style={{background:TYPE_GRADS[room.room_type]||TYPE_GRADS.classroom,height:70,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                          <i className={'ti '+(TYPE_ICONS[room.room_type]||'ti-school')} style={{fontSize:36,color:'white',opacity:0.9}}/>
                          <span style={{position:'absolute',top:9,left:12,color:'white',fontSize:15,fontWeight:800}}>{room.room_no}</span>
                          <span style={{position:'absolute',top:9,right:10,background:'rgba(255,255,255,0.25)',color:'white',padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,textTransform:'capitalize'}}>{room.room_type}</span>
                        </div>
                        <div style={{padding:'10px 14px'}}>
                          {room.room_name && <div style={{fontWeight:700,fontSize:13,color:'#111827',marginBottom:2}}>{room.room_name}</div>}
                          <div style={{fontSize:11,color:'#9CA3AF',marginBottom:1}}>{room.floor||'—'}</div>
                          <div style={{fontSize:11,color:'#9CA3AF',marginBottom:9,display:'flex',alignItems:'center',gap:4}}><i className="ti ti-armchair" style={{fontSize:12}}/>{room.capacity} seats</div>
                          <div style={{padding:'7px 10px',background:'#D1FAE5',borderRadius:8,marginBottom:9,display:'flex',alignItems:'center',gap:6}}>
                            <i className="ti ti-school" style={{fontSize:13,color:'#065F46'}}/>
                            <span style={{fontWeight:700,color:'#065F46',fontSize:12}}>{room.class_name}{room.section_name?` — Section ${room.section_name}`:''}</span>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>{setAllocRoom(room);setAllocForm({classId:room.class_id||'',sectionId:room.section_id||'',});}}
                              style={{flex:1,padding:'6px',border:'1px solid #FEF3C7',borderRadius:8,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                              <i className="ti ti-refresh" style={{fontSize:13}}/> Reallocate
                            </button>
                            <button onClick={()=>handleDeallocate(room)}
                              style={{padding:'6px 10px',border:'1px solid #FEE2E2',borderRadius:8,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer'}}>
                              <i className="ti ti-x" style={{fontSize:13}}/>
                            </button>
                            <button onClick={()=>openEdit(room)}
                              style={{padding:'6px 10px',border:'1px solid #E5E7EB',borderRadius:8,background:'#F9FAFB',fontSize:11,cursor:'pointer'}}>
                              <i className="ti ti-edit" style={{fontSize:13,color:'#6B7280'}}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Rooms */}
            {unallocated.length > 0 && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <div style={{width:28,height:28,background:'#FEF3C7',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className="ti ti-door" style={{fontSize:15,color:'#92400E'}}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#111827'}}>Available</span>
                  <span style={{background:'#FEF3C7',color:'#92400E',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700}}>{unallocated.length}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {unallocated.map(room => {
                    const [bg,col] = TYPE_COLORS[room.room_type]||TYPE_COLORS.classroom;
                    return (
                      <div key={room.id} style={{borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,0.05)',background:'#fff',border:'1.5px dashed #D1D5DB'}}>
                        <div style={{background:TYPE_GRADS[room.room_type]||TYPE_GRADS.classroom,height:70,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',opacity:0.88}}>
                          <i className={'ti '+(TYPE_ICONS[room.room_type]||'ti-school')} style={{fontSize:36,color:'white',opacity:0.9}}/>
                          <span style={{position:'absolute',top:9,left:12,color:'white',fontSize:15,fontWeight:800}}>{room.room_no}</span>
                          <span style={{position:'absolute',top:9,right:10,background:'rgba(255,255,255,0.25)',color:'white',padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,textTransform:'capitalize'}}>{room.room_type}</span>
                        </div>
                        <div style={{padding:'10px 14px'}}>
                          {room.room_name && <div style={{fontWeight:700,fontSize:13,color:'#111827',marginBottom:2}}>{room.room_name}</div>}
                          <div style={{fontSize:11,color:'#9CA3AF',marginBottom:1}}>{room.floor||'—'}</div>
                          <div style={{fontSize:11,color:'#9CA3AF',marginBottom:9,display:'flex',alignItems:'center',gap:4}}><i className="ti ti-armchair" style={{fontSize:12}}/>{room.capacity} seats</div>
                          <div style={{padding:'6px 10px',background:'#F9FAFB',border:'1px dashed #E5E7EB',borderRadius:8,marginBottom:9,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                            <i className="ti ti-clock" style={{fontSize:12,color:'#9CA3AF'}}/><span style={{fontSize:11,color:'#9CA3AF'}}>Not Allocated</span>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>{setAllocRoom(room);setAllocForm({classId:'',sectionId:'',});}}
                              style={{flex:1,padding:'6px',border:'none',borderRadius:7,background:'#1E1B4B',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                              📌 Allocate Class
                            </button>
                            <button onClick={()=>openEdit(room)}
                              style={{padding:'6px 10px',border:'1px solid #E5E7EB',borderRadius:7,background:'#F9FAFB',fontSize:11,cursor:'pointer'}}>
                              ✏️
                            </button>
                            <button onClick={()=>handleDelete(room)}
                              style={{padding:'6px 10px',border:'1px solid #FEE2E2',borderRadius:7,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer'}}>
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{padding:64,textAlign:'center',background:'#F9FAFB',borderRadius:14,border:'2px dashed #E5E7EB'}}>
                <div style={{fontSize:48,marginBottom:10}}>🏫</div>
                <div style={{fontWeight:700,color:'#374151'}}>No rooms found</div>
                <div style={{fontSize:12,color:'#9CA3AF',marginTop:4}}>Add rooms using "+ Add Room" button</div>
              </div>
            )}
          </>
      }

      {/* ── ADD/EDIT ROOM MODAL ── */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:480,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>{editRoom?'✏️ Edit Room':'🏫 Add New Room'}</div>
              <button onClick={()=>{setShowAdd(false);setEditRoom(null);}} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Room No. *</label>
                  <input required value={form.roomNo} onChange={e=>setForm({...form,roomNo:e.target.value})} placeholder="e.g. 101, LAB1" style={inp} autoFocus/>
                </div>
                <div><label style={lbl}>Room Name</label>
                  <input value={form.roomName} onChange={e=>setForm({...form,roomName:e.target.value})} placeholder="e.g. Physics Lab" style={inp}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Floor / Location</label>
                  <input value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})} placeholder="e.g. Ground Floor" style={inp}/>
                </div>
                <div><label style={lbl}>Capacity (seats)</label>
                  <input type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} min="1" style={inp}/>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={lbl}>Room Type</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {ROOM_TYPES.map(t=>(
                    <button type="button" key={t} onClick={()=>setForm({...form,roomType:t})}
                      style={{padding:'8px 4px',border:'1.5px solid '+(form.roomType===t?'#1E1B4B':'#E5E7EB'),borderRadius:8,background:form.roomType===t?'#EDE9F8':'#fff',cursor:'pointer',fontSize:12,fontWeight:form.roomType===t?700:400,textTransform:'capitalize'}}>
                      <i className={'ti '+TYPE_ICONS[t]} style={{fontSize:13,color:filterType===t?'white':undefined}}/> {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>{setShowAdd(false);setEditRoom(null);}}
                  style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {saving?'⏳ Saving…':editRoom?'💾 Update Room':'🏫 Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ALLOCATE CLASS MODAL ── */}
      {allocRoom && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:420,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#EDE9F8'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'#1E1B4B'}}>📌 Allocate Room {allocRoom.room_no}</div>
                <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>{allocRoom.room_name||''} · Capacity: {allocRoom.capacity} seats</div>
              </div>
              <button onClick={()=>setAllocRoom(null)} style={{background:'rgba(255,255,255,.6)',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleAllocate} style={{padding:20}}>
              <div style={{marginBottom:14}}>
                <label style={lbl}>Class *</label>
                <select required value={allocForm.classId} onChange={e=>setAllocForm({...allocForm,classId:e.target.value,sectionId:''})} style={inp}>
                  <option value="">— Select Class —</option>
                  {classes.map(c=>(
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {sections.length > 0 && (
                <div style={{marginBottom:14}}>
                  <label style={lbl}>Section (optional)</label>
                  <select value={allocForm.sectionId} onChange={e=>setAllocForm({...allocForm,sectionId:e.target.value})} style={inp}>
                    <option value="">All Sections</option>
                    {sections.map(s=>(
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{padding:'10px 12px',background:'#FEF3C7',borderRadius:9,marginBottom:16,fontSize:11,color:'#92400E'}}>
                ⚠️ If this class is already allocated to another room, that allocation will be replaced.
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setAllocRoom(null)}
                  style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {saving?'⏳ Allocating…':'📌 Allocate Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
