import React, { useState, useEffect, useCallback } from 'react';
import { studentAPI, schoolAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const feeAPI = {
  getTypes:        ()                       => api.get('/fees/types'),
  getStructure:    (classId, className)     => api.get('/fees/structure', { params: { classId: classId||undefined, className: className||undefined } }),
  getStudentFees:  (id)                     => api.get('/fees/student/' + id),
  collect:         (d)                      => api.post('/fees/collect', d),
};
const routeAPI = {
  getAll:  ()            => api.get('/transport/routes'),
  assign:  (stuId, d)    => api.post('/students/' + stuId + '/transport', d),
};

function fmtDate(d) { if (!d || d === '—') return ''; const s = String(d).split('T')[0]; return s === 'Invalid Date' ? '' : s; }
function displayDate(d) { if (!d || d === '—') return '—'; const s = String(d).split('T')[0]; return s || '—'; }

const FEE_BADGE = {
  paid:    { bg:'#D1FAE5', c:'#065F46', label:'✓ Paid'  },
  pending: { bg:'#FEE2E2', c:'#991B1B', label:'Pending' },
  partial: { bg:'#FEF3C7', c:'#92400E', label:'Partial' },
};
const MOCK_STUDENTS = [
  { id:1,  admission_no:'ADM2501', first_name:'Aarav',  last_name:'Sharma',  class_name:'Class 10',section_name:'A', parent_name:'Rajesh Sharma',  parent_phone:'9876543210', category:'general', fee_status:'paid',    status:'active', date_of_birth:'2009-03-14', gender:'male',   photo_url:null },
  { id:2,  admission_no:'ADM2502', first_name:'Priya',  last_name:'Singh',   class_name:'Class 8', section_name:'B', parent_name:'Manoj Singh',    parent_phone:'9765432100', category:'obc',     fee_status:'pending', status:'active', date_of_birth:'2011-07-22', gender:'female', photo_url:null },
  { id:3,  admission_no:'ADM2503', first_name:'Rohit',  last_name:'Gupta',   class_name:'Class 12',section_name:'A', parent_name:'Suresh Gupta',   parent_phone:'9988776655', category:'general', fee_status:'paid',    status:'active', date_of_birth:'2007-11-05', gender:'male',   photo_url:null },
  { id:4,  admission_no:'ADM2504', first_name:'Ananya', last_name:'Patel',   class_name:'Class 6', section_name:'C', parent_name:'Deepak Patel',   parent_phone:'9765432108', category:'sc',      fee_status:'partial', status:'active', date_of_birth:'2013-05-19', gender:'female', photo_url:null },
  { id:5,  admission_no:'ADM2505', first_name:'Dev',    last_name:'Kumar',   class_name:'Class 11',section_name:'B', parent_name:'Anil Kumar',     parent_phone:'9543218760', category:'general', fee_status:'pending', status:'active', date_of_birth:'2008-09-30', gender:'male',   photo_url:null },
];
const EMPTY = { firstName:'', lastName:'', dob:'', gender:'male', blood:'', category:'general', photoUrl:null, aadhaar:'', religion:'', class_:'', section:'A', admDate:new Date().toISOString().split('T')[0], prevSchool:'', prevMarks:'', fatherName:'', motherName:'', phone:'', altPhone:'', email:'', city:'', state:'Uttar Pradesh', pincode:'', address:'', routeId:'' };

const inp = (extra={}) => ({ width:'100%', padding:'10px 12px', border:'1.5px solid '+(extra.error?'#DC2626':'#E5E7EB'), borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit', background:'#fff', boxSizing:'border-box' });
const Field = ({label,required,error,children}) => (
  <div style={{display:'flex',flexDirection:'column',gap:5}}>
    <label style={{fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em'}}>{label}{required&&<span style={{color:'#DC2626',marginLeft:3}}>*</span>}</label>
    {children}
    {error&&<span style={{color:'#DC2626',fontSize:11}}>{error}</span>}
  </div>
);
const Divider = ({title}) => <div style={{fontSize:11,fontWeight:800,color:'#1E1B4B',textTransform:'uppercase',letterSpacing:'.08em',margin:'16px 0 10px',paddingBottom:6,borderBottom:'2px solid #EDE9F8'}}>{title}</div>;

export default function Students() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [students,    setStudents]    = useState([]);
  const [pendingAdmits, setPendingAdmits] = useState([]); // admitted but fee not paid
  const [dbClasses,   setDbClasses]   = useState([]);
  const [dbRoutes,    setDbRoutes]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  // Fee collection state
  const [feeStudent,  setFeeStudent]  = useState(null);  // student for fee modal
  const [feeTypes,    setFeeTypes]    = useState([]);
  const [stuFees,     setStuFees]     = useState([]);
  const [feeForm,     setFeeForm]     = useState({ selectedIds:[], mode:'cash', remarks:'' });
  const [feeLoading,  setFeeLoading]  = useState(false);
  const [collecting,  setCollecting]  = useState(false);
  const [isMock,      setIsMock]      = useState(false);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [filterCls,   setFilterCls]   = useState('');
  const [filterFee,   setFilterFee]   = useState('');
  const [page,        setPage]        = useState(1);
  const [showAdd,     setShowAdd]     = useState(false);
  const [viewSt,      setViewSt]      = useState(null);
  const [editSt,      setEditSt]      = useState(null);  // student being edited
  const [editForm,    setEditForm]    = useState({});
  const [editSaving,  setEditSaving]  = useState(false);
  const [editErrors,  setEditErrors]  = useState({});
  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({ page, limit:15, search:search||undefined, className:filterCls||undefined });
      const all = res.data.data||[];
      setStudents(all);
      setTotal(res.data.pagination?.total||0);
      setPendingAdmits(all.filter(s => !s.admission_fee_paid));
      setIsMock(false);
    } catch {
      let d=[...MOCK_STUDENTS];
      if (search) d=d.filter(s=>(s.first_name+' '+s.last_name).toLowerCase().includes(search.toLowerCase())||s.admission_no.includes(search));
      if (filterCls) d=d.filter(s=>s.class_name===filterCls);
      if (filterFee) d=d.filter(s=>s.fee_status===filterFee);
      setStudents(d); setTotal(d.length); setIsMock(true);
    } finally { setLoading(false); }
  }, [page, search, filterCls]);

  // ── Fee collection ──────────────────────────────────────
  const openFeeModal = useCallback(async (student) => {
    setFeeStudent(student);
    setFeeForm({ selectedIds:[], mode:'cash', remarks:'' });
    setFeeLoading(true);
    try {
      // Always fetch by class NAME — avoids UUID mismatch between duplicate class entries
      let structData = [];
      try {
        // Direct SQL: get all enabled fee heads for this class name
        const res = await api.get('/fees/structure', { params: { className: student.class_name || '' } });
        structData = res.data.data || [];
      } catch {}

      const feesRes = await feeAPI.getStudentFees(student.id);
      const feeList = structData.map(s => ({
        id:        s.fee_type_id || s.id,
        name:      s.fee_type_name || s.name,
        amount:    parseFloat(s.amount) || 0,
        frequency: s.frequency,
        dueDate:   s.due_date,
      }));

      // If student has a transport route assigned, find "Transportation" fee head
      // and override its amount with the route's monthly_fee
      if (student.route_id && student.route_name) {
        const transIdx = feeList.findIndex(f =>
          f.name.toLowerCase().includes('transport')
        );
        if (transIdx >= 0) {
          // Update existing Transportation fee head with route name + amount
          feeList[transIdx] = {
            ...feeList[transIdx],
            name:        '🚌 Transportation — ' + student.route_name,
            amount:      parseFloat(student.transport_fee) || feeList[transIdx].amount,
            isTransport: true,
            routeId:     student.route_id,
          };
        }
        // If no Transportation fee head exists in class structure — don't add it
        // User must first configure Transportation fee head in Fee Management
      }
      setFeeTypes(feeList);
      setStuFees(feesRes.data.data || []);
      // Auto-select all pending fee heads on open
      const pendingIds = feeList
        .filter(ft => {
          const isTransportFake = ft.isTransport && ft.id.startsWith('transport_');
          if (isTransportFake) return true;
          const sf = feesRes.data.data?.find(s => s.fee_type_id === ft.id);
          return sf?.status !== 'paid';
        })
        .map(ft => ft.id);
      setFeeForm(f => ({ ...f, selectedIds: pendingIds }));
    } catch { setFeeTypes([]); setStuFees([]); }
    finally { setFeeLoading(false); }
  }, []);

  const [lastReceiptData, setLastReceiptData] = useState(null); // {student, items, mode, receiptNo, remarks}

  const buildReceiptHTML = (student, collectedItems, paymentMode, receiptNo, remarks) => {
    const school  = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
    const total   = collectedItems.reduce((s,i) => s + i.amount, 0);
    const today   = new Date();
    const dateStr = today.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    const numToWords = n => {
      const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      if(n===0)return'Zero';if(n<20)return a[n];if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');
      if(n<1000)return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+numToWords(n%100):'');
      if(n<100000)return numToWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+numToWords(n%1000):'');
      return numToWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+numToWords(n%100000):'');
    };
    const rows = collectedItems.map((item,i)=>
      `<tr><td class="c">${i+1}</td><td>${item.name}</td><td class="r">₹${Number(item.amount).toLocaleString('en-IN')}</td></tr>`
    ).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Fee Receipt</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;font-size:11px;background:#fff;}
