import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const tAPI = {
  getRoutes:    ()      => api.get('/transport/routes'),
  createRoute:  (d)     => api.post('/transport/routes', d),
  updateRoute:  (id, d) => api.put('/transport/routes/'+id, d),
  getVehicles:  ()      => api.get('/transport/vehicles'),
  createVehicle:(d)     => api.post('/transport/vehicles', d),
  updateVehicle:(id, d) => api.put('/transport/vehicles/'+id, d),
};
const empAPI = { getDrivers: () => api.get('/employees?limit=200') };

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };
const th  = { padding:'10px 14px', textAlign:'left', background:'#F9FAFB', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap' };
const td  = { padding:'10px 14px', borderBottom:'0.5px solid #F3F4F6', fontSize:12 };

export default function Transport() {
  const [tab,      setTab]      = useState('routes');
  const [routes,   setRoutes]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddVeh,   setShowAddVeh]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [routeForm, setRouteForm] = useState({ name:'', no:'', start:'School', end:'', dist:'', fee:'' });
  const [editRoute, setEditRoute] = useState(null);   // route being edited
  const [editVeh,   setEditVeh]   = useState(null);   // vehicle being edited
  const [vehForm,   setVehForm]   = useState({ regno:'', type:'school_bus', model:'', capacity:'', routeId:'', driverId:'', fitness:'', insurance:'' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [rRes, vRes] = await Promise.all([tAPI.getRoutes(), tAPI.getVehicles()]);
      setRoutes(rRes.data.data || []);
      setVehicles(vRes.data.data || []);
    } catch (err) {
      setError('Cannot connect to backend: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    empAPI.getDrivers().then(r => setDrivers(r.data.data||[])).catch(()=>{});
  }, [load]);

  const handleAddRoute = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tAPI.createRoute({ routeName:routeForm.name, routeNo:routeForm.no||undefined, startPoint:routeForm.start||undefined, endPoint:routeForm.end||undefined, distanceKm:parseFloat(routeForm.dist)||undefined, monthlyFee:parseFloat(routeForm.fee)||undefined });
      toast.success('✅ Route saved to database!');
      setShowAddRoute(false); setRouteForm({ name:'', no:'', start:'School', end:'', dist:'', fee:'' }); load();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tAPI.createVehicle({ registrationNo:vehForm.regno, vehicleType:vehForm.type, makeModel:vehForm.model||undefined, capacity:parseInt(vehForm.capacity)||undefined, routeId:vehForm.routeId||undefined, driverId:vehForm.driverId||undefined, fitnessExpiry:vehForm.fitness||undefined, insuranceExpiry:vehForm.insurance||undefined });
      toast.success('✅ Vehicle saved to database!');
      setShowAddVeh(false); setVehForm({ regno:'', type:'school_bus', model:'', capacity:'', routeId:'', driverId:'', fitness:'', insurance:'' }); load();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleEditRoute = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tAPI.updateRoute(editRoute.id, {
        routeName:  routeForm.name, routeNo: routeForm.no||undefined,
        startPoint: routeForm.start||undefined, endPoint: routeForm.end||undefined,
        distanceKm: parseFloat(routeForm.dist)||undefined,
        monthlyFee: parseFloat(routeForm.fee)||undefined,
      });
      toast.success('✅ Route updated in database!');
      setEditRoute(null); setRouteForm({ name:'', no:'', start:'School', end:'', dist:'', fee:'' }); load();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tAPI.updateVehicle(editVeh.id, {
        registrationNo: vehForm.regno, vehicleType: vehForm.type,
        makeModel: vehForm.model||undefined, capacity: parseInt(vehForm.capacity)||undefined,
        routeId: vehForm.routeId||undefined, driverId: vehForm.driverId||undefined,
        fitnessExpiry: vehForm.fitness||undefined, insuranceExpiry: vehForm.insurance||undefined,
      });
      toast.success('✅ Vehicle updated in database!');
      setEditVeh(null); setVehForm({ regno:'', type:'school_bus', model:'', capacity:'', routeId:'', driverId:'', fitness:'', insurance:'' }); load();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Transport Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {routes.length} routes · {vehicles.length} vehicles &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {tab==='routes'   && <button onClick={()=>setShowAddRoute(true)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}><><i className="ti ti-plus" style={{fontSize:16}}/> Add Route</></button>}
          {tab==='vehicles' && <button onClick={()=>setShowAddVeh(true)}   style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>+ Add Vehicle</button>}
        </div>
      </div>

      {error && <div style={{padding:'12px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,color:'#DC2626',fontSize:13,marginBottom:16}}>❌ {error}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[['Routes',routes.length,'#EDE9F8','#1E1B4B'],['Vehicles',vehicles.length,'#DBEAFE','#1E40AF'],['Active Vehicles',vehicles.filter(v=>v.is_active!==false).length,'#D1FAE5','#065F46'],['Expiring Soon',vehicles.filter(v=>v.fitness_expiry&&v.fitness_expiry<=today).length,'#FEE2E2','#991B1B']].map(([l,v,bg,c])=>(
          <div key={l} style={{padding:'14px',background:bg,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:c,marginTop:4,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:0}}>
        {[['routes','🚌 Routes'],['vehicles','🚍 Vehicles']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:'10px 20px',border:'none',borderBottom:tab===key?'2px solid #1E1B4B':'2px solid transparent',background:'transparent',color:tab===key?'#1E1B4B':'#6B7280',fontSize:13,fontWeight:tab===key?700:500,cursor:'pointer',marginBottom:-2}}>{label}</button>
        ))}
      </div>

      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:'0 0 14px 14px',overflow:'hidden'}}>
        {loading ? <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading from database…</div> : <>

          {tab==='routes' && (routes.length===0
            ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:10}}>🚌</div><div style={{fontWeight:600,color:'#6B7280'}}>No routes yet — click "<><i className="ti ti-plus" style={{fontSize:16}}/> Add Route</>"</div></div>
            : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>{['Route No','Route Name','From','To','Distance','Monthly Fee','Vehicles','Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{routes.map((r,i)=>(
                  <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{r.route_no||'—'}</td>
                    <td style={{...td,fontWeight:700,color:'#111827'}}>{r.route_name}</td>
                    <td style={td}>{r.start_point||'—'}</td>
                    <td style={td}>{r.end_point||'—'}</td>
                    <td style={td}>{r.distance_km?r.distance_km+' km':'—'}</td>
                    <td style={{...td,fontWeight:700}}>₹{Number(r.monthly_fee||0).toLocaleString('en-IN')}</td>
                    <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600}}>{r.vehicle_count||0} vehicles</span></td>
                    <td style={td}><button onClick={()=>{setEditRoute(r);setRouteForm({name:r.route_name,no:r.route_no||'',start:r.start_point||'School',end:r.end_point||'',dist:String(r.distance_km||''),fee:String(r.monthly_fee||'')});}} style={{padding:'4px 10px',border:'1px solid #1E1B4B',borderRadius:6,background:'#EDE9F8',color:'#1E1B4B',fontSize:11,cursor:'pointer',fontWeight:600}}>✏️ Edit</button></td>
                  </tr>
                ))}</tbody>
              </table>
          )}

          {tab==='vehicles' && (vehicles.length===0
            ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:10}}>🚍</div><div style={{fontWeight:600,color:'#6B7280'}}>No vehicles yet — click "+ Add Vehicle"</div></div>
            : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>{['Reg No','Type','Make/Model','Capacity','Route','Driver','Fitness','Insurance','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{vehicles.map((v,i)=>{
                  const fitExp = v.fitness_expiry && v.fitness_expiry<=today;
                  const insExp = v.insurance_expiry && v.insurance_expiry<=today;
                  return <tr key={v.id} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{...td,fontFamily:'monospace',fontWeight:700,color:'#1E1B4B'}}>{v.registration_no}</td>
                    <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600}}>{(v.vehicle_type||'school_bus').replace('_',' ')}</span></td>
                    <td style={td}>{v.make_model||'—'}</td>
                    <td style={{...td,textAlign:'center'}}>{v.capacity||'—'}</td>
                    <td style={td}>{v.route_name||'—'}</td>
                    <td style={td}>{v.driver_name?.trim()||'—'}</td>
                    <td style={td}><span style={{color:fitExp?'#DC2626':'#065F46',fontWeight:600}}>{fitExp?'⚠️ ':''}{v.fitness_expiry||'—'}</span></td>
                    <td style={td}><span style={{color:insExp?'#DC2626':'#065F46',fontWeight:600}}>{insExp?'⚠️ ':''}{v.insurance_expiry||'—'}</span></td>
                    <td style={td}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,background:v.is_active!==false?'#D1FAE5':'#FEE2E2',color:v.is_active!==false?'#065F46':'#991B1B'}}>{v.is_active!==false?'Active':'Inactive'}</span></td>
                  </tr>;
                })}</tbody>
              </table>
          )}
        </>}
      </div>

      {/* Add Route Modal */}
      {showAddRoute && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:520,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>🚌 Add Transport Route</div>
              <button onClick={()=>setShowAddRoute(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleAddRoute} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Route Name *</label><input required value={routeForm.name} onChange={e=>setRouteForm({...routeForm,name:e.target.value})} placeholder="e.g. Route A - Gomti Nagar" style={inp} autoFocus/></div>
                <div><label style={lbl}>Route No.</label><input value={routeForm.no} onChange={e=>setRouteForm({...routeForm,no:e.target.value})} placeholder="e.g. R01" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Start Point</label><input value={routeForm.start} onChange={e=>setRouteForm({...routeForm,start:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>End Point</label><input value={routeForm.end} onChange={e=>setRouteForm({...routeForm,end:e.target.value})} placeholder="Area/locality" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Distance (km)</label><input type="number" step="0.1" value={routeForm.dist} onChange={e=>setRouteForm({...routeForm,dist:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Monthly Fee (₹)</label><input type="number" value={routeForm.fee} onChange={e=>setRouteForm({...routeForm,fee:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAddRoute(false)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',display:'flex',alignItems:'center',gap:6,background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>{saving?'Saving…':'Save Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVeh && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:560,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>🚍 Add Vehicle</div>
              <button onClick={()=>setShowAddVeh(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleAddVehicle} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Registration No. *</label><input required value={vehForm.regno} onChange={e=>setVehForm({...vehForm,regno:e.target.value})} placeholder="e.g. UP32AB1234" style={inp} autoFocus/></div>
                <div><label style={lbl}>Type *</label>
                  <select value={vehForm.type} onChange={e=>setVehForm({...vehForm,type:e.target.value})} style={inp}>
                    <option value="school_bus">School Bus</option>
                    <option value="van">Van</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Make / Model</label><input value={vehForm.model} onChange={e=>setVehForm({...vehForm,model:e.target.value})} placeholder="e.g. Tata Starbus" style={inp}/></div>
                <div><label style={lbl}>Capacity (seats)</label><input type="number" value={vehForm.capacity} onChange={e=>setVehForm({...vehForm,capacity:e.target.value})} placeholder="e.g. 40" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Assign Route</label>
                  <select value={vehForm.routeId} onChange={e=>setVehForm({...vehForm,routeId:e.target.value})} style={inp}>
                    <option value="">No route</option>
                    {routes.map(r=><option key={r.id} value={r.id}>{r.route_name}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Driver (Employee)</label>
                  <select value={vehForm.driverId} onChange={e=>setVehForm({...vehForm,driverId:e.target.value})} style={inp}>
                    <option value="">No driver assigned</option>
                    {drivers.map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name||''} ({d.employee_id})</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Fitness Expiry</label><input type="date" value={vehForm.fitness} onChange={e=>setVehForm({...vehForm,fitness:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Insurance Expiry</label><input type="date" value={vehForm.insurance} onChange={e=>setVehForm({...vehForm,insurance:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAddVeh(false)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',display:'flex',alignItems:'center',gap:6,background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>{saving?'Saving…':'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ROUTE MODAL ── */}
      {editRoute && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:520,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>✏️ Edit Route — {editRoute.route_name}</div>
              <button onClick={()=>setEditRoute(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleEditRoute} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Route Name *</label><input required value={routeForm.name} onChange={e=>setRouteForm({...routeForm,name:e.target.value})} style={inp} autoFocus/></div>
                <div><label style={lbl}>Route No.</label><input value={routeForm.no} onChange={e=>setRouteForm({...routeForm,no:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Start Point</label><input value={routeForm.start} onChange={e=>setRouteForm({...routeForm,start:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>End Point</label><input value={routeForm.end} onChange={e=>setRouteForm({...routeForm,end:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Distance (km)</label><input type="number" step="0.1" value={routeForm.dist} onChange={e=>setRouteForm({...routeForm,dist:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Monthly Fee (₹)</label><input type="number" value={routeForm.fee} onChange={e=>setRouteForm({...routeForm,fee:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setEditRoute(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',display:'flex',alignItems:'center',gap:6,background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>{saving?'Saving…':'💾 Update Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT VEHICLE MODAL ── */}
      {editVeh && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:560,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>✏️ Edit Vehicle — {editVeh.registration_no}</div>
              <button onClick={()=>setEditVeh(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleEditVehicle} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Registration No. *</label><input required value={vehForm.regno} onChange={e=>setVehForm({...vehForm,regno:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Type</label>
                  <select value={vehForm.type} onChange={e=>setVehForm({...vehForm,type:e.target.value})} style={inp}>
                    <option value="school_bus">School Bus</option>
                    <option value="van">Van</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Make / Model</label><input value={vehForm.model} onChange={e=>setVehForm({...vehForm,model:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Capacity (seats)</label><input type="number" value={vehForm.capacity} onChange={e=>setVehForm({...vehForm,capacity:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Assign Route</label>
                  <select value={vehForm.routeId} onChange={e=>setVehForm({...vehForm,routeId:e.target.value})} style={inp}>
                    <option value="">No route</option>
                    {routes.map(r=><option key={r.id} value={r.id}>{r.route_name}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Driver (Employee)</label>
                  <select value={vehForm.driverId} onChange={e=>setVehForm({...vehForm,driverId:e.target.value})} style={inp}>
                    <option value="">No driver</option>
                    {drivers.map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name||''} ({d.employee_id})</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Fitness Expiry</label><input type="date" value={vehForm.fitness} onChange={e=>setVehForm({...vehForm,fitness:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Insurance Expiry</label><input type="date" value={vehForm.insurance} onChange={e=>setVehForm({...vehForm,insurance:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setEditVeh(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',display:'flex',alignItems:'center',gap:6,background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>{saving?'Saving…':'💾 Update Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
