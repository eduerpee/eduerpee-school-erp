import React, { useState, useEffect, useCallback } from 'react';
import { employeeAPI } from '../services/api';
import toast from 'react-hot-toast';

const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };
const TYPE_COLOR = { teaching:['#EDE9F8','#4C1D95'], administrative:['#DBEAFE','#1E40AF'], non_teaching:['#D1FAE5','#065F46'] };
const TYPE_LABEL = { teaching:'Teaching', non_teaching:'Non Teaching', administrative:'Administrative' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    firstName:'', lastName:'', type:'teaching', dept:'',
    designation:'', phone:'', email:'',
    joinDate: new Date().toISOString().split('T')[0],
    salary:'', qualification:''
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await employeeAPI.getAll({ search: search||undefined, limit:50 });
      setEmployees(res.data.data || []);
      setTotal(res.data.pagination?.total || res.data.data?.length || 0);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load employees';
      setError(msg);
      toast.error('❌ ' + msg);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await employeeAPI.create({
        firstName:    form.firstName,
        lastName:     form.lastName,
        employeeType: form.type,
        department:   form.dept,
        designation:  form.designation,
        phone:        form.phone,
        email:        form.email || undefined,
        joiningDate:  form.joinDate,
        basicSalary:  parseInt(form.salary) || 0,
        qualification: form.qualification || undefined,
      });
      toast.success('✅ Employee saved!');
      setShowAdd(false);
      setForm({ firstName:'', lastName:'', type:'teaching', dept:'', designation:'', phone:'', email:'', joinDate:new Date().toISOString().split('T')[0], salary:'', qualification:'' });
      load();
    } catch (err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const byType = (t) => employees.filter(e => e.employee_type === t).length;

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Employees</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {loading ? 'Loading…' : error ? '🔴 Error' : `${total} staff members`}
            &nbsp;
            {!loading && !error && <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>
          <i className="ti ti-plus" style={{fontSize:16}}/> Add Employee
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{padding:'12px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,color:'#DC2626',fontSize:13,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>❌ {error}</span>
          <button onClick={load} style={{padding:'4px 12px',background:'#DC2626',color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Total Staff',    value:employees.length,          icon:'ti-users',      grad:'linear-gradient(135deg,#7B6FD4,#C4BAF2)', color:'#534AB7' },
          { label:'Teaching',       value:byType('teaching'),        icon:'ti-school',     grad:'linear-gradient(135deg,#0E7A5F,#4DCBA6)', color:'#0F6E56' },
          { label:'Non Teaching',   value:byType('non_teaching'),    icon:'ti-tool',       grad:'linear-gradient(135deg,#C17E10,#F0BF50)', color:'#BA7517' },
          { label:'Administrative', value:byType('administrative'),  icon:'ti-briefcase',  grad:'linear-gradient(135deg,#1260A8,#55A8EE)', color:'#185FA5' },
        ].map(s => (
          <div key={s.label} style={{borderRadius:16,overflow:'hidden',boxShadow:'0 2px 14px rgba(0,0,0,0.08)',background:'#fff'}}>
            <div style={{height:4,background:s.grad}}/>
            <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:44,height:44,borderRadius:11,background:s.grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={'ti '+s.icon} style={{fontSize:22,color:'white'}}/>
              </div>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:s.color,lineHeight:1}}>{loading?'…':s.value}</div>
                <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #E5E7EB',borderRadius:10,padding:'8px 14px',width:280}}>
          <i className="ti ti-search" style={{fontSize:16,color:'#9CA3AF'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, employee ID..."
            style={{border:'none',outline:'none',fontSize:13,background:'transparent',width:'100%',fontFamily:'inherit'}}/>
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#F9FAFB'}}>
              {['Emp ID','Name','Type','Department','Designation','Phone','Salary','Status','Action'].map(h=>(
                <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading from database…</td></tr>
            )}
            {!loading && !error && employees.length === 0 && (
              <tr><td colSpan={9} style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
                <div style={{width:48,height:48,background:'#EEEDFE',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
                  <i className="ti ti-users" style={{fontSize:24,color:'#534AB7'}}/>
                </div>No employees yet. Click "+ Add Employee" to add one.
              </td></tr>
            )}
            {!loading && employees.map(e => {
              const [bg, color] = TYPE_COLOR[e.employee_type] || ['#F3F4F6','#374151'];
              const initials = (e.first_name?.[0]||'') + (e.last_name?.[0]||'');
              return (
                <tr key={e.id} style={{borderBottom:'0.5px solid #F3F4F6'}}
                  onMouseEnter={ev=>ev.currentTarget.style.background='#F5F3FF'}
                  onMouseLeave={ev=>ev.currentTarget.style.background=''}>
                  <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{e.employee_id}</td>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color,flexShrink:0}}>
                        {initials.toUpperCase()}
                      </div>
                      <span style={{fontWeight:600,color:'#111827'}}>{e.first_name} {e.last_name||''}</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:bg,color}}>
                      {TYPE_LABEL[e.employee_type] || e.employee_type}
                    </span>
                  </td>
                  <td style={{padding:'10px 14px',color:'#6B7280'}}>{e.department||'—'}</td>
                  <td style={{padding:'10px 14px',color:'#6B7280'}}>{e.designation||'—'}</td>
                  <td style={{padding:'10px 14px',color:'#6B7280'}}>{e.phone||'—'}</td>
                  <td style={{padding:'10px 14px',fontWeight:600,color:'#111827'}}>
                    {e.basic_salary > 0 ? '₹' + Number(e.basic_salary).toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                      background: e.is_active ? '#D1FAE5':'#FEE2E2',
                      color: e.is_active ? '#065F46':'#991B1B'}}>
                      {e.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <button style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',border:'1px solid #7B6FD4',borderRadius:8,background:'#EEEDFE',fontSize:12,cursor:'pointer',fontWeight:600,color:'#534AB7'}}>
                      <i className="ti ti-eye" style={{fontSize:13}}/>View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && employees.length > 0 && (
          <div style={{padding:'10px 14px',fontSize:11,color:'#9CA3AF',borderTop:'0.5px solid #F3F4F6'}}>
            {employees.length} total employees
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:560,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div style={{fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:28,height:28,background:'#EEEDFE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-user-plus" style={{fontSize:15,color:'#534AB7'}}/>
                </div>
                Add New Employee
              </div>
              <button onClick={()=>setShowAdd(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/>
              </button>
            </div>
            <form onSubmit={handleAdd} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>First Name *</label>
                  <input required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} style={inp} placeholder="First name" autoFocus/>
                </div>
                <div><label style={lbl}>Last Name</label>
                  <input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} style={inp} placeholder="Last name"/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Employee Type *</label>
                  <select required value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
                    <option value="teaching">Teaching</option>
                    <option value="non_teaching">Non Teaching</option>
                    <option value="administrative">Administrative</option>
                  </select>
                </div>
                <div><label style={lbl}>Department</label>
                  <input value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} style={inp} placeholder="e.g. Mathematics"/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Designation</label>
                  <input value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} style={inp} placeholder="e.g. Senior Teacher"/>
                </div>
                <div><label style={lbl}>Phone *</label>
                  <input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inp} placeholder="10-digit phone"/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={inp} placeholder="optional"/>
                </div>
                <div><label style={lbl}>Joining Date</label>
                  <input type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} style={inp}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                <div><label style={lbl}>Basic Salary (₹)</label>
                  <input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} style={inp} placeholder="e.g. 35000"/>
                </div>
                <div><label style={lbl}>Qualification</label>
                  <input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} style={inp} placeholder="e.g. B.Ed, M.Sc"/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAdd(false)}
                  style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'10px 22px',background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>
                  <i className="ti ti-device-floppy" style={{fontSize:15}}/>{saving?'Saving…':'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
