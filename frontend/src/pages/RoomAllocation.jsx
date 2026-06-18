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
const TYPE_ICONS = { classroom:'🏫', lab:'🔬', library:'📚', office:'🏢', hall:'🎭', sports:'⚽' };
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
          style={{padding:'10px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
          + Add Room
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search room, class…"
          style={{...inp,width:220,display:'inline-block'}}/>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setFilterType('')}
            style={{padding:'7px 14px',borderRadius:20,border:'1.5px solid '+(filterType===''?'#1E1B4B':'#E5E7EB'),background:filterType===''?'#1E1B4B':'#fff',color:filterType===''?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer'}}>
            All
          </button>
          {ROOM_TYPES.map(t=>(
            <button key={t} onClick={()=>setFilterType(filterType===t?'':t)}
              style={{padding:'7px 14px',borderRadius:20,border:'1.5px solid '+(filterType===t?'#1E1B4B':'#E5E7EB'),background:filterType===t?'#1E1B4B':'#fff',color:filterType===t?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
              {TYPE_ICONS[t]} {t}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading rooms…</div>
        : <>
            {/* Summary stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
              {[
                { label:'Total Rooms',   value:rooms.length,                          bg:'#EDE9F8',c:'#4C1D95' },
                { label:'Allocated',     value:rooms.filter(r=>r.class_name).length,  bg:'#D1FAE5',c:'#065F46' },
                { label:'Available',     value:rooms.filter(r=>!r.class_name).length, bg:'#FEF3C7',c:'#92400E' },
                { label:'Total Capacity',value:rooms.reduce((s,r)=>s+(r.capacity||0),0)+'seats', bg:'#DBEAFE',c:'#1E40AF' },
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.value}</div>
                  <div style={{fontSize:11,color:s.c,marginTop:2,opacity:.8}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Allocated Rooms */}
            {allocated.length > 0 && (
              <div style={{marginBottom:24}}>
                <div style={{fontWeight:700,fontSize:14,color:'#111827',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{padding:'3px 10px',background:'#D1FAE5',color:'#065F46',borderRadius:20,fontSize:11}}>✅ Allocated ({allocated.length})</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {allocated.map(room => {
                    const [bg,col] = TYPE_COLORS[room.room_type]||TYPE_COLORS.classroom;
                    return (
                      <div key={room.id} style={{background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                        <div style={{background:bg,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <span style={{fontSize:20}}>{TYPE_ICONS[room.room_type]||'🏫'}</span>
                            <span style={{marginLeft:8,fontWeight:800,fontSize:15,color:col}}>{room.room_no}</span>
                          </div>
                          <span style={{fontSize:10,fontWeight:700,color:col,background:'rgba(255,255,255,.6)',padding:'2px 8px',borderRadius:10,textTransform:'capitalize'}}>{room.room_type}</span>
                        </div>
                        <div style={{padding:'10px 14px'}}>
                          {room.room_name && <div style={{fontWeight:600,fontSize:13,color:'#111827',marginBottom:4}}>{room.room_name}</div>}
                          <div style={{fontSize:11,color:'#6B7280',marginBottom:2}}>{room.floor||'—'}</div>
                          <div style={{fontSize:11,color:'#6B7280',marginBottom:8}}>Capacity: {room.capacity} seats</div>
                          <div style={{padding:'8px 10px',background:'#D1FAE5',borderRadius:8,marginBottom:10}}>
                            <div style={{fontWeight:700,color:'#065F46',fontSize:12}}>📚 {room.class_name} {room.section_name?`— Section ${room.section_name}`:''}</div>
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>{setAllocRoom(room);setAllocForm({classId:room.class_id||'',sectionId:room.section_id||'',});}}
                              style={{flex:1,padding:'6px',border:'1px solid #E5E7EB',borderRadius:7,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                              🔄 Reallocate
                            </button>
                            <button onClick={()=>handleDeallocate(room)}
                              style={{padding:'6px 10px',border:'1px solid #FEE2E2',borderRadius:7,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer'}}>
                              ✕
                            </button>
                            <button onClick={()=>openEdit(room)}
                              style={{padding:'6px 10px',border:'1px solid #E5E7EB',borderRadius:7,background:'#F9FAFB',fontSize:11,cursor:'pointer'}}>
                              ✏️
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
                <div style={{fontWeight:700,fontSize:14,color:'#111827',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{padding:'3px 10px',background:'#FEF3C7',color:'#92400E',borderRadius:20,fontSize:11}}>⬜ Available ({unallocated.length})</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {unallocated.map(room => {
                    const [bg,col] = TYPE_COLORS[room.room_type]||TYPE_COLORS.classroom;
                    return (
                      <div key={room.id} style={{background:'#fff',border:'1.5px dashed #D1D5DB',borderRadius:14,overflow:'hidden'}}>
                        <div style={{background:bg,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <span style={{fontSize:20}}>{TYPE_ICONS[room.room_type]||'🏫'}</span>
                            <span style={{marginLeft:8,fontWeight:800,fontSize:15,color:col}}>{room.room_no}</span>
                          </div>
                          <span style={{fontSize:10,fontWeight:700,color:col,background:'rgba(255,255,255,.6)',padding:'2px 8px',borderRadius:10,textTransform:'capitalize'}}>{room.room_type}</span>
                        </div>
                        <div style={{padding:'10px 14px'}}>
                          {room.room_name && <div style={{fontWeight:600,fontSize:13,color:'#111827',marginBottom:4}}>{room.room_name}</div>}
                          <div style={{fontSize:11,color:'#6B7280',marginBottom:2}}>{room.floor||'—'}</div>
                          <div style={{fontSize:11,color:'#6B7280',marginBottom:8}}>Capacity: {room.capacity} seats</div>
                          <div style={{padding:'6px 10px',background:'#F9FAFB',borderRadius:8,marginBottom:10,fontSize:11,color:'#9CA3AF',textAlign:'center'}}>
                            Not allocated
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
                      {TYPE_ICONS[t]} {t}
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
