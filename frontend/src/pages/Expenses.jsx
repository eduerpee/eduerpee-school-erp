import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const expAPI = {
  getAll:       (p) => api.get('/expenses',           { params: p }),
  add:          (d) => api.post('/expenses', d),
  delete:       (id)=> api.delete('/expenses/'+id),
  getCategories:()  => api.get('/expenses/categories'),
  addCategory:  (d) => api.post('/expenses/categories', d),
  getSummary:   (p) => api.get('/expenses/summary',   { params: p }),
};

const PMODES = ['cash','cheque','online','upi','bank_transfer'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const inp  = { width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box' };
const lbl  = { display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6 };
const th   = { padding:'10px 14px',textAlign:'left',background:'#F9FAFB',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap' };
const td   = { padding:'10px 14px',borderBottom:'0.5px solid #F3F4F6',fontSize:12 };

export default function Expenses() {
  const [tab,         setTab]         = useState('list');
  const [expenses,    setExpenses]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [total,       setTotal]       = useState(0);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showAddCat,  setShowAddCat]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [filterCat,   setFilterCat]   = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [newCat,      setNewCat]      = useState('');
  const curYear  = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  const today    = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title:'',amount:'',date:today,categoryId:'',mode:'cash',vendor:'',invoice:'',remarks:'' });

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filterCat)   params.categoryId = filterCat;
      if (filterMonth) params.month = filterMonth;
      params.year = curYear;
      const [exRes, catRes, sumRes] = await Promise.all([
        expAPI.getAll(params),
        expAPI.getCategories(),
        expAPI.getSummary({ year: curYear }),
      ]);
      setExpenses(exRes.data.data || []);
      setTotal(exRes.data.pagination?.total || exRes.data.data?.length || 0);
      setCategories(catRes.data.data || []);
      setSummary(sumRes.data.data);
    } catch (err) {
      setError('Backend error: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, [filterCat, filterMonth, curYear]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await expAPI.add({ title:form.title, amount:parseFloat(form.amount), expenseDate:form.date, categoryId:form.categoryId||undefined, paymentMode:form.mode, vendorName:form.vendor||undefined, invoiceNo:form.invoice||undefined, remarks:form.remarks||undefined });
      toast.success('✅ Expense saved to database!');
      setShowAdd(false);
      setForm({ title:'',amount:'',date:today,categoryId:'',mode:'cash',vendor:'',invoice:'',remarks:'' });
      loadAll();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    try {
      const res = await expAPI.addCategory({ name: newCat.trim() });
      setCategories(p => [...p, res.data.data]);
      toast.success('✅ Category "' + newCat + '" saved!');
      setNewCat(''); setShowAddCat(false);
    } catch (err) {
      if (err.response?.status === 409) toast.error('Category already exists');
      else toast.error('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm('Delete "' + title + '"?')) return;
    try { await expAPI.delete(id); toast.success('Deleted'); loadAll(); }
    catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const totalShown = expenses.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const monthTotal = expenses.filter(e=>new Date(e.expense_date).getMonth()+1===curMonth).reduce((s,e)=>s+(parseFloat(e.amount)||0),0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Expense Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {total} expenses &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}><><i className="ti ti-plus" style={{fontSize:16}}/> Add Expense</></button>
      </div>

      {error && <div style={{padding:'12px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,color:'#DC2626',fontSize:13,marginBottom:16}}>❌ {error}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          ['This Month','₹'+monthTotal.toLocaleString('en-IN'),'#EDE9F8','#1E1B4B'],
          ['This Year','₹'+Number(summary?.totalYear||0).toLocaleString('en-IN'),'#FEE2E2','#991B1B'],
          ['Categories',categories.length,'#DBEAFE','#1E40AF'],
          ['Total Entries',total,'#D1FAE5','#065F46'],
        ].map(([l,v,bg,c])=>(
          <div key={l} style={{padding:'14px',background:bg,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:v.toString().length>6?15:22,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:c,marginTop:4,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:0}}>
        {[['list','📋 Expense List'],['chart','📊 Summary']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:'10px 20px',border:'none',borderBottom:tab===key?'2px solid #1E1B4B':'2px solid transparent',background:'transparent',color:tab===key?'#1E1B4B':'#6B7280',fontSize:13,fontWeight:tab===key?700:500,cursor:'pointer',marginBottom:-2}}>{label}</button>
        ))}
      </div>

      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:'0 0 14px 14px',overflow:'hidden'}}>
        {tab==='list' && <>
          <div style={{display:'flex',gap:10,padding:14,borderBottom:'1px solid #F3F4F6',flexWrap:'wrap'}}>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inp,width:'auto'}}>
              <option value="">All Categories</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{...inp,width:'auto'}}>
              <option value="">All Months ({curYear})</option>
              {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m} {curYear}</option>)}
            </select>
            {(filterCat||filterMonth)&&<button onClick={()=>{setFilterCat('');setFilterMonth('');}} style={{padding:'9px 14px',border:'1px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:12,color:'#6B7280',cursor:'pointer'}}>Clear ✕</button>}
          </div>
          {loading ? <div style={{padding:36,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div> :
          expenses.length===0 ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:10}}>💰</div><div style={{fontWeight:600}}>No expenses recorded</div></div> :
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr>{['Date','Title','Category','Amount','Payment','Vendor','Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {expenses.map((e,i)=>(
                <tr key={e.id} onMouseEnter={ev=>ev.currentTarget.style.background='#F5F3FF'} onMouseLeave={ev=>ev.currentTarget.style.background=''}>
                  <td style={{...td,fontSize:11,color:'#6B7280'}}>{e.expense_date||''}</td>
                  <td style={{...td,fontWeight:600,color:'#111827'}}>{e.title}</td>
                  <td style={td}>{e.category_name?<span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600}}>{e.category_name}</span>:'—'}</td>
                  <td style={{...td,fontWeight:700,color:'#DC2626'}}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                  <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#F3F4F6',color:'#374151',fontWeight:600,textTransform:'capitalize'}}>{(e.payment_mode||'cash').replace('_',' ')}</span></td>
                  <td style={{...td,color:'#6B7280'}}>{e.vendor_name||'—'}</td>
                  <td style={td}><button onClick={()=>handleDelete(e.id,e.title)} style={{padding:'4px 10px',border:'1px solid #FEE2E2',borderRadius:6,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer',fontWeight:600}}>🗑 Delete</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F9FAFB',borderTop:'2px solid #E5E7EB'}}>
                <td colSpan={3} style={{...td,fontWeight:700,textAlign:'right'}}>Total:</td>
                <td style={{...td,fontWeight:800,color:'#DC2626',fontSize:14}}>₹{totalShown.toLocaleString('en-IN')}</td>
                <td colSpan={3} style={td}/>
              </tr>
            </tfoot>
          </table>}
        </>}

        {tab==='chart' && (
          <div style={{padding:20}}>
            {!summary||loading ? <div style={{textAlign:'center',color:'#9CA3AF',padding:40}}>⏳ Loading…</div> : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#374151',marginBottom:14}}>Monthly — {curYear}</div>
                  {MONTHS.map((m,i)=>{
                    const row = summary.monthly?.find(r=>parseInt(r.month)===i+1);
                    const amt = row ? parseFloat(row.total) : 0;
                    const maxAmt = Math.max(...(summary.monthly||[]).map(r=>parseFloat(r.total)||0),1);
                    const pct = Math.round((amt/maxAmt)*100);
                    return (
                      <div key={m} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                        <div style={{width:32,fontSize:11,color:'#6B7280',flexShrink:0}}>{m}</div>
                        <div style={{flex:1,height:20,background:'#F3F4F6',borderRadius:4}}>
                          <div style={{width:pct+'%',height:'100%',background:i+1===curMonth?'#1E1B4B':'#A78BFA',borderRadius:4,minWidth:pct>0?4:0}}/>
                        </div>
                        <div style={{width:90,fontSize:11,fontWeight:600,color:'#374151',textAlign:'right',flexShrink:0}}>{amt>0?'₹'+amt.toLocaleString('en-IN'):'—'}</div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#374151',marginBottom:14}}>By Category — {curYear}</div>
                  {!summary.byCategory?.length ? <div style={{color:'#9CA3AF',fontSize:12}}>No data yet</div> :
                  summary.byCategory.map((r,i)=>{
                    const maxAmt = parseFloat(summary.byCategory[0]?.total)||1;
                    const pct = Math.round((parseFloat(r.total)/maxAmt)*100);
                    const colors = ['#1E1B4B','#7C3AED','#1E40AF','#065F46','#92400E','#991B1B'];
                    const clr = colors[i%colors.length];
                    return (
                      <div key={r.category||i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                        <div style={{width:90,fontSize:11,color:'#374151',fontWeight:600,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.category||'Other'}</div>
                        <div style={{flex:1,height:20,background:'#F3F4F6',borderRadius:4}}>
                          <div style={{width:pct+'%',height:'100%',background:clr,borderRadius:4}}/>
                        </div>
                        <div style={{width:90,fontSize:11,fontWeight:700,color:clr,textAlign:'right',flexShrink:0}}>₹{Number(r.total).toLocaleString('en-IN')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:580,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>💰 Add Expense</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <form onSubmit={handleAdd} style={{padding:20}}>
              <div style={{marginBottom:12}}><label style={lbl}>Title *</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Electricity Bill June" style={inp} autoFocus/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Amount (₹) *</label><input required type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" style={inp}/></div>
                <div><label style={lbl}>Date *</label><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'end',marginBottom:12}}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})} style={inp}>
                    <option value="">Select Category</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div style={{fontSize:10,color:'#9CA3AF',marginTop:3}}>Not in list? Click +</div>
                </div>
                <button type="button" onClick={()=>setShowAddCat(true)} style={{padding:'10px 14px',border:'1.5px solid #1E1B4B',borderRadius:9,background:'#EDE9F8',color:'#1E1B4B',fontWeight:800,cursor:'pointer',fontSize:18,height:44}}>+</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Payment Mode</label>
                  <select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})} style={inp}>
                    {PMODES.map(m=><option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Vendor</label><input value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} placeholder="Vendor name" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Invoice No.</label><input value={form.invoice} onChange={e=>setForm({...form,invoice:e.target.value})} placeholder="Optional" style={inp}/></div>
                <div><label style={lbl}>Remarks</label><input value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Optional" style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',display:'flex',alignItems:'center',gap:6,background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(123,111,212,0.35)'}}>{saving?'Saving…':'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:400,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>+ Add Category</div>
              <button onClick={()=>setShowAddCat(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:14}}>
                <label style={lbl}>Category Name *</label>
                <input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="e.g. Maintenance, Events" style={inp} autoFocus onKeyDown={e=>e.key==='Enter'&&handleAddCategory()}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6B7280',marginBottom:6}}>Existing:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{categories.map(c=><span key={c.id} style={{padding:'2px 9px',background:'#EDE9F8',borderRadius:20,fontSize:11,color:'#1E1B4B'}}>{c.name}</span>)}</div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowAddCat(false)} style={{padding:'9px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleAddCategory} disabled={!newCat.trim()} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>+ Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
