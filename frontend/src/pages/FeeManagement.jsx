import React, { useState, useEffect, useCallback } from 'react';
import { schoolAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import { printFeeReceipt, sendWhatsApp } from '../utils/feeReceipt';

const feeAPI = {
  getTypes:       ()    => api.get('/fees/types'),
  createType:     (d)   => api.post('/fees/types', d),
  updateType:     (id,d)=> api.put('/fees/types/'+id, d),
  deleteType:     (id)  => api.delete('/fees/types/'+id),
  getStructure:   (p)   => api.get('/fees/structure', { params: p }),
  saveStructure:  (d)   => api.post('/fees/structure', d),
  deleteStructure:(id)  => api.delete('/fees/structure/'+id),
  getStudentFees: (id)  => api.get('/fees/student/'+id),
  collect:        (d)   => api.post('/fees/collect', d),
  getReport:      (p)   => api.get('/fees/collection-report', { params: p }),
  getPending:     (p)   => api.get('/fees/pending', { params: p }),
};
const stuAPI = { getAll: (p) => api.get('/students', { params: p }) };

const inp  = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' };
const lbl  = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 };
const th   = { padding:'10px 14px', textAlign:'left', background:'#F9FAFB', color:'#6B7280', fontSize:10, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap' };
const td   = { padding:'10px 14px', borderBottom:'0.5px solid #F3F4F6', fontSize:12 };
const FREQ = { monthly:'Monthly', quarterly:'Quarterly', yearly:'Yearly', one_time:'One Time' };
const PMODES = ['cash','upi','cheque','bank_transfer','online'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FeeManagement() {
  const [tab,        setTab]        = useState('structure');
  const [classes,    setClasses]    = useState([]);
  const [feeTypes,   setFeeTypes]   = useState([]);
  const [selClass,   setSelClass]   = useState('');
  const [selClassId, setSelClassId] = useState('');
  const [structure,  setStructure]  = useState([]);
  const [loadingSt,  setLoadingSt]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  // Fee type modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editType,      setEditType]      = useState(null);
  const [typeForm,      setTypeForm]      = useState({ name:'', code:'', description:'', frequency:'monthly', isRecurring:true });

  // Structure rows being edited
  const [editRows, setEditRows] = useState([]);  // [{ feeTypeId, feeTypeName, amount, dueDate, lateFeePerDay, structureId }]

  // Collection tab
  const [students,     setStudents]     = useState([]);
  const [selStudent,   setSelStudent]   = useState('');
  const [stuSearch,    setStuSearch]    = useState('');
  const [stuFees,      setStuFees]      = useState([]);
  const [collectForm,  setCollectForm]  = useState({ feeTypeId:'', amount:'', mode:'cash', remarks:'', paymentDate:new Date().toISOString().split('T')[0], feeMonth:new Date().toISOString().slice(0,7) });
  const [collecting,   setCollecting]   = useState(false);

  // Report tab
  const [report,       setReport]       = useState([]);
  const [reportMonth,  setReportMonth]  = useState(new Date().getMonth()+1);
  const [reportTotal,  setReportTotal]  = useState(0);

  // Pending tab
  const [pending,      setPending]      = useState([]);
  const [pendingClass, setPendingClass] = useState('');
  const [showCollect,  setShowCollect]  = useState(null); // student for quick collect

  const curYear = new Date().getFullYear();

  // ── Load reference data ─────────────────────────────────
  useEffect(() => {
    setError('');
    Promise.all([schoolAPI.getClasses(), feeAPI.getTypes()])
      .then(([clsRes, typeRes]) => {
        setClasses(clsRes.data.data || []);
        setFeeTypes(typeRes.data.data || []);
      })
      .catch(err => setError('Backend error: ' + (err.response?.data?.message || err.message)));
  }, []);

  // ── Load structure when class selected ─────────────────
  useEffect(() => {
    if (!selClassId || feeTypes.length === 0) { setEditRows([]); return; }
    setLoadingSt(true);
    feeAPI.getStructure({ classId: selClassId })
      .then(res => {
        const data = res.data.data || [];
        const rows = feeTypes.map(ft => {
          const existing = data.find(d => d.fee_type_id === ft.id);
          return {
            feeTypeId:      ft.id,
            feeTypeName:    ft.name,
            frequency:      ft.frequency,
            amount:         existing ? String(existing.amount) : '',
            dueDate:        existing ? String(existing.due_date || 10) : '10',
            lateFeePerDay:  existing ? String(existing.late_fee_per_day || 0) : '0',
            structureId:    existing?.id || null,
            enabled:        !!existing,
          };
        });
        setEditRows(rows);
      })
      .catch(() => {
        // Even if structure fetch fails, show all fee types as unconfigured
        setEditRows(feeTypes.map(ft => ({
          feeTypeId: ft.id, feeTypeName: ft.name, frequency: ft.frequency,
          amount: '', dueDate: '10', lateFeePerDay: '0',
          structureId: null, enabled: false,
        })));
      })
      .finally(() => setLoadingSt(false));
  }, [selClassId, feeTypes]);

  // ── Load students for collection ───────────────────────
  useEffect(() => {
    if (tab === 'collect') {
      stuAPI.getAll({ limit: 200 })
        .then(r => setStudents(r.data.data || []))
        .catch(() => {});
    }
  }, [tab]);

  // ── Load student fees + class fee types when student selected ─
  useEffect(() => {
    if (!selStudent) return;
    const stu = students.find(s => s.id === selStudent);

    // Reset selections when student changes
    setSelectedHeads({});

    // Load student fee records
    feeAPI.getStudentFees(selStudent)
      .then(r => setStuFees(r.data.data || []))
      .catch(() => setStuFees([]));

    // Load fee types for student's class to show all fee heads
    if (stu?.class_id || stu?.current_class_id) {
      const classId = stu.class_id || stu.current_class_id;
      feeAPI.getStructure({ classId })
        .then(r => {
          const structs = r.data.data || [];
          if (structs.length > 0) {
            // Map to feeType-like objects with amounts from structure
            const classFeeTypes = structs.map(s => ({
              id:        s.fee_type_id,
              name:      s.fee_type_name,
              frequency: s.frequency,
              amount:    s.amount,
              code:      s.code,
            }));
            setFeeTypes(classFeeTypes);
          }
          // If no structure configured, feeTypes stays as global list
        })
        .catch(() => {});
    }
  }, [selStudent, students]);

  // ── Load collection report ────────────────────────────
  useEffect(() => {
    if (tab === 'report') {
      feeAPI.getReport({ month: reportMonth, year: curYear })
        .then(r => { setReport(r.data.data || []); setReportTotal(r.data.total || 0); })
        .catch(() => { setReport([]); setReportTotal(0); });
    }
  }, [tab, reportMonth, curYear]);

  // ── Load pending fees ─────────────────────────────────
  useEffect(() => {
    if (tab === 'pending') {
      feeAPI.getPending({ classId: pendingClass || undefined })
        .then(r => setPending(r.data.data || []))
        .catch(() => setPending([]));
    }
  }, [tab, pendingClass]);

  // ── Save fee type ─────────────────────────────────────
  const handleSaveType = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editType) {
        await feeAPI.updateType(editType.id, typeForm);
        toast.success('✅ Fee type updated!');
      } else {
        await feeAPI.createType(typeForm);
        toast.success('✅ Fee type "' + typeForm.name + '" saved to database!');
      }
      const r = await feeAPI.getTypes();
      setFeeTypes(r.data.data || []);
      setShowTypeModal(false); setEditType(null);
      setTypeForm({ name:'', code:'', description:'', frequency:'monthly', isRecurring:true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const handleDeleteType = async (id, name) => {
    if (!window.confirm('Deactivate fee type "' + name + '"?')) return;
    try {
      await feeAPI.deleteType(id);
      toast.success('Fee type deactivated');
      const r = await feeAPI.getTypes();
      setFeeTypes(r.data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  // ── Save fee structure (all rows for class) ────────────
  const handleSaveStructure = async () => {
    if (!selClassId) { toast.error('Select a class first'); return; }
    const toSave = editRows.filter(r => r.enabled);
    if (!toSave.length) { toast.error('Enable at least one fee head'); return; }
    setSaving(true);
    try {
      await feeAPI.saveStructure({
        classId: selClassId,
        structures: toSave.map(r => ({
          feeTypeId:     r.feeTypeId,
          amount:        parseFloat(r.amount) || 0,
          dueDate:       parseInt(r.dueDate) || 10,
          lateFeePerDay: parseFloat(r.lateFeePerDay) || 0,
        }))
      });
      toast.success('✅ Fee structure for ' + selClass + ' saved to database!');
      // Reload to get structureIds
      const res = await feeAPI.getStructure({ classId: selClassId });
      const data = res.data.data || [];
      setEditRows(prev => prev.map(row => {
        const found = data.find(d => d.fee_type_id === row.feeTypeId);
        return found ? { ...row, structureId: found.id, enabled: true } : row;
      }));
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDeleteStructureRow = async (row) => {
    if (!row.structureId) {
      setEditRows(prev => prev.map(r => r.feeTypeId === row.feeTypeId ? { ...r, enabled: false, amount: '' } : r));
      return;
    }
    try {
      await feeAPI.deleteStructure(row.structureId);
      toast.success('Fee head removed');
      setEditRows(prev => prev.map(r => r.feeTypeId === row.feeTypeId ? { ...r, enabled: false, amount: '', structureId: null } : r));
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  const [selectedHeads, setSelectedHeads] = useState({});
  const [lastReceiptData, setLastReceiptData] = useState(null); // {feeTypeId: customAmount}

  // ── Collect fee — supports multiple fee heads ─────────
  const handleCollect = async (e) => {
    e.preventDefault();
    const entries = Object.entries(selectedHeads).filter(([,amt]) => parseFloat(amt) > 0);
    if (!entries.length) { toast.error('Select at least one fee head with amount'); return; }
    setCollecting(true);
    try {
      const studentId = showCollect || selStudent;
      const stu = students.find(s=>s.id===studentId);
      // Collect each fee head separately
      let lastReceipt = '';
      const paidItems = [];
      for (const [feeTypeId, amount] of entries) {
        const fullRemarks = [collectForm.feeMonth ? 'Month: '+collectForm.feeMonth : null, collectForm.remarks||null].filter(Boolean).join(' | ') || undefined;
        const res = await feeAPI.collect({
          studentId, feeTypeId, amount: parseFloat(amount),
          paymentMode: collectForm.mode,
          remarks: fullRemarks,
          paymentDate: collectForm.paymentDate || undefined,
          feeMonth: collectForm.feeMonth || undefined,
        });
        lastReceipt = res.data?.data?.receipt_no || lastReceipt;
        const ft = feeTypes.find(f=>f.id===feeTypeId);
        paidItems.push({ name: ft?.name || feeTypeId, amount: parseFloat(amount) });
      }
      toast.success(`✅ ${entries.length} fee head(s) collected!`);

      // Show receipt modal
      if (stu && paidItems.length > 0) {
        setLastReceiptData({ student: stu, items: paidItems, mode: collectForm.mode, receiptNo: lastReceipt, remarks: collectForm.remarks });
      }

      setSelectedHeads({});
      setCollectForm({ mode:'cash', remarks:'', paymentDate:new Date().toISOString().split('T')[0], feeMonth:new Date().toISOString().slice(0,7) });
      setShowCollect(null);
      if (selStudent) {
        const r = await feeAPI.getStudentFees(selStudent);
        setStuFees(r.data.data || []);
      }
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setCollecting(false); }
  };

  const totalStructure = editRows.filter(r => r.enabled).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const filteredStudents = students.filter(s => {
    const name = (s.first_name + ' ' + (s.last_name || '')).toLowerCase();
    return !stuSearch || name.includes(stuSearch.toLowerCase()) || (s.admission_no || '').includes(stuSearch);
  });

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Fee Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {feeTypes.length} fee heads · {classes.length} classes &nbsp;
            {error
              ? <span style={{padding:'2px 8px',background:'#FEE2E2',color:'#991B1B',borderRadius:10,fontSize:10,fontWeight:700}}>❌ {error}</span>
              : <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        {tab==='structure' && (
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>{setEditType(null);setTypeForm({name:'',code:'',description:'',frequency:'monthly',isRecurring:true});setShowTypeModal(true);}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',border:'1.5px solid #7B6FD4',borderRadius:9,background:'#EEEDFE',color:'#534AB7',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              <i className='ti ti-plus' style={{fontSize:16}}/> Add Fee Head
            </button>
            {selClassId && editRows.some(r=>r.enabled) && (
              <button onClick={handleSaveStructure} disabled={saving}
                style={{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',background:saving?'#9CA3AF':'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.35)'}}>
                <i className='ti ti-device-floppy' style={{fontSize:16}}/>{saving?'Saving…':'Save Structure'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:4,flexWrap:'wrap'}}>
        {[
          ['structure','Fee Structure',     'ti-layout-grid', '#7B6FD4','#EEEDFE'],
          ['collect',  'Collect Fee',       'ti-credit-card', '#0F6E56','#E1F5EE'],
          ['pending',  'Pending Fees',      'ti-clock',       '#BA7517','#FAEEDA'],
          ['report',   'Collection Report', 'ti-chart-bar',   '#185FA5','#E6F1FB'],
        ].map(([key,label,icon,color,bg])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',borderRadius:12,border:'none',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .18s',
              background:tab===key ? 'linear-gradient(135deg,'+color+','+color+'CC)' : '#fff',
              color:tab===key?'#fff':color,
              boxShadow:tab===key?'0 4px 12px '+color+'40':'0 1px 4px rgba(0,0,0,0.06)',
              outline:tab!==key?'1px solid '+bg:'none',
            }}>
            <i className={'ti '+icon} style={{fontSize:16}}/>
            {label}
          </button>
        ))}
      </div>

      {/* ── STRUCTURE TAB ── */}
      {tab==='structure' && (
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16,marginTop:16}}>

          {/* Left: Fee Types list */}
          <div>
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
              <div style={{padding:'12px 14px',borderBottom:'1px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,background:'#EEEDFE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className='ti ti-credit-card' style={{fontSize:15,color:'#534AB7'}}/>
                  </div>
                  <span style={{fontWeight:700,fontSize:13,color:'#111827'}}>Fee Heads</span>
                </div>
                <span style={{fontSize:11,fontWeight:400,color:'#9CA3AF'}}>{feeTypes.length} total</span>
              </div>
              {feeTypes.length === 0
                ? <div style={{padding:24,textAlign:'center',color:'#9CA3AF',fontSize:12}}>No fee heads yet<br/>Click "+ Add Fee Head"</div>
                : feeTypes.map(ft => (
                    <div key={ft.id} style={{padding:'10px 14px',borderBottom:'0.5px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:32,height:32,borderRadius:9,background:['#EEEDFE','#DBEAFE','#FCE7F3','#D1FAE5','#FEF3C7','#FEE2E2','#E1F5EE'][feeTypes.indexOf(ft)%7],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <i className={'ti '+['ti-school','ti-file-text','ti-writing','ti-bus','ti-books','ti-tool','ti-receipt-2'][feeTypes.indexOf(ft)%7]} style={{fontSize:15,color:['#534AB7','#1E40AF','#9D174D','#065F46','#92400E','#991B1B','#0F6E56'][feeTypes.indexOf(ft)%7]}}/>
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:12,color:'#111827'}}>{ft.name}</div>
                          <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>
                            {FREQ[ft.frequency]||ft.frequency}
                            {ft.code ? ' · ' + ft.code : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>{setEditType(ft);setTypeForm({name:ft.name,code:ft.code||'',description:ft.description||'',frequency:ft.frequency,isRecurring:ft.is_recurring});setShowTypeModal(true);}}
                          style={{padding:'3px 8px',border:'1px solid #E5E7EB',borderRadius:6,background:'#fff',fontSize:10,cursor:'pointer',color:'#374151'}}>✏️</button>
                        <button onClick={()=>handleDeleteType(ft.id,ft.name)}
                          style={{padding:'3px 8px',border:'1px solid #FEE2E2',borderRadius:6,background:'#FFF5F5',fontSize:10,cursor:'pointer',color:'#DC2626'}}>✕</button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Right: Class-wise structure */}
          <div>
            {/* Class selector */}
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,background:'#E1F5EE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className='ti ti-layout-grid' style={{fontSize:15,color:'#0F6E56'}}/>
                </div>
                <span style={{fontWeight:700,fontSize:13,color:'#111827'}}>Select Class</span>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {classes.map(c => (
                  <button key={c.id} onClick={()=>{setSelClass(c.name);setSelClassId(c.id);}}
                    style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',border:'1.5px solid '+(selClassId===c.id?'#7B6FD4':'#E5E7EB'),borderRadius:9,background:selClassId===c.id?'linear-gradient(135deg,#7B6FD4,#A89DE8)':'#fff',color:selClassId===c.id?'#fff':'#374151',fontSize:12,fontWeight:selClassId===c.id?700:400,cursor:'pointer',transition:'all .15s',boxShadow:selClassId===c.id?'0 4px 10px rgba(123,111,212,0.35)':'none'}}>
                    <i className='ti ti-school' style={{fontSize:13}}/>
                    {c.name}
                  </button>
                ))}
              </div>
              {!classes.length && <div style={{fontSize:12,color:'#9CA3AF',marginTop:8}}>No classes found. Add classes in Settings first.</div>}
            </div>

            {!selClassId
              ? <div style={{background:'linear-gradient(135deg,#EEEDFE,#F5F3FF)',borderRadius:14,border:'1px dashed #A89DE8',padding:48,textAlign:'center'}}>
                  <div style={{width:52,height:52,background:'#7B6FD4',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                    <i className='ti ti-credit-card' style={{fontSize:26,color:'white'}}/>
                  </div>
                  <div style={{fontWeight:700,fontSize:14,color:'#534AB7',marginBottom:6}}>Configure Fee Structure</div>
                  <div style={{fontSize:12,color:'#9CA3AF'}}>Select a class above to set fee amounts for each fee head</div>
                </div>
              : <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:'1px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F9FAFB'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:'#111827'}}>Fee Structure — {selClass}</div>
                      <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>Enable fee heads and set amounts · Changes save to database</div>
                    </div>
                    {totalStructure > 0 && (
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:18,fontWeight:800,color:'#1E1B4B'}}>₹{totalStructure.toLocaleString('en-IN')}</div>
                        <div style={{fontSize:10,color:'#6B7280'}}>Total per cycle</div>
                      </div>
                    )}
                  </div>

                  {loadingSt
                    ? <div style={{padding:32,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</div>
                    : feeTypes.length === 0
                      ? <div style={{padding:32,textAlign:'center',color:'#9CA3AF',fontSize:12}}>No fee heads defined. Click "+ Add Fee Head" first.</div>
                      : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                          <thead><tr>
                            {['Enable','Fee Head','Frequency','Amount (₹)','Due Day','Late Fee/Day (₹)',''].map(h=><th key={h} style={th}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {editRows.map((row, i) => (
                              <tr key={row.feeTypeId} style={{borderBottom:'0.5px solid #F3F4F6',background:row.enabled?'#FAFFFE':'#fff'}}
                                onMouseEnter={e=>e.currentTarget.style.background=row.enabled?'#F0FFF4':'#FAFAFA'}
                                onMouseLeave={e=>e.currentTarget.style.background=row.enabled?'#FAFFFE':'#fff'}>
                                <td style={{...td,textAlign:'center'}}>
                                  <input type="checkbox" checked={row.enabled}
                                    onChange={e => setEditRows(prev => prev.map(r =>
                                      r.feeTypeId === row.feeTypeId
                                        ? { ...r, enabled: e.target.checked, amount: e.target.checked ? (r.amount || '') : r.amount }
                                        : r
                                    ))}
                                    style={{width:16,height:16,accentColor:'#1E1B4B',cursor:'pointer'}}/>
                                </td>
                                <td style={{...td,fontWeight:600,color:'#111827'}}>
                                  {row.feeTypeName}
                                  {row.structureId && <span style={{marginLeft:6,fontSize:9,padding:'1px 5px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontWeight:700}}>SAVED</span>}
                                </td>
                                <td style={td}><span style={{fontSize:10,padding:'2px 7px',background:'#EDE9F8',color:'#1E1B4B',borderRadius:20,fontWeight:600}}>{FREQ[row.frequency]||row.frequency}</span></td>
                                <td style={td}>
                                  <input type="number" min="0" value={row.amount} placeholder="Enter amount"
                                    disabled={!row.enabled}
                                    onChange={e=>setEditRows(prev=>prev.map(r=>r.feeTypeId===row.feeTypeId?{...r,amount:e.target.value}:r))}
                                    style={{...inp,width:100,padding:'6px 10px',
                                      background:row.enabled?'#fff':'#F9FAFB',
                                      color:row.enabled?'#111827':'#9CA3AF'
                                    }}/>
                                </td>
                                <td style={td}>
                                  <input type="number" min="1" max="31" value={row.dueDate}
                                    disabled={!row.enabled}
                                    onChange={e=>setEditRows(prev=>prev.map(r=>r.feeTypeId===row.feeTypeId?{...r,dueDate:e.target.value}:r))}
                                    style={{...inp,width:70,padding:'6px 10px',background:row.enabled?'#fff':'#F9FAFB',color:row.enabled?'#111827':'#9CA3AF'}}/>
                                </td>
                                <td style={td}>
                                  <input type="number" min="0" step="0.5" value={row.lateFeePerDay}
                                    disabled={!row.enabled}
                                    onChange={e=>setEditRows(prev=>prev.map(r=>r.feeTypeId===row.feeTypeId?{...r,lateFeePerDay:e.target.value}:r))}
                                    style={{...inp,width:80,padding:'6px 10px',background:row.enabled?'#fff':'#F9FAFB',color:row.enabled?'#111827':'#9CA3AF'}}/>
                                </td>
                                <td style={td}>
                                  {row.enabled && (
                                    <button onClick={()=>handleDeleteStructureRow(row)}
                                      style={{padding:'4px 10px',border:'1px solid #FEE2E2',borderRadius:7,background:'#FFF5F5',color:'#DC2626',fontSize:11,cursor:'pointer'}}>
                                      Remove
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{background:'#F9FAFB',borderTop:'2px solid #E5E7EB'}}>
                              <td colSpan={3} style={{...td,fontWeight:700,color:'#374151'}}>Total Enabled Fee Heads: {editRows.filter(r=>r.enabled).length}</td>
                              <td style={{...td,fontWeight:800,color:'#1E1B4B',fontSize:14}}>₹{totalStructure.toLocaleString('en-IN')}</td>
                              <td colSpan={3} style={td}/>
                            </tr>
                          </tfoot>
                        </table>
                  }
                  <div style={{padding:'12px 16px',background:'#EDE9F8',borderTop:'1px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:12,color:'#1E1B4B'}}>
                      💡 Check/uncheck fee heads · Set amounts · Click <strong>Save Structure</strong> to update database
                    </div>
                    <button onClick={handleSaveStructure} disabled={saving||!editRows.some(r=>r.enabled)}
                      style={{padding:'9px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      {saving?'⏳ Saving…':'💾 Save Structure'}
                    </button>
                  </div>
                </div>
            }
          </div>
        </div>
      )}

      {/* ── COLLECT FEE TAB ── */}
      {tab==='collect' && (
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16,marginTop:16}}>
          {/* Student search */}
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid #E5E7EB',fontWeight:700,fontSize:13}}>Select Student</div>
            <div style={{padding:10}}>
              <input value={stuSearch} onChange={e=>setStuSearch(e.target.value)} placeholder="Search name or adm no…" style={{...inp,marginBottom:8}}/>
            </div>
            <div style={{maxHeight:420,overflowY:'auto'}}>
              {filteredStudents.length===0
                ? <div style={{padding:20,textAlign:'center',color:'#9CA3AF',fontSize:12}}>No students found</div>
                : filteredStudents.map(s=>(
                    <div key={s.id} onClick={()=>setSelStudent(s.id)}
                      style={{padding:'10px 14px',borderBottom:'0.5px solid #F3F4F6',cursor:'pointer',background:selStudent===s.id?'#EDE9F8':'#fff',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=selStudent===s.id?'#EDE9F8':'#F5F3FF'}
                      onMouseLeave={e=>e.currentTarget.style.background=selStudent===s.id?'#EDE9F8':'#fff'}>
                      <div style={{fontWeight:600,fontSize:12,color:'#111827'}}>{s.first_name} {s.last_name||''}</div>
                      <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>{s.admission_no} · {s.class_name||'—'}</div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Student fee detail */}
          <div>
            {!selStudent
              ? <div style={{background:'#F9FAFB',borderRadius:14,border:'2px dashed #E5E7EB',padding:48,textAlign:'center',color:'#9CA3AF'}}>
                  <div style={{fontSize:36,marginBottom:10}}>👤</div>
                  <div style={{fontWeight:600,color:'#6B7280'}}>Select a student from the left to view fees</div>
                </div>
              : (() => {
                  const stu = students.find(s=>s.id===selStudent);
                  // Calculate totals — use stuFees if available, else use feeTypes structure
                  const totalDue = stuFees.length > 0
                    ? stuFees.reduce((sum,f) => sum + (parseFloat(f.amount)||0), 0)
                    : feeTypes.reduce((sum,ft) => sum + (parseFloat(ft.amount)||0), 0);
                  const totalPaid    = stuFees.reduce((sum,f) => sum + (parseFloat(f.paid_amount)||0), 0);
                  const totalPending = Math.max(0, totalDue - totalPaid);
                  return (
                    <div>
                      {/* Student header */}
                      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:16,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:15,color:'#111827'}}>{stu?.first_name} {stu?.last_name||''}</div>
                          <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>{stu?.admission_no} · {stu?.class_name||'—'}</div>
                        </div>
                        <div style={{display:'flex',gap:12}}>
                          {[['Total Due','₹'+totalDue.toLocaleString('en-IN'),'#EDE9F8','#1E1B4B'],['Paid','₹'+totalPaid.toLocaleString('en-IN'),'#D1FAE5','#065F46'],['Pending','₹'+totalPending.toLocaleString('en-IN'),'#FEE2E2','#991B1B']].map(([l,v,bg,c])=>(
                            <div key={l} style={{padding:'8px 14px',background:bg,borderRadius:10,textAlign:'center'}}>
                              <div style={{fontWeight:800,color:c,fontSize:15}}>{v}</div>
                              <div style={{fontSize:10,color:c,fontWeight:600}}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Collect form */}
                      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:16,marginBottom:12}}>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:'#111827'}}>💳 Select Fee Heads to Collect</div>
                        <div style={{fontSize:11,color:'#9CA3AF',marginBottom:12}}>Check the fee heads you want to collect. Amount auto-fills from structure.</div>

                        {totalPending <= 0 && stuFees.length > 0 && (
                          <div style={{padding:'10px 14px',background:'#D1FAE5',border:'1px solid #A7F3D0',borderRadius:10,marginBottom:12,fontSize:12,color:'#065F46',fontWeight:600}}>
                            ✅ All fees paid. You can still collect advance fees below.
                          </div>
                        )}

                        {/* Fee head checkboxes */}
                        <div style={{border:'1px solid #E5E7EB',borderRadius:10,overflow:'hidden',marginBottom:14}}>
                          <div style={{background:'#F9FAFB',padding:'8px 14px',borderBottom:'1px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase'}}>Fee Head</span>
                            <div style={{display:'flex',gap:12}}>
                              <span style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',width:80,textAlign:'right'}}>Due</span>
                              <span style={{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',width:100,textAlign:'right'}}>Amount to Pay</span>
                            </div>
                          </div>
                          {feeTypes.filter(ft => {
                            const sf = stuFees.find(f=>f.fee_type_id===ft.id);
                            return sf?.status !== 'paid'; // hide paid ones
                          }).length === 0
                            ? <div style={{padding:'20px',textAlign:'center',color:'#9CA3AF',fontSize:12}}>No pending fee heads</div>
                            : feeTypes.filter(ft => {
                                const sf = stuFees.find(f=>f.fee_type_id===ft.id);
                                return sf?.status !== 'paid';
                              }).map(ft => {
                                const sf    = stuFees.find(f=>f.fee_type_id===ft.id);
                                const total = parseFloat(sf?.amount || ft.amount || 0);
                                const paid  = parseFloat(sf?.paid_amount || 0);
                                const bal   = Math.max(0, total - paid);
                                const isChecked = ft.id in selectedHeads;
                                return (
                                  <div key={ft.id} onClick={()=>{
                                    if (isChecked) {
                                      const n={...selectedHeads}; delete n[ft.id]; setSelectedHeads(n);
                                    } else {
                                      setSelectedHeads({...selectedHeads, [ft.id]: (bal > 0 ? bal : total) > 0 ? String(bal > 0 ? bal : total) : ''});
                                    }
                                  }}
                                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:'0.5px solid #F3F4F6',cursor:'pointer',background:isChecked?'#EDE9F8':'#fff',transition:'background .15s'}}
                                    onMouseEnter={e=>{if(!isChecked)e.currentTarget.style.background='#F9FAFB';}}
                                    onMouseLeave={e=>{if(!isChecked)e.currentTarget.style.background='#fff';}}>
                                    <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                                      <input type="checkbox" checked={isChecked} onChange={()=>{}} style={{width:16,height:16,cursor:'pointer',accentColor:'#1E1B4B'}}/>
                                      <div>
                                        <div style={{fontWeight:600,fontSize:13,color:'#111827'}}>{ft.name}</div>
                                        <div style={{fontSize:10,color:'#9CA3AF'}}>{ft.frequency} {total>0?'· ₹'+Number(total).toLocaleString('en-IN'):''}</div>
                                      </div>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                                      <span style={{fontSize:12,fontWeight:600,color:bal>0?'#DC2626':'#9CA3AF',width:80,textAlign:'right'}}>
                                        {total>0?'₹'+Number(bal>0?bal:total).toLocaleString('en-IN'):'—'}
                                      </span>
                                      <input type="number" min="0" value={isChecked?selectedHeads[ft.id]:''} placeholder="₹0"
                                        onClick={e=>{e.stopPropagation(); if(!isChecked) setSelectedHeads({...selectedHeads,[ft.id]:(bal>0?bal:total)>0?String(bal>0?bal:total):''});}}
                                        onChange={e=>{e.stopPropagation(); setSelectedHeads({...selectedHeads,[ft.id]:e.target.value});}}
                                        style={{width:100,padding:'6px 10px',border:'1.5px solid '+(isChecked?'#7C3AED':'#E5E7EB'),borderRadius:7,fontSize:12,outline:'none',textAlign:'right',background:isChecked?'#fff':'#F9FAFB'}}
                                        disabled={!isChecked}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                          }
                        </div>

                        {/* Total */}
                        {Object.keys(selectedHeads).length > 0 && (
                          <div style={{padding:'10px 14px',background:'#1E1B4B',borderRadius:10,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{color:'#fff',fontWeight:600,fontSize:13}}>{Object.keys(selectedHeads).length} fee head(s) selected</span>
                            <span style={{color:'#A5B4FC',fontWeight:800,fontSize:16}}>
                              Total: ₹{Object.values(selectedHeads).reduce((s,v)=>s+(parseFloat(v)||0),0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        <form onSubmit={handleCollect}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                            <div><label style={lbl}>Payment Mode *</label>
                              <select value={collectForm.mode} onChange={e=>setCollectForm({...collectForm,mode:e.target.value})} style={inp}>
                                {PMODES.map(m=><option key={m} value={m}>{m.replace(/_/g,' ').toUpperCase()}</option>)}
                              </select>
                            </div>
                            <div><label style={lbl}>Fee Month</label>
                              <input type="month" value={collectForm.feeMonth} onChange={e=>setCollectForm({...collectForm,feeMonth:e.target.value})} style={inp}/>
                            </div>
                            <div><label style={lbl}>Payment Date</label>
                              <input type="date" value={collectForm.paymentDate} onChange={e=>setCollectForm({...collectForm,paymentDate:e.target.value})} style={inp}/>
                            </div>
                          </div>
                          <div style={{marginBottom:12}}>
                            <label style={lbl}>Remarks (optional)</label>
                            <input value={collectForm.remarks} onChange={e=>setCollectForm({...collectForm,remarks:e.target.value})} placeholder="e.g. Advance payment for July" style={inp}/>
                          </div>
                          <button type="submit" disabled={collecting||Object.keys(selectedHeads).length===0}
                            style={{padding:'11px 28px',background:collecting||Object.keys(selectedHeads).length===0?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:Object.keys(selectedHeads).length===0?'not-allowed':'pointer'}}>
                            {collecting?'⏳ Processing…':`💳 Collect ₹${Object.values(selectedHeads).reduce((s,v)=>s+(parseFloat(v)||0),0).toLocaleString('en-IN')} & Generate Receipt`}
                          </button>
                        </form>
                      </div>

                      {/* Fee history */}
                      {stuFees.length > 0 && (
                        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
                          <div style={{padding:'10px 14px',borderBottom:'1px solid #E5E7EB',fontWeight:700,fontSize:13}}>Fee Records</div>
                          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                            <thead><tr>{['Fee Head','Amount','Paid','Balance','Status'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                            <tbody>
                              {stuFees.map((f,i)=>{
                                const bal = Math.max(0,(parseFloat(f.amount)||0)-(parseFloat(f.paid_amount)||0));
                                const stMap = {paid:['#D1FAE5','#065F46','PAID'],partial:['#FEF3C7','#92400E','PARTIAL'],pending:['#FEE2E2','#991B1B','PENDING'],waived:['#F3F4F6','#6B7280','WAIVED']};
                                const [sBg,sC,sL] = stMap[f.status]||['#F3F4F6','#6B7280','—'];
                                return (
                                  <tr key={f.id} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                                    <td style={{...td,fontWeight:600}}>{f.fee_type_name}</td>
                                    <td style={td}>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                                    <td style={{...td,color:'#065F46',fontWeight:600}}>₹{Number(f.paid_amount||0).toLocaleString('en-IN')}</td>
                                    <td style={{...td,fontWeight:700,color:bal>0?'#DC2626':'#065F46'}}>₹{bal.toLocaleString('en-IN')}</td>
                                    <td style={td}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:sBg,color:sC}}>{sL}</span></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()
            }
          </div>
        </div>
      )}

      {/* ── PENDING FEES TAB ── */}
      {tab==='pending' && (
        <div style={{marginTop:16}}>
          {/* Filters + stats */}
          <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'flex-end',flexWrap:'wrap'}}>
            <div>
              <label style={lbl}>Filter by Class</label>
              <select value={pendingClass} onChange={e=>setPendingClass(e.target.value)} style={{...inp,minWidth:160}}>
                <option value="">All Classes</option>
                {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{padding:'9px 14px',background:'#FEE2E2',borderRadius:9,fontWeight:700,color:'#991B1B',fontSize:13}}>
              ⚠️ {pending.length} pending entries
            </div>
            <div style={{padding:'9px 14px',background:'#FEF3C7',borderRadius:9,fontWeight:800,color:'#92400E',fontSize:13}}>
              ₹{pending.reduce((s,p)=>s+Math.max(0,(parseFloat(p.amount)||0)-(parseFloat(p.paid_amount)||0)),0).toLocaleString('en-IN')} total due
            </div>
            <button onClick={()=>{
              setPendingClass('');
              feeAPI.getPending()
                .then(r=>setPending(r.data.data||[]))
                .catch(()=>{});
            }} style={{padding:'9px 14px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:12,cursor:'pointer'}}>
              🔄 Refresh
            </button>
          </div>

          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
            {pending.length === 0
              ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}>
                  <div style={{fontSize:36,marginBottom:10}}>✅</div>
                  <div style={{fontWeight:600,color:'#6B7280'}}>No pending fees{pendingClass?' for this class':''}</div>
                  <div style={{fontSize:12,marginTop:4}}>All students have cleared their dues</div>
                </div>
              : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#F9FAFB'}}>
                      {['Student','Adm No','Class','Fee Head','Total','Paid','Balance','Status','Actions'].map(h=>(
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(p => {
                      const bal = Math.max(0,(parseFloat(p.amount)||0)-(parseFloat(p.paid_amount)||0));
                      return (
                        <tr key={p.id}
                          onMouseEnter={e=>e.currentTarget.style.background='#FFF5F5'}
                          onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td style={{...td,fontWeight:600,color:'#111827'}}>{p.first_name||p.student_name||'—'} {p.last_name||''}</td>
                          <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{p.admission_no}</td>
                          <td style={td}>{p.class_name||'—'}</td>
                          <td style={td}>{p.fee_type_name}</td>
                          <td style={{...td,fontWeight:600}}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                          <td style={{...td,color:'#065F46',fontWeight:600}}>₹{Number(p.paid_amount||0).toLocaleString('en-IN')}</td>
                          <td style={{...td,fontWeight:800,color:'#DC2626'}}>₹{bal.toLocaleString('en-IN')}</td>
                          <td style={td}>
                            <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,
                              background:p.status==='partial'?'#FEF3C7':'#FEE2E2',
                              color:p.status==='partial'?'#92400E':'#991B1B'}}>
                              {(p.status||'pending').toUpperCase()}
                            </span>
                          </td>
                          <td style={{...td,whiteSpace:'nowrap'}}>
                            <div style={{display:'flex',gap:6}}>
                              <button onClick={()=>{
                                // Switch to collect tab with student pre-selected
                                setTab('collect');
                                setSelStudent(p.student_id);
                                setStuSearch(p.first_name+' '+(p.last_name||''));
                              }}
                                style={{padding:'4px 10px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                💳 Collect
                              </button>
                              <button onClick={()=>{
                                const msg = `🏫 Fee Reminder\n\nDear Parent,\n\n${p.first_name} ${p.last_name||''} (${p.admission_no}) has pending fee:\n\n• ${p.fee_type_name}: ₹${bal.toLocaleString('en-IN')}\n\nPlease clear dues at the earliest.\n\nThank you!`;
                                const phone = (p.parent_phone||'').replace(/\D/g,'');
                                window.open('https://wa.me/91'+phone+'?text='+encodeURIComponent(msg),'_blank');
                              }}
                                style={{padding:'4px 10px',background:'#25D366',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                💬
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#FEF2F2',borderTop:'2px solid #FECACA'}}>
                      <td colSpan={6} style={{...td,fontWeight:700,color:'#374151'}}>Total Balance Due ({pending.length} records)</td>
                      <td style={{...td,fontWeight:800,color:'#DC2626',fontSize:14}}>
                        ₹{pending.reduce((s,p)=>s+Math.max(0,(parseFloat(p.amount)||0)-(parseFloat(p.paid_amount)||0)),0).toLocaleString('en-IN')}
                      </td>
                      <td colSpan={2} style={td}/>
                    </tr>
                  </tfoot>
                </table>
            }
          </div>
        </div>
      )}

      {/* ── COLLECTION REPORT TAB ── */}
      {tab==='report' && (
        <div style={{marginTop:16}}>
          <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <label style={lbl}>Month</label>
              <select value={reportMonth} onChange={e=>setReportMonth(parseInt(e.target.value))} style={{...inp,minWidth:140}}>
                {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m} {curYear}</option>)}
              </select>
            </div>
            <div style={{alignSelf:'flex-end',padding:'9px 14px',background:'#D1FAE5',borderRadius:9,fontWeight:800,color:'#065F46',fontSize:15}}>
              ₹{Number(reportTotal).toLocaleString('en-IN')} collected
            </div>
          </div>
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
            {report.length === 0
              ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:36,marginBottom:10}}>📊</div><div style={{fontWeight:600}}>No collections for {MONTHS[reportMonth-1]} {curYear}</div></div>
              : <>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr>{['Receipt No','Date','Student','Adm No','Class','Fee Head','Amount','Mode'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {report.map((r,i)=>(
                        <tr key={r.receipt_no} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#1E1B4B',fontWeight:700}}>{r.receipt_no}</td>
                          <td style={{...td,fontSize:11,color:'#6B7280'}}>{String(r.payment_date).split('T')[0]}</td>
                          <td style={{...td,fontWeight:600}}>{r.student_name}</td>
                          <td style={{...td,fontSize:11,color:'#9CA3AF'}}>{r.admission_no}</td>
                          <td style={td}>{r.class_name}</td>
                          <td style={td}>{r.fee_type_name}</td>
                          <td style={{...td,fontWeight:700,color:'#065F46'}}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                          <td style={td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600,textTransform:'uppercase'}}>{r.payment_mode?.replace('_',' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'#F9FAFB',borderTop:'2px solid #E5E7EB'}}>
                        <td colSpan={6} style={{...td,fontWeight:700,color:'#374151'}}>{report.length} transactions</td>
                        <td style={{...td,fontWeight:800,color:'#065F46',fontSize:14}}>₹{Number(reportTotal).toLocaleString('en-IN')}</td>
                        <td style={td}/>
                      </tr>
                    </tfoot>
                  </table>
                </>
            }
          </div>
        </div>
      )}

      {/* ── FEE TYPE MODAL ── */}
      {showTypeModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:480,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>{editType?'✏️ Edit':'+'} Fee Head</div>
              <button onClick={()=>{setShowTypeModal(false);setEditType(null);}} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleSaveType} style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Fee Head Name *</label><input required value={typeForm.name} onChange={e=>setTypeForm({...typeForm,name:e.target.value})} placeholder="e.g. Tuition Fee" style={inp} autoFocus/></div>
                <div><label style={lbl}>Code</label><input value={typeForm.code} onChange={e=>setTypeForm({...typeForm,code:e.target.value})} placeholder="e.g. TF01" style={inp}/></div>
              </div>
              <div style={{marginBottom:12}}><label style={lbl}>Description</label><input value={typeForm.description} onChange={e=>setTypeForm({...typeForm,description:e.target.value})} placeholder="Optional description" style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Frequency</label>
                  <select value={typeForm.frequency} onChange={e=>setTypeForm({...typeForm,frequency:e.target.value})} style={inp}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:24}}>
                  <input type="checkbox" id="recur" checked={typeForm.isRecurring} onChange={e=>setTypeForm({...typeForm,isRecurring:e.target.checked})} style={{width:16,height:16,accentColor:'#1E1B4B',cursor:'pointer'}}/>
                  <label htmlFor="recur" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Recurring Fee</label>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>{setShowTypeModal(false);setEditType(null);}} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {saving?'⏳ Saving…':editType?'💾 Update':'+ Add Fee Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK COLLECT MODAL (from pending tab) ── */}
      {showCollect && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>💳 Collect Fee</div>
              <button onClick={()=>setShowCollect(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleCollect} style={{padding:20}}>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Fee Head</label>
                <select value={collectForm.feeTypeId} onChange={e=>setCollectForm({...collectForm,feeTypeId:e.target.value})} style={inp}>
                  <option value="">General</option>
                  {feeTypes.map(ft=><option key={ft.id} value={ft.id}>{ft.name}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Amount (₹) *</label><input required type="number" value={collectForm.amount} onChange={e=>setCollectForm({...collectForm,amount:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Mode *</label>
                  <select value={collectForm.mode} onChange={e=>setCollectForm({...collectForm,mode:e.target.value})} style={inp}>
                    {PMODES.map(m=><option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:16}}><label style={lbl}>Remarks</label><input value={collectForm.remarks} onChange={e=>setCollectForm({...collectForm,remarks:e.target.value})} style={inp}/></div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowCollect(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={collecting} style={{padding:'10px 22px',background:collecting?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {collecting?'⏳…':'💳 Collect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {lastReceiptData && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.6)',zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:420,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,.3)'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F0FDF4'}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'#065F46'}}>✅ Payment Collected!</div>
                <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>Receipt: {lastReceiptData.receiptNo}</div>
              </div>
              <button onClick={()=>setLastReceiptData(null)} style={{background:'#E5E7EB',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:15}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{padding:'12px 14px',background:'#F9FAFB',borderRadius:10,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,color:'#111827',marginBottom:4}}>{lastReceiptData.student.first_name} {lastReceiptData.student.last_name||''}</div>
                <div style={{fontSize:11,color:'#6B7280',marginBottom:8}}>{lastReceiptData.student.admission_no} · {lastReceiptData.student.class_name||'—'}</div>
                {lastReceiptData.items.map((item,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:'0.5px solid #E5E7EB'}}>
                    <span>{item.name}</span><span style={{fontWeight:600}}>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:14,marginTop:8,color:'#065F46'}}>
                  <span>Total Paid</span>
                  <span>₹{Number(lastReceiptData.items.reduce((s,i)=>s+i.amount,0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>printFeeReceipt(lastReceiptData.student,lastReceiptData.items,lastReceiptData.mode,lastReceiptData.receiptNo,lastReceiptData.remarks)}
                  style={{flex:1,padding:'12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  🖨️ Print Receipt
                </button>
                <button onClick={()=>sendWhatsApp(lastReceiptData.student,lastReceiptData.items,lastReceiptData.mode,lastReceiptData.receiptNo)}
                  style={{flex:1,padding:'12px',background:'#25D366',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  💬 WhatsApp
                </button>
              </div>
              <button onClick={()=>setLastReceiptData(null)}
                style={{width:'100%',marginTop:10,padding:'10px',background:'#F9FAFB',border:'1.5px solid #E5E7EB',borderRadius:10,fontSize:12,cursor:'pointer',color:'#6B7280'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