.page{width:180mm;margin:0 auto;border:1.5px solid #000;}
.hdr{text-align:center;padding:6px 10px;border-bottom:1px solid #000;}
.hdr .sn{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:.03em;}
.hdr .si{font-size:9px;color:#444;margin-top:2px;}
.hdr .ti{font-size:10px;font-weight:700;background:#f0f0f0;display:inline-block;padding:1px 8px;margin-top:3px;border:1px solid #ccc;}
.stu{display:grid;grid-template-columns:1fr 1fr auto;border-bottom:1px solid #000;gap:0;}
.sl{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.sr{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.sp{width:60px;height:66px;border:none;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f5f5;}
.row{display:flex;margin-bottom:2px;}.lbl{font-weight:700;width:48px;flex-shrink:0;}
table{width:100%;border-collapse:collapse;font-size:10px;}
th{border:1px solid #000;padding:3px 6px;background:#f0f0f0;font-size:9px;text-transform:uppercase;}
td{border:1px solid #000;padding:3px 6px;}
td.c{text-align:center;width:28px;}td.r{text-align:right;width:80px;font-weight:600;}
.foot{display:grid;grid-template-columns:1fr 1fr;border-top:1.5px solid #000;}
.fl{padding:6px 8px;border-right:1px solid #000;font-size:10px;}
.fr{padding:6px 8px;font-size:10px;}
.al{display:flex;justify-content:space-between;margin-bottom:2px;}
.al.tot{font-weight:800;font-size:12px;border-top:1px solid #000;padding-top:3px;margin-top:3px;}
.sig{display:flex;justify-content:space-between;padding:6px 10px;border-top:1px solid #000;font-size:10px;}
@media print{@page{size:A5 landscape;margin:3mm;}body{margin:0;}button{display:none!important;}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="si">${school.affiliation?'Affiliation No. '+school.affiliation+' &nbsp;|&nbsp; ':''}</div>
    <div class="sn">${school.schoolName||'School Name'}</div>
    <div class="si">${[school.address,school.city,school.phone].filter(Boolean).join(' | ')}</div>
    <div class="ti">Fee Receipt</div>
  </div>
  <div class="stu">
    <div class="sl">
      <div class="row"><span class="lbl">Adm.No</span><span>: ${student.admission_no||'—'}</span></div>
      <div class="row"><span class="lbl">Date</span><span>: ${dateStr}</span></div>
      <div class="row"><span class="lbl">Receipt</span><span>: ${receiptNo}</span></div>
      <div class="row"><span class="lbl">Class</span><span>: ${student.class_name||'—'} ${student.section_name||''}</span></div>
      <div class="row"><span class="lbl">Session</span><span>: ${today.getFullYear()}-${String(today.getFullYear()+1).slice(-2)}</span></div>
    </div>
    <div class="sr">
      <div class="row"><span class="lbl">Name</span><span>: <strong>${student.first_name} ${student.last_name||''}</strong></span></div>
      <div class="row"><span class="lbl">Father</span><span>: ${student.parent_name||'—'}</span></div>
      <div class="row"><span class="lbl">Mobile</span><span>: ${student.parent_phone||'—'}</span></div>
      <div class="row" style="margin-top:4px"><span class="lbl">Month</span><span>: <strong>${today.toLocaleString('en-IN',{month:'long'})} ${today.getFullYear()}</strong></span></div>
    </div>
    <div class="sp">${student.photo_url?`<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover"/>`:'<span style="font-size:24px;color:#ccc">👤</span>'}</div>
  </div>
  <table><thead><tr><th style="width:28px">Sr.</th><th>Particulars</th><th style="width:80px;text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="foot">
    <div class="fl">
      <div style="margin-bottom:3px"><strong>Mode : </strong>${paymentMode.replace(/_/g,' ').toUpperCase()}</div>
      <div style="margin-bottom:3px"><strong>Paid : </strong>₹${Number(total).toLocaleString('en-IN')}</div>
      <div>(${numToWords(Math.round(total))} Only)</div>
      ${remarks?`<div style="margin-top:3px;font-size:9px;color:#555">Remarks: ${remarks}</div>`:''}
    </div>
    <div class="fr">
      <div class="al"><span>Total Fee</span><span>₹${Number(total).toLocaleString('en-IN')}</span></div>
      <div class="al"><span>- Concession</span><span>0</span></div>
      <div class="al tot"><span>Amount Received</span><span>₹${Number(total).toLocaleString('en-IN')}</span></div>
      <div class="al"><span>Balance</span><span>0</span></div>
    </div>
  </div>
  <div class="sig"><span>Received By : ................................</span><span>School Seal &amp; Signature</span></div>
</div>
</body></html>`;
  };

  const printFeeReceipt = (student, collectedItems, paymentMode, receiptNo, remarks) => {
    const html = buildReceiptHTML(student, collectedItems, paymentMode, receiptNo, remarks);
    const win = window.open('','_blank','width=750,height=550');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.print(); } catch(e){} }, 600);
  };

  const sendWhatsApp = (student, collectedItems, paymentMode, receiptNo) => {
    const total   = collectedItems.reduce((s,i) => s + i.amount, 0);
    const items   = collectedItems.map(i => `• ${i.name}: ₹${Number(i.amount).toLocaleString('en-IN')}`).join('\n');
    const today   = new Date().toLocaleDateString('en-IN');
    const school  = (() => { try { return JSON.parse(localStorage.getItem('school_settings'))||{}; } catch { return {}; } })();
    const msg = `🏫 *${school.schoolName||'School'}*\n\n` +
      `📄 *Fee Receipt*\n` +
      `Receipt No: ${receiptNo}\n` +
      `Date: ${today}\n\n` +
      `👤 *${student.first_name} ${student.last_name||''}*\n` +
      `Adm. No: ${student.admission_no}\n` +
      `Class: ${student.class_name||'—'}\n\n` +
      `💰 *Payment Details*\n${items}\n\n` +
      `*Total Paid: ₹${Number(total).toLocaleString('en-IN')}*\n` +
      `Mode: ${paymentMode.replace(/_/g,' ').toUpperCase()}\n\n` +
      `Thank you! 🙏`;
    const phone = (student.parent_phone||'').replace(/\D/g,'');
    const wa = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank');
  };

  const handleCollectFee = async (e) => {
    e.preventDefault();
    if (!feeForm.selectedIds.length) { toast.error('Select at least one fee head'); return; }
    setCollecting(true);
    try {
      const results    = [];
      const collected  = [];
      let   lastReceipt = 'RCP' + Date.now();
      for (const id of feeForm.selectedIds) {
        const ft   = feeTypes.find(f => f.id === id);
        const sf   = stuFees.find(f => f.fee_type_id === id);
        const isTransportFake = ft?.isTransport && id.startsWith('transport_');
        const paid = isTransportFake ? 0 : parseFloat(sf?.paid_amount || 0);
        const amt  = Math.max(0, (ft?.amount || 0) - paid) || ft?.amount || 0;
        if (amt <= 0) continue;
        const res = await feeAPI.collect({
          studentId:   feeStudent.id,
          feeTypeId:   (ft?.isTransport && id.startsWith('transport_')) ? undefined : id,
          amount:      amt,
          paymentMode: feeForm.mode,
          remarks:     (feeForm.remarks ? feeForm.remarks + ' | ' : '') + (ft?.name || ''),
        });
        collected.push({ name: ft?.name || 'Fee', amount: amt });
        if (res.data?.data?.receipt_no) lastReceipt = res.data.data.receipt_no;
        results.push(res.data);
      }
      toast.success('✅ ' + results.length + ' payment(s) collected!');
      const admissionJustConfirmed = results.some(r => r?.admissionConfirmed);
      if (admissionJustConfirmed) {
        toast.success('🎓 Admission confirmed! Student is now active in all modules.', { duration: 4000 });
      }
      const feesRes = await feeAPI.getStudentFees(feeStudent.id);
      setStuFees(feesRes.data.data || []);
      setFeeForm({ selectedIds:[], mode:'cash', remarks:'' });
      // Store receipt data for print/WhatsApp modal
      if (collected.length > 0) {
        setLastReceiptData({ student:feeStudent, items:collected, mode:feeForm.mode, receiptNo:lastReceipt, remarks:feeForm.remarks });
      }
      loadStudents();
      if (admissionJustConfirmed) {
        setTimeout(() => { setFeeStudent(null); setFeeTypes([]); setStuFees([]); }, 2500);
      }
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setCollecting(false); }
  };


  useEffect(() => {
    loadStudents();
    schoolAPI.getClasses()
      .then(r => { const cls = r.data.data || []; if (cls.length) setDbClasses(cls.map(c => c.name)); })
      .catch(() => {});
    routeAPI.getAll()
      .then(r => setDbRoutes(r.data.data || []))
      .catch(() => {});
  }, [loadStudents]);

  // Re-fetch when navigated from Registration (after admit)
  useEffect(() => {
    if (location.state?.refresh) {
      loadStudents();
      if (location.state?.admNo) {
        setSearch(location.state.admNo);
      }
      // Clear state so refresh doesn't loop
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadStudents]);

  // ── Open edit ────────────────────────────────────────────
  const openEdit = async (s) => {
    setEditForm({
      firstName:  s.first_name||'',
      lastName:   s.last_name||'',
      dob:        fmtDate(s.date_of_birth),
      gender:     s.gender||'male',
      blood:      s.blood_group||'',
      category:   s.category||'general',
      aadhaar:    s.aadhaar_no||'',
      photoUrl:   s.photo_url||null,
      class_:     s.class_name||'',
      section:    s.section_name||'A',
      admDate:    fmtDate(s.admission_date)||'',
      prevSchool: s.previous_school||'',
      rollNo:     s.roll_no||'',
      parentName: s.parent_name||'',
      motherName: '',
      phone:      s.parent_phone||'',
      altPhone:   '',
      email:      s.parent_email||'',
      address:    s.address_line1||'',
      city:       s.city||'',
      state:      s.state||'',
      pincode:    s.pincode||'',
      routeId:    s.route_id||'',
    });
    setEditSt(s);
  };

  const handleSaveEdit = async () => {
    // Validate
    const errs = {};
    if (!editForm.firstName?.trim()) errs.firstName = 'First name required';
    if (!editForm.phone?.trim())     errs.phone     = 'Phone required';
    if (editForm.phone && !/^\d{10}$/.test(editForm.phone.trim())) errs.phone = 'Enter valid 10-digit phone';
    if (!editForm.class_)            errs.class_    = 'Class required';
    if (editForm.dob && isNaN(new Date(editForm.dob))) errs.dob = 'Invalid date';
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      Object.values(errs).forEach(msg => toast.error(msg));
      return;
    }
    setEditErrors({});
    setEditSaving(true);
    const payload = {
      firstName:      editForm.firstName,
      lastName:       editForm.lastName,
      dateOfBirth:    editForm.dob && editForm.dob !== '' ? editForm.dob : undefined,
      gender:         editForm.gender,
      bloodGroup:     editForm.blood || undefined,
      category:       editForm.category,
      aadhaarNo:      editForm.aadhaar || undefined,
      photoUrl:       editForm.photoUrl || undefined,
      className:      editForm.class_ || undefined,
      sectionName:    editForm.section || undefined,
      previousSchool: editForm.prevSchool || undefined,
      parentFullName: editForm.parentName || undefined,
      parentPhone:    editForm.phone || undefined,
      parentEmail:    editForm.email || undefined,
      addressLine1:   editForm.address || undefined,
      city:           editForm.city || undefined,
      state:          editForm.state || undefined,
      pincode:        editForm.pincode || undefined,
    };
    try {
      await studentAPI.update(editSt.id, payload);
      await routeAPI.assign(editSt.id, { routeId: editForm.routeId || null });
      toast.success('✅ Student updated! Changes synced to registration & enquiry.');
      loadStudents();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
      setEditSt(null);
    }
  };

  // ── Validate add form ────────────────────────────────────
  const validate = () => {
    const e={};
    if (step===1) { if(!form.firstName.trim()) e.firstName='Required'; if(!form.dob) e.dob='Required'; }
    if (step===2) { if(!form.fatherName.trim()) e.fatherName='Required'; if(!form.phone.trim()) e.phone='Required'; if(form.phone&&!/^\d{10}$/.test(form.phone)) e.phone='10 digits required'; }
    if (step===3) { if(!form.class_.trim()) e.class_='Select a class'; }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const openAdd  = ()=>{ setForm(EMPTY); setErrors({}); setStep(1); setShowAdd(true); setViewSt(null); };
  const closeAdd = ()=>{ setShowAdd(false); setErrors({}); setStep(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!validate()) return;
    if(step<3){ setStep(step+1); return; }
    setSaving(true);
    const payload = {
      firstName:form.firstName, lastName:form.lastName, dateOfBirth:form.dob, gender:form.gender,
      bloodGroup:form.blood||undefined, category:form.category, aadhaarNo:form.aadhaar||undefined,
      religion:form.religion||undefined, className:form.class_, sectionName:form.section,
      admissionDate:form.admDate && form.admDate !== '' ? form.admDate : undefined, previousSchool:form.prevSchool||undefined,
      addressLine1:form.address||undefined, city:form.city||undefined,
      state:form.state||undefined, pincode:form.pincode||undefined,
      photoUrl:form.photoUrl||undefined,
      parents:[{ relation:'father', fullName:form.fatherName, phone:form.phone, alternatePhone:form.altPhone||undefined, email:form.email||undefined, isPrimaryContact:true }],
    };
    if(form.motherName) payload.parents.push({ relation:'mother', fullName:form.motherName, phone:'', isPrimaryContact:false });
    try {
      const res = await studentAPI.create(payload);
      const newStudentId = res.data.data?.id;
      // Assign transport route if selected
      if (form.routeId && newStudentId) {
        await routeAPI.assign(newStudentId, { routeId: form.routeId });
      }
      toast.success('✅ Student admitted and saved to database!');
      closeAdd(); loadStudents();
    } catch(err) {
      toast.error('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const STEPS = ['Student Info','Parent Info','Academic'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{position:'relative'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Students</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {total} students &nbsp;
            {isMock
              ? <span style={{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700}}>Demo mode</span>
              : <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>}
          </p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button style={{padding:'9px 14px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>📥 Export</button>
          <button onClick={openAdd} style={{padding:'9px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ New Admission</button>
        </div>
      </div>

      {/* Pending Admissions Banner */}
      {pendingAdmits.length > 0 && (
        <div style={{background:'#FEF3C7',border:'1.5px solid #F59E0B',borderRadius:12,padding:'12px 16px',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,color:'#92400E',marginBottom:10}}>
            ⏳ {pendingAdmits.length} pending admission(s) — collect fee to activate in all modules
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {pendingAdmits.map(s => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#fff',borderRadius:10,border:'1px solid #F59E0B',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#1E1B4B',flexShrink:0}}>
                  {s.first_name[0]}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:'#111827'}}>{s.first_name} {s.last_name||''}</div>
                  <div style={{fontSize:10,color:'#9CA3AF'}}>{s.admission_no} · {s.class_name||'—'}</div>
                </div>
                <button
                  onClick={()=>{ setViewSt(s); openFeeModal(s); }}
                  style={{padding:'5px 12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                  💰 Collect Fee
                </button>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'#92400E',marginTop:8}}>
            Once any fee is collected → student activates automatically in ID Card, Attendance, Examinations, Fee Management, Timetable
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input placeholder="Search name, admission no…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{...inp(),maxWidth:300,flex:1}}/>
        <select value={filterCls} onChange={e=>{setFilterCls(e.target.value);setPage(1);}} style={{...inp(),width:'auto'}}>
          <option value=''>All Classes</option>{dbClasses.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterFee} onChange={e=>{setFilterFee(e.target.value);setPage(1);}} style={{...inp(),width:'auto'}}>
          <option value=''>Fee: All</option><option value='paid'>Paid</option><option value='pending'>Pending</option><option value='partial'>Partial</option>
        </select>
        {(search||filterCls||filterFee)&&<button onClick={()=>{setSearch('');setFilterCls('');setFilterFee('');setPage(1);}} style={{padding:'9px 14px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:12,color:'#6B7280',cursor:'pointer'}}>Clear ✕</button>}
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F9FAFB'}}>
            {['Photo','Adm No.','Student','Class','Parent / Phone','Category','Fee','Status','Actions'].map(h=>(
              <th key={h} style={{padding:'10px 14px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading&&<tr><td colSpan={9} style={{padding:36,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading…</td></tr>}
            {!loading&&students.length===0&&<tr><td colSpan={9} style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:36,marginBottom:10}}>👨‍🎓</div><div style={{fontWeight:600,color:'#6B7280'}}>No students found</div></td></tr>}
            {!loading&&students.map((s,idx)=>{
              const name=`${s.first_name} ${s.last_name}`.trim();
              const fb=FEE_BADGE[s.fee_status]||FEE_BADGE.pending;
              return (
                <tr key={s.id} style={{borderBottom:'0.5px solid #F3F4F6',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{padding:'8px 12px'}}>
                    {s.photo_url
                      ? <img src={s.photo_url} alt="" style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'1.5px solid #E5E7EB'}}/>
                      : <div style={{width:36,height:36,borderRadius:8,background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#9CA3AF'}}>👤</div>}
                  </td>
                  <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{s.admission_no}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{fontWeight:700,color:'#111827'}}>{name}</div>
                    <div style={{fontSize:10,color:'#9CA3AF'}}>{s.gender} · {displayDate(s.date_of_birth)}</div>
                    {!s.admission_fee_paid && (
                      <span style={{padding:'2px 7px',borderRadius:10,fontSize:9,fontWeight:700,background:'#FEF3C7',color:'#92400E',display:'inline-block',marginTop:3}}>
                        ⏳ Fee Pending
                      </span>
                    )}
                  </td>
                  <td style={{padding:'11px 14px',fontWeight:500,color:'#374151'}}>{s.class_name} — {s.section_name}</td>
                  <td style={{padding:'11px 14px'}}><div style={{fontWeight:500}}>{s.parent_name}</div><div style={{fontSize:10,color:'#9CA3AF'}}>{s.parent_phone}</div></td>
                  <td style={{padding:'11px 14px'}}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,background:'#F3F4F6',color:'#374151',textTransform:'uppercase'}}>{s.category}</span></td>
                  <td style={{padding:'11px 14px'}}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:fb.bg,color:fb.c}}>{fb.label}</span></td>
                  <td style={{padding:'11px 14px'}}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,background:'#D1FAE5',color:'#065F46'}}>{s.status}</span></td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setViewSt(s)} style={{padding:'5px 12px',border:'1px solid #1E1B4B',borderRadius:7,background:'#EDE9F8',color:'#1E1B4B',fontSize:11,fontWeight:600,cursor:'pointer'}}>View</button>
                      <button onClick={()=>openEdit(s)} style={{padding:'5px 10px',border:'1.5px solid #F59E0B',borderRadius:7,background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️</button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:'10px 14px',borderTop:'0.5px solid #E5E7EB',fontSize:11,color:'#6B7280',display:'flex',justifyContent:'space-between'}}>
          <span>Showing <strong>{students.length}</strong> of <strong>{total}</strong></span>
          <div style={{display:'flex',gap:6}}>
            {page>1&&<button onClick={()=>setPage(p=>p-1)} style={{padding:'4px 10px',border:'1px solid #E5E7EB',borderRadius:6,background:'#fff',fontSize:11,cursor:'pointer'}}>← Prev</button>}
            <span style={{padding:'4px 10px',background:'#1E1B4B',color:'#fff',borderRadius:6,fontWeight:700,fontSize:11}}>Page {page}</span>
            {students.length===15&&<button onClick={()=>setPage(p=>p+1)} style={{padding:'4px 10px',border:'1px solid #E5E7EB',borderRadius:6,background:'#fff',fontSize:11,cursor:'pointer'}}>Next →</button>}
          </div>
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewSt&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:18,width:500,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>👨‍🎓 Student Profile</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setViewSt(null);openEdit(viewSt);}} style={{padding:'6px 14px',border:'1.5px solid #F59E0B',borderRadius:8,background:'#FEF3C7',color:'#92400E',fontSize:12,fontWeight:700,cursor:'pointer'}}>✏️ Edit</button>
                <button onClick={()=>setViewSt(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
              </div>
            </div>
            <div style={{padding:22}}>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:16,background:'#EDE9F8',borderRadius:12,marginBottom:20}}>
                {viewSt.photo_url
                  ? <img src={viewSt.photo_url} alt="" style={{width:64,height:64,borderRadius:14,objectFit:'cover',flexShrink:0,border:'3px solid #fff',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}/>
                  : <div style={{width:64,height:64,borderRadius:14,background:'#1E1B4B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#fff',flexShrink:0}}>{viewSt.first_name?.[0]}</div>}
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:'#111827'}}>{viewSt.first_name} {viewSt.last_name}</div>
                  <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>Admission No: <strong>{viewSt.admission_no}</strong></div>
                  <div style={{display:'flex',gap:7,marginTop:6,flexWrap:'wrap'}}>
                    <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#1E1B4B',color:'#fff'}}>{viewSt.class_name} {viewSt.section_name}</span>
                    <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:(FEE_BADGE[viewSt.fee_status]||FEE_BADGE.pending).bg,color:(FEE_BADGE[viewSt.fee_status]||FEE_BADGE.pending).c}}>{(FEE_BADGE[viewSt.fee_status]||FEE_BADGE.pending).label}</span>
                    <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#D1FAE5',color:'#065F46'}}>{viewSt.status}</span>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[['DOB',displayDate(viewSt.date_of_birth)],['Gender',viewSt.gender||'—'],['Blood Group',viewSt.blood_group||'—'],['Category',viewSt.category],['Parent',viewSt.parent_name||'—'],['Phone',viewSt.parent_phone||'—'],['Admission Date',displayDate(viewSt.admission_date)],['Status',viewSt.status]].map(([k,v])=>(
                  <div key={k} style={{padding:'10px 12px',background:'#F9FAFB',borderRadius:9}}>
                    <div style={{fontSize:10,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{v}</div>
                  </div>
                ))}
              </div>
              {viewSt.route_id && (
                <div style={{padding:'10px 14px',background:'#EDE9F8',borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:20}}>🚌</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:'#1E1B4B'}}>Transport Assigned</div>
                    <div style={{fontSize:12,color:'#6B52B0',marginTop:1}}>
                      {viewSt.route_name}
                      {viewSt.transport_fee ? <span style={{marginLeft:10,fontWeight:700}}>₹{Number(viewSt.transport_fee).toLocaleString('en-IN')}/month</span> : ''}
                    </div>
                  </div>
                </div>
              )}
              {(viewSt.registration_id||viewSt.enquiry_id)&&(
                <div style={{marginTop:12,padding:'10px 12px',background:'#EDE9F8',borderRadius:9,fontSize:11,color:'#1E1B4B'}}>
                  {viewSt.enquiry_id&&<div>📞 Came from enquiry</div>}
                  {viewSt.registration_id&&<div>📄 Came from registration</div>}
                  <div style={{fontSize:10,color:'#6B52B0',marginTop:2}}>Editing this student syncs changes back to linked records</div>
                </div>
              )}
              <div style={{display:'flex',gap:10,marginTop:16}}>
                <button onClick={()=>openFeeModal(viewSt)} style={{flex:1,padding:'10px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer'}}>💰 Collect Fee</button>
                <button onClick={()=>toast.success('ID card!')} style={{flex:1,padding:'10px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>📄 ID Card</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT STUDENT MODAL ── */}
      {editSt&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:18,width:600,maxHeight:'92vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>✏️ Edit Student — {editSt.admission_no}</div>
                {(editSt.registration_id||editSt.enquiry_id)&&(
                  <div style={{fontSize:11,color:'#065F46',marginTop:2}}>✅ Changes will sync to linked Registration and Enquiry</div>
                )}
              </div>
              <button onClick={()=>{setEditSt(null);setEditErrors({});}} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>
            <div style={{padding:20}}>

              {/* Photo + Name */}
              <div style={{display:'flex',gap:16,padding:14,background:'#F9FAFB',borderRadius:12,marginBottom:16,alignItems:'center'}}>
                <div style={{flexShrink:0,textAlign:'center'}}>
                  <div style={{width:80,height:80,borderRadius:10,border:editForm.photoUrl?'none':'2px dashed #C4B5FD',background:editForm.photoUrl?'transparent':'#EDE9F8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden'}}
                    onClick={()=>document.getElementById('edit-photo-inp').click()}>
                    {editForm.photoUrl
                      ? <img src={editForm.photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <><span style={{fontSize:22}}>📷</span><span style={{fontSize:9,color:'#7C3AED',fontWeight:600,marginTop:2}}>Change Photo</span></>}
                  </div>
                  <input id="edit-photo-inp" type="file" accept="image/*" onChange={e=>{
                    const file=e.target.files[0]; if(!file)return;
                    if(file.size>3*1024*1024){toast.error('Max 3MB');return;}
                    const r=new FileReader(); r.onload=ev=>setEditForm(p=>({...p,photoUrl:ev.target.result})); r.readAsDataURL(file);
                  }} style={{display:'none'}}/>
                  {editForm.photoUrl&&<button type="button" onClick={()=>setEditForm(p=>({...p,photoUrl:null}))} style={{fontSize:10,color:'#DC2626',background:'none',border:'none',cursor:'pointer',marginTop:4}}>Remove</button>}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div><label style={{fontSize:11,fontWeight:700,color:editErrors.firstName?'#DC2626':'#4B5563',display:'block',marginBottom:4}}>First Name *</label><input value={editForm.firstName} onChange={e=>setEditForm(p=>({...p,firstName:e.target.value}))} style={{...inp(),borderColor:editErrors.firstName?'#DC2626':'#E5E7EB'}} autoFocus/>{editErrors.firstName&&<div style={{fontSize:10,color:'#DC2626',marginTop:3}}>⚠️ {editErrors.firstName}</div>}</div>
                    <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Last Name</label><input value={editForm.lastName} onChange={e=>setEditForm(p=>({...p,lastName:e.target.value}))} style={inp()}/></div>
                  </div>
                </div>
              </div>

              {/* Personal */}
              <Divider title="Personal Details"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Date of Birth</label><input type="date" value={editForm.dob} onChange={e=>setEditForm(p=>({...p,dob:e.target.value}))} style={inp()}/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Gender</label><select value={editForm.gender} onChange={e=>setEditForm(p=>({...p,gender:e.target.value}))} style={inp()}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Blood Group</label><select value={editForm.blood} onChange={e=>setEditForm(p=>({...p,blood:e.target.value}))} style={inp()}><option value="">Select</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}</select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Category</label><select value={editForm.category} onChange={e=>setEditForm(p=>({...p,category:e.target.value}))} style={inp()}><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option></select></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Aadhaar No.</label><input value={editForm.aadhaar||''} onChange={e=>setEditForm(p=>({...p,aadhaar:e.target.value}))} placeholder="12-digit (optional)" style={inp()} maxLength={12}/></div>
              </div>

              {/* Academic */}
              <Divider title="Academic Placement"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:editErrors.class_?'#DC2626':'#4B5563',display:'block',marginBottom:4}}>Class *</label><select value={editForm.class_} onChange={e=>setEditForm(p=>({...p,class_:e.target.value}))} style={{...inp(),borderColor:editErrors.class_?'#DC2626':'#E5E7EB'}}><option value="">Select Class</option>{dbClasses.map(cl=><option key={cl}>{cl}</option>)}</select>{editErrors.class_&&<div style={{fontSize:10,color:'#DC2626',marginTop:3}}>⚠️ {editErrors.class_}</div>}</div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Section</label><select value={editForm.section||'A'} onChange={e=>setEditForm(p=>({...p,section:e.target.value}))} style={inp()}>{['A','B','C','D'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Admission Date</label><input type="date" value={editForm.admDate||''} onChange={e=>setEditForm(p=>({...p,admDate:e.target.value}))} style={inp()}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Previous School</label><input value={editForm.prevSchool||''} onChange={e=>setEditForm(p=>({...p,prevSchool:e.target.value}))} style={inp()}/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Roll No.</label><input value={editForm.rollNo||''} onChange={e=>setEditForm(p=>({...p,rollNo:e.target.value}))} style={inp()}/></div>
              </div>

              {/* Parent */}
              <Divider title="Parent / Guardian"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Father's Name</label><input value={editForm.parentName} onChange={e=>setEditForm(p=>({...p,parentName:e.target.value}))} style={inp()}/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Mother's Name</label><input value={editForm.motherName||''} onChange={e=>setEditForm(p=>({...p,motherName:e.target.value}))} style={inp()}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:editErrors.phone?'#DC2626':'#4B5563',display:'block',marginBottom:4}}>Primary Mobile *</label><input value={editForm.phone} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} maxLength={10} style={{...inp(),borderColor:editErrors.phone?'#DC2626':'#E5E7EB'}}/>{editErrors.phone&&<div style={{fontSize:10,color:'#DC2626',marginTop:3}}>⚠️ {editErrors.phone}</div>}</div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Alternate Mobile</label><input value={editForm.altPhone||''} onChange={e=>setEditForm(p=>({...p,altPhone:e.target.value}))} maxLength={10} style={inp()}/></div>
              </div>
              <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Email</label><input type="email" value={editForm.email} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} style={inp()}/></div>

              {/* Address */}
              <Divider title="Address"/>
              <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Full Address</label><textarea value={editForm.address||''} onChange={e=>setEditForm(p=>({...p,address:e.target.value}))} rows={2} style={{...inp(),resize:'vertical'}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>City</label><input value={editForm.city||''} onChange={e=>setEditForm(p=>({...p,city:e.target.value}))} style={inp()}/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>State</label><input value={editForm.state||''} onChange={e=>setEditForm(p=>({...p,state:e.target.value}))} style={inp()}/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Pincode</label><input value={editForm.pincode||''} onChange={e=>setEditForm(p=>({...p,pincode:e.target.value}))} maxLength={6} style={inp()}/></div>
              </div>

              {/* Transport */}
              <Divider title="🚌 Transport"/>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#4B5563',display:'block',marginBottom:4}}>Assign Transport Route</label>
                <select value={editForm.routeId} onChange={e=>setEditForm(p=>({...p,routeId:e.target.value}))} style={inp()}>
                  <option value="">No Transport / Day Scholar</option>
                  {dbRoutes.map(r=>(
                    <option key={r.id} value={r.id}>
                      {r.route_name}{r.route_no?' ('+r.route_no+')':''} — ₹{Number(r.monthly_fee||0).toLocaleString('en-IN')}/month
                    </option>
                  ))}
                </select>
                {editForm.routeId && (()=>{
                  const r=dbRoutes.find(x=>x.id===editForm.routeId);
                  return r?<div style={{marginTop:6,padding:'6px 10px',background:'#D1FAE5',borderRadius:7,fontSize:11,color:'#065F46',fontWeight:600}}>
                    🚌 {r.route_name} · ₹{Number(r.monthly_fee||0).toLocaleString('en-IN')}/month will appear in fee collection
                  </div>:null;
                })()}
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setEditSt(null)} style={{padding:'10px 18px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSaveEdit} disabled={editSaving}
                  style={{padding:'10px 22px',background:editSaving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:editSaving?'not-allowed':'pointer'}}>
                  {editSaving?'⏳ Saving…':'💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD STUDENT DRAWER ── */}
      {showAdd&&(
        <>
          <div onClick={closeAdd} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:400}}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,maxWidth:'95vw',maxHeight:'92vh',background:'#fff',zIndex:500,display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,.25)',borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#111827'}}>🎓 New Student Admission</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>Step {step} of 3 — {STEPS[step-1]}</div>
              </div>
              <button onClick={closeAdd} style={{background:'#F3F4F6',border:'none',borderRadius:9,width:34,height:34,cursor:'pointer',fontSize:18,color:'#374151',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'12px 22px',borderBottom:'1px solid #F3F4F6',display:'flex',flexShrink:0}}>
              {STEPS.map((label,i)=>{
                const n=i+1,done=step>n,active=step===n;
                return (
                  <div key={n} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,position:'relative'}}>
                    {i<2&&<div style={{position:'absolute',top:12,left:'55%',right:'-45%',height:2,background:done?'#1E1B4B':'#E5E7EB',zIndex:0}}/>}
                    <div style={{width:26,height:26,borderRadius:'50%',background:done||active?'#1E1B4B':'#F3F4F6',color:done||active?'#fff':'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,zIndex:1,border:'2px solid '+(done||active?'#1E1B4B':'#E5E7EB'),position:'relative'}}>
                      {done?'✓':n}
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:active?'#1E1B4B':done?'#6B7280':'#9CA3AF'}}>{label}</div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSubmit} style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
              {step===1&&(
                <>
                  <div style={{display:'flex',gap:14,padding:12,background:'#F9FAFB',borderRadius:12,marginBottom:14,alignItems:'flex-start'}}>
                    <div style={{flexShrink:0,textAlign:'center'}}>
                      <div style={{fontSize:10,fontWeight:700,color:'#4B5563',textTransform:'uppercase',marginBottom:5}}>Photo</div>
                      <div onClick={()=>document.getElementById('add-photo-inp').click()}
                        style={{width:80,height:80,borderRadius:10,border:form.photoUrl?'none':'2px dashed #C4B5FD',background:form.photoUrl?'transparent':'#EDE9F8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden'}}>
                        {form.photoUrl?<img src={form.photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <><span style={{fontSize:22}}>📷</span><span style={{fontSize:9,color:'#7C3AED',fontWeight:600,marginTop:3}}>Upload</span></>}
                      </div>
                      <input id="add-photo-inp" type="file" accept="image/*" onChange={e=>{const file=e.target.files[0];if(!file)return;if(file.size>3*1024*1024){toast.error('Max 3MB');return;}const r=new FileReader();r.onload=ev=>f('photoUrl',ev.target.result);r.readAsDataURL(file);}} style={{display:'none'}}/>
                      {form.photoUrl&&<button type="button" onClick={()=>f('photoUrl',null)} style={{fontSize:9,color:'#DC2626',background:'none',border:'none',cursor:'pointer',marginTop:3}}>Remove</button>}
                    </div>
                    <div style={{flex:1}}>
                      <Divider title="Personal Details"/>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                        <Field label="First Name" required error={errors.firstName}><input value={form.firstName} onChange={e=>f('firstName',e.target.value)} style={inp({error:errors.firstName})} autoFocus/></Field>
                        <Field label="Last Name"><input value={form.lastName} onChange={e=>f('lastName',e.target.value)} style={inp()}/></Field>
                      </div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                    <Field label="Date of Birth" required error={errors.dob}><input type="date" value={form.dob} onChange={e=>f('dob',e.target.value)} style={inp({error:errors.dob})} max={today}/></Field>
                    <Field label="Gender"><select value={form.gender} onChange={e=>f('gender',e.target.value)} style={inp()}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></Field>
                    <Field label="Blood Group"><select value={form.blood} onChange={e=>f('blood',e.target.value)} style={inp()}><option value="">Select</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}</select></Field>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <Field label="Category"><select value={form.category} onChange={e=>f('category',e.target.value)} style={inp()}><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option></select></Field>
                    <Field label="Aadhaar"><input value={form.aadhaar} onChange={e=>f('aadhaar',e.target.value)} placeholder="12-digit (optional)" style={inp()} maxLength={12}/></Field>
                  </div>
                </>
              )}
              {step===2&&(
                <>
                  <Divider title="Parent / Guardian"/>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <Field label="Father's Name" required error={errors.fatherName}><input value={form.fatherName} onChange={e=>f('fatherName',e.target.value)} style={inp({error:errors.fatherName})} autoFocus/></Field>
                    <Field label="Mother's Name"><input value={form.motherName} onChange={e=>f('motherName',e.target.value)} style={inp()}/></Field>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <Field label="Primary Mobile" required error={errors.phone}><input value={form.phone} onChange={e=>f('phone',e.target.value)} maxLength={10} style={inp({error:errors.phone})}/></Field>
                    <Field label="Alternate Mobile"><input value={form.altPhone} onChange={e=>f('altPhone',e.target.value)} style={inp()} maxLength={10}/></Field>
                  </div>
                  <Field label="Email"><input type="email" value={form.email} onChange={e=>f('email',e.target.value)} style={{...inp(),marginBottom:12}}/></Field>
                  <Divider title="Address"/>
                  <Field label="Full Address"><textarea value={form.address} onChange={e=>f('address',e.target.value)} rows={2} style={{...inp(),resize:'vertical',marginBottom:10}}/></Field>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    <Field label="City"><input value={form.city} onChange={e=>f('city',e.target.value)} style={inp()}/></Field>
                    <Field label="State"><input value={form.state} onChange={e=>f('state',e.target.value)} style={inp()}/></Field>
                    <Field label="Pincode"><input value={form.pincode} onChange={e=>f('pincode',e.target.value)} maxLength={6} style={inp()}/></Field>
                  </div>
                </>
              )}
              {step===3&&(
                <>
                  <Divider title="Academic Placement"/>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                    <Field label="Class" required error={errors.class_}><select value={form.class_} onChange={e=>f('class_',e.target.value)} style={inp({error:errors.class_})}><option value="">Select</option>{dbClasses.map(c=><option key={c}>{c}</option>)}</select></Field>
                    <Field label="Section"><select value={form.section} onChange={e=>f('section',e.target.value)} style={inp()}>{['A','B','C','D'].map(s=><option key={s}>{s}</option>)}</select></Field>
                    <Field label="Admission Date"><input type="date" value={form.admDate} onChange={e=>f('admDate',e.target.value)} style={inp()}/></Field>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    <Field label="Previous School"><input value={form.prevSchool} onChange={e=>f('prevSchool',e.target.value)} style={inp()}/></Field>
                    <Field label="Prev Marks %"><input value={form.prevMarks} onChange={e=>f('prevMarks',e.target.value)} style={inp()}/></Field>
                  </div>

                  <Divider title="🚌 Transport Route (Optional)"/>
                  <div style={{marginBottom:16}}>
                    <Field label="Assign Transport Route">
                      <select value={form.routeId||''} onChange={e=>f('routeId',e.target.value)} style={inp()}>
                        <option value="">No Transport / Day Scholar</option>
                        {dbRoutes.map(r=>(
                          <option key={r.id} value={r.id}>
                            {r.route_name}{r.route_no?' ('+r.route_no+')':''} — ₹{Number(r.monthly_fee||0).toLocaleString('en-IN')}/month
                          </option>
                        ))}
                      </select>
                    </Field>
                    {form.routeId && (()=>{
                      const r=dbRoutes.find(x=>x.id===form.routeId);
                      return r?<div style={{marginTop:6,padding:'6px 10px',background:'#D1FAE5',borderRadius:7,fontSize:11,color:'#065F46',fontWeight:600}}>
                        🚌 {r.route_name} · ₹{Number(r.monthly_fee||0).toLocaleString('en-IN')}/month
                      </div>:null;
                    })()}
                  </div>
                  <div style={{padding:14,background:'#EDE9F8',borderRadius:12,marginBottom:12,fontSize:12}}>
                    <div style={{fontWeight:800,color:'#1E1B4B',marginBottom:8}}>📋 Summary</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,color:'#374151'}}>
                      {[['Name',`${form.firstName} ${form.lastName}`.trim()||'—'],['DOB',form.dob||'—'],['Class',form.class_?`${form.class_} - ${form.section}`:'—'],['Father',form.fatherName||'—'],['Phone',form.phone||'—'],['Category',form.category]].map(([k,v])=>(
                        <div key={k}><span style={{color:'#6B7280'}}>{k}: </span><strong>{v}</strong></div>
                      ))}
                    </div>
                  </div>
                  {isMock&&<div style={{padding:10,background:'#FEF3C7',borderRadius:9,fontSize:11,color:'#92400E'}}>⚠️ Backend not connected — will save locally only</div>}
                  {!isMock&&<div style={{padding:10,background:'#D1FAE5',borderRadius:9,fontSize:11,color:'#065F46'}}>✅ Connected — will save to PostgreSQL</div>}
                </>
              )}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:20,paddingTop:14,borderTop:'1px solid #F3F4F6',gap:10}}>
                <button type="button" onClick={closeAdd} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <div style={{display:'flex',gap:10}}>
                  {step>1&&<button type="button" onClick={()=>setStep(step-1)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>← Back</button>}
                  <button type="submit" disabled={saving} style={{padding:'10px 24px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer'}}>
                    {saving?'⏳ Saving…':step<3?'Next Step →':'🎓 Admit Student'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── FEE COLLECTION MODAL ── */}
      {feeStudent && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:540,maxHeight:'90vh',overflow:'auto'}}>
            {/* Header */}
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'#111827'}}>💰 Collect Fee</div>
                <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>
                  {feeStudent.first_name} {feeStudent.last_name||''} &nbsp;·&nbsp; {feeStudent.admission_no} &nbsp;·&nbsp; {feeStudent.class_name||''}
                </div>
              </div>
              <button onClick={()=>setFeeStudent(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:16,color:'#6B7280'}}/></button>
            </div>

            <div style={{padding:20}}>
              {/* Existing fee summary */}
              {feeLoading ? <div style={{textAlign:'center',padding:20,color:'#9CA3AF'}}>⏳ Loading fee records…</div> :
              stuFees.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:8}}>Fee Records — Current Year</div>
                  <div style={{border:'0.5px solid #E5E7EB',borderRadius:10,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr style={{background:'#F9FAFB'}}>
                        {['Fee Head','Amount','Paid','Balance','Status'].map(h=>(
                          <th key={h} style={{padding:'8px 12px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB'}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {stuFees.map((f,i) => {
                          const paid = parseFloat(f.paid_amount||0);
                          const bal  = Math.max(0, parseFloat(f.amount) - paid);
                          const stMap = { paid:['#D1FAE5','#065F46'], partial:['#FEF3C7','#92400E'], pending:['#FEE2E2','#991B1B'] };
                          const [sBg,sC] = stMap[f.status] || ['#F3F4F6','#6B7280'];
                          return (
                            <tr key={f.id} style={{borderBottom:'0.5px solid #F3F4F6',background:i%2?'#FAFAFA':'#fff'}}>
                              <td style={{padding:'8px 12px',fontWeight:600}}>{f.fee_type_name}</td>
                              <td style={{padding:'8px 12px'}}>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                              <td style={{padding:'8px 12px',color:'#065F46',fontWeight:600}}>₹{paid.toLocaleString('en-IN')}</td>
                              <td style={{padding:'8px 12px',fontWeight:700,color:bal>0?'#DC2626':'#065F46'}}>₹{bal.toLocaleString('en-IN')}</td>
                              <td style={{padding:'8px 12px'}}>
                                <span style={{padding:'2px 8px',borderRadius:20,fontSize:9,fontWeight:700,background:sBg,color:sC,textTransform:'uppercase'}}>{f.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{background:'#EDE9F8',borderTop:'2px solid #E5E7EB'}}>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'#1E1B4B'}}>Total</td>
                          <td style={{padding:'8px 12px',fontWeight:700}}>₹{stuFees.reduce((s,f)=>s+parseFloat(f.amount||0),0).toLocaleString('en-IN')}</td>
                          <td style={{padding:'8px 12px',fontWeight:700,color:'#065F46'}}>₹{stuFees.reduce((s,f)=>s+parseFloat(f.paid_amount||0),0).toLocaleString('en-IN')}</td>
                          <td style={{padding:'8px 12px',fontWeight:800,color:'#DC2626'}}>
                            ₹{stuFees.reduce((s,f)=>s+Math.max(0,parseFloat(f.amount||0)-parseFloat(f.paid_amount||0)),0).toLocaleString('en-IN')}
                          </td>
                          <td style={{padding:'8px 12px'}}/>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Fee heads as cards — matching Fee Management UI */}
              <div style={{background:'#F9FAFB',border:'0.5px solid #E5E7EB',borderRadius:12,padding:16}}>
                <div style={{fontWeight:700,fontSize:13,color:'#111827',marginBottom:4}}>
                  New Payment — {feeStudent?.class_name || ''}
                </div>
                <div style={{fontSize:11,color:'#6B7280',marginBottom:14}}>
                  Select a fee head · Amount auto-fills from your fee structure settings
                </div>

                {feeTypes.length === 0 ? (
                  <div style={{padding:'20px',textAlign:'center',background:'#FEF3C7',borderRadius:10,color:'#92400E',fontSize:12}}>
                    ⚠️ No fee heads configured for <strong>{feeStudent?.class_name}</strong>.<br/>
                    Go to <strong>Fee Management → Fee Structure</strong> → select <strong>{feeStudent?.class_name}</strong> → enable fee heads.<br/>
                    {feeStudent?.route_id && <span style={{marginTop:4,display:'block'}}>💡 To collect transport fee, also enable a <strong>Transportation</strong> fee head for this class.</span>}
                  </div>
                ) : (
                  <>
                    {/* Select All / Deselect All */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <span style={{fontSize:12,color:'#6B7280'}}>Select fee heads to collect</span>
                      <div style={{display:'flex',gap:8}}>
                        <button type="button" onClick={()=>{
                          const unpaid = feeTypes.filter(ft=>{
                            const isTransportFake = ft.isTransport && ft.id.startsWith('transport_');
                            if (isTransportFake) return true;
                            const sf=stuFees.find(s=>s.fee_type_id===ft.id);
                            return sf?.status!=='paid';
                          }).map(ft=>ft.id);
                          setFeeForm(f=>({...f,selectedIds:unpaid}));
                        }} style={{padding:'4px 12px',border:'1.5px solid #1E1B4B',borderRadius:7,background:'#EDE9F8',color:'#1E1B4B',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                          ✓ Select All Pending
                        </button>
                        <button type="button" onClick={()=>setFeeForm(f=>({...f,selectedIds:[]}))}
                          style={{padding:'4px 12px',border:'1.5px solid #E5E7EB',borderRadius:7,background:'#fff',color:'#6B7280',fontSize:11,cursor:'pointer'}}>
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Fee head cards with checkboxes */}
                    <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                      {feeTypes.map(ft => {
                        const isSelected = feeForm.selectedIds.includes(ft.id);
                        const stuFee = stuFees.find(sf => sf.fee_type_id === ft.id);
                        // Transport with real UUID — check stuFees; transport with fake id — always pending
                        const isTransportWithFakeId = ft.isTransport && ft.id.startsWith('transport_');
                        const paid   = isTransportWithFakeId ? 0 : parseFloat(stuFee?.paid_amount || 0);
                        const bal    = Math.max(0, ft.amount - paid);
                        const isPaid = isTransportWithFakeId ? false : stuFee?.status === 'paid';
                        const toggle = () => {
                          if (isPaid) return;
                          setFeeForm(f => ({
                            ...f,
                            selectedIds: isSelected
                              ? f.selectedIds.filter(id => id !== ft.id)
                              : [...f.selectedIds, ft.id]
                          }));
                        };
                        return (
                          <div key={ft.id} onClick={toggle}
                            style={{
                              display:'flex', alignItems:'center', gap:12,
                              padding:'12px 14px',
                              border:'2px solid ' + (isPaid ? '#D1FAE5' : isSelected ? '#1E1B4B' : '#E5E7EB'),
                              borderRadius:10,
                              background: isPaid ? '#F0FFF4' : isSelected ? '#EDE9F8' : '#fff',
                              cursor: isPaid ? 'default' : 'pointer',
                              opacity: isPaid ? 0.75 : 1,
                              transition:'all .15s'
                            }}>
                            {/* Checkbox */}
                            <div style={{
                              width:20, height:20, borderRadius:5,
                              border:'2px solid ' + (isPaid ? '#10B981' : isSelected ? '#1E1B4B' : '#D1D5DB'),
                              background: isPaid ? '#10B981' : isSelected ? '#1E1B4B' : '#fff',
                              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                            }}>
                              {(isSelected || isPaid) && <span style={{color:'#fff',fontSize:12,lineHeight:1}}>✓</span>}
                            </div>
                            {/* Fee info */}
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontWeight:700,fontSize:13,color:'#111827'}}>{ft.name}</span>
                                <span style={{padding:'1px 7px',borderRadius:20,fontSize:9,background:'#EDE9F8',color:'#1E1B4B',fontWeight:700,textTransform:'uppercase'}}>{ft.frequency}</span>
                                {isPaid && <span style={{padding:'1px 7px',borderRadius:20,fontSize:9,background:'#D1FAE5',color:'#065F46',fontWeight:700}}>✓ PAID</span>}
                                {stuFee?.status === 'partial' && <span style={{padding:'1px 7px',borderRadius:20,fontSize:9,background:'#FEF3C7',color:'#92400E',fontWeight:700}}>PARTIAL</span>}
                              </div>
                              <div style={{fontSize:11,color:'#6B7280',marginTop:2,display:'flex',gap:12}}>
                                <span>Full Amount: <strong>₹{ft.amount.toLocaleString('en-IN')}</strong></span>
                                {paid > 0 && <span style={{color:'#065F46'}}>Paid: <strong>₹{paid.toLocaleString('en-IN')}</strong></span>}
                              </div>
                            </div>
                            {/* Balance/Amount */}
                            <div style={{textAlign:'right',flexShrink:0}}>
                              {isPaid ? (
                                <div style={{fontSize:13,fontWeight:700,color:'#065F46'}}>Cleared ✓</div>
                              ) : (
                                <>
                                  <div style={{fontSize:16,fontWeight:800,color:isSelected?'#1E1B4B':'#374151'}}>
                                    ₹{bal.toLocaleString('en-IN')}
                                  </div>
                                  <div style={{fontSize:9,color:'#9CA3AF'}}>{bal < ft.amount && bal > 0 ? 'balance due' : 'to collect'}</div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total selected */}
                    {feeForm.selectedIds.length > 0 && (() => {
                      const totalAmt = feeForm.selectedIds.reduce((sum, id) => {
                        const ft = feeTypes.find(f => f.id === id);
                        if (ft?.isTransport) return sum + (ft.amount || 0);
                        const sf = stuFees.find(s => s.fee_type_id === id);
                        const paid = parseFloat(sf?.paid_amount || 0);
                        return sum + Math.max(0, (ft?.amount || 0) - paid);
                      }, 0);
                      return (
                        <div style={{padding:'12px 14px',background:'#1E1B4B',borderRadius:10,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <div style={{fontSize:12,color:'rgba(255,255,255,.7)'}}>{feeForm.selectedIds.length} fee head(s) selected</div>
                            <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>
                              {feeTypes.filter(ft=>feeForm.selectedIds.includes(ft.id)).map(ft=>ft.name).join(' + ')}
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:10,color:'rgba(255,255,255,.6)'}}>Total to Collect</div>
                            <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>₹{totalAmt.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Payment mode & submit */}
                    {feeForm.selectedIds.length > 0 && (
                      <form onSubmit={handleCollectFee}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                          <div>
                            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Payment Mode *</label>
                            <select value={feeForm.mode} onChange={e=>setFeeForm({...feeForm,mode:e.target.value})}
                              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',background:'#fff'}}>
                              {['cash','upi','cheque','bank_transfer','online'].map(m=>(
                                <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Remarks</label>
                            <input value={feeForm.remarks} onChange={e=>setFeeForm({...feeForm,remarks:e.target.value})}
                              placeholder="Optional"
                              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',background:'#fff',boxSizing:'border-box'}}/>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                          <button type="button" onClick={()=>setFeeStudent(null)}
                            style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                          <button type="submit" disabled={collecting}
                            style={{padding:'10px 28px',background:collecting?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:collecting?'not-allowed':'pointer'}}>
                            {collecting ? '⏳ Processing…' : '💳 Collect & Print Receipt (' + feeForm.selectedIds.length + ' fee' + (feeForm.selectedIds.length>1?'s':'') + ')'}
                          </button>
                        </div>
                      </form>
                    )}

                    {!feeForm.selectedIds.length && (
                      <div style={{textAlign:'center',padding:'10px',fontSize:12,color:'#9CA3AF'}}>
                        ☝️ Check the fee heads above to collect payment
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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
              {/* Summary */}
              <div style={{padding:'12px 14px',background:'#F9FAFB',borderRadius:10,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,color:'#111827',marginBottom:6}}>{lastReceiptData.student.first_name} {lastReceiptData.student.last_name||''}</div>
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
              {/* Action buttons */}
              <div style={{display:'flex',gap:10}}>
                <button
                  onClick={()=>{ printFeeReceipt(lastReceiptData.student, lastReceiptData.items, lastReceiptData.mode, lastReceiptData.receiptNo, lastReceiptData.remarks); }}
                  style={{flex:1,padding:'12px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={()=>{ sendWhatsApp(lastReceiptData.student, lastReceiptData.items, lastReceiptData.mode, lastReceiptData.receiptNo); }}
                  style={{flex:1,padding:'12px',background:'#25D366',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
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
