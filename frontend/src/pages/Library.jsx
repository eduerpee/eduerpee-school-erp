import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { schoolAPI } from '../services/api';
import toast from 'react-hot-toast';

const libAPI = {
  getBooks:      (p) => api.get('/library/books',  { params: p }),
  addBook:       (d) => api.post('/library/books', d),
  getIssues:     (p) => api.get('/library/issues', { params: p }),
  issueBook:     (d) => api.post('/library/issue', d),
  returnBook:    (id)=> api.put('/library/return/'+id),
  getCategories: ()  => api.get('/library/categories'),
};
const stuAPI = { getAll: () => api.get('/students?limit=500') };

const inp = { width:'100%',padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box' };
const lbl = { display:'block',fontSize:11,fontWeight:700,color:'#4B5563',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6 };
const th  = { padding:'10px 14px',textAlign:'left',background:'#F9FAFB',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase',borderBottom:'1px solid #E5E7EB',whiteSpace:'nowrap' };
const td  = { padding:'10px 14px',borderBottom:'0.5px solid #F3F4F6',fontSize:12 };

export default function Library() {
  const [tab,        setTab]        = useState('books');
  const [books,      setBooks]      = useState([]);
  const [issues,     setIssues]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [classes,    setClasses]    = useState([]);
  const [filterClass,setFilterClass]= useState('');
  const [issueClass, setIssueClass] = useState('');
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('');
  const [showAddBook,setShowAddBook]= useState(false);
  const [showIssue,  setShowIssue]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [bookForm,   setBookForm]   = useState({ title:'',author:'',isbn:'',publisher:'',edition:'',category:'',copies:'1',rack:'',classId:'' });
  const [issueForm,  setIssueForm]  = useState({ studentId:'',dueDate:'' });

  const loadBooks = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [bRes, catRes] = await Promise.all([
        libAPI.getBooks({ search:search||undefined, category:filterCat||undefined }),
        libAPI.getCategories(),
      ]);
      setBooks(bRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      setError('Backend error: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, [search, filterCat]);

  const loadIssues = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await libAPI.getIssues({ limit:100 });
      setIssues(res.data.data || []);
    } catch (err) {
      setError('Backend error: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tab==='books') loadBooks(); else loadIssues(); }, [tab, loadBooks, loadIssues]);

  useEffect(() => {
    schoolAPI.getClasses()
      .then(r => setClasses(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showIssue) stuAPI.getAll().then(r => setStudents(r.data.data||[])).catch(()=>{});
  }, [showIssue]);

  const handleAddBook = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await libAPI.addBook({ title:bookForm.title, author:bookForm.author||undefined, isbn:bookForm.isbn||undefined, publisher:bookForm.publisher||undefined, edition:bookForm.edition||undefined, category:bookForm.category||undefined, totalCopies:parseInt(bookForm.copies)||1, rackNo:bookForm.rack||undefined, classId:bookForm.classId||undefined });
      toast.success('✅ Book added to database!');
      setShowAddBook(false);
      setBookForm({ title:'',author:'',isbn:'',publisher:'',edition:'',category:'',copies:'1',rack:'',classId:'' });
      loadBooks();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleIssue = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await libAPI.issueBook({ bookId:showIssue.id, studentId:issueForm.studentId, dueDate:issueForm.dueDate });
      toast.success('✅ Book issued!');
      setShowIssue(null); setIssueClass(''); setIssueForm({ studentId:'',dueDate:'' }); loadBooks();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  const handleReturn = async (id, title) => {
    if (!window.confirm('Return "'+title+'"?')) return;
    try {
      const res = await libAPI.returnBook(id);
      toast.success('✅ ' + res.data.message); loadIssues(); loadBooks();
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
  };

  const today   = new Date().toISOString().split('T')[0];
  const totalCopies = books.reduce((s,b)=>s+(parseInt(b.total_copies)||0),0);
  const available   = books.reduce((s,b)=>s+(parseInt(b.available_copies)||0),0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Library Management</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
            {books.length} titles · {totalCopies} copies &nbsp;
            <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
          </p>
        </div>
        {tab==='books' && <button onClick={()=>setShowAddBook(true)} style={{padding:'9px 20px',background:'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Book</button>}
      </div>

      {error && <div style={{padding:'12px 16px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,color:'#DC2626',fontSize:13,marginBottom:16}}>❌ {error}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[['Titles',books.length,'#EDE9F8','#1E1B4B'],['Total Copies',totalCopies,'#DBEAFE','#1E40AF'],['Available',available,'#D1FAE5','#065F46'],['Issued',totalCopies-available,'#FEF3C7','#92400E']].map(([l,v,bg,c])=>(
          <div key={l} style={{padding:'14px',background:bg,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:c,marginTop:4,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',borderBottom:'2px solid #E5E7EB',marginBottom:0}}>
        {[['books','📚 Book Catalog'],['issues','📋 Issued Books']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:'10px 20px',border:'none',borderBottom:tab===key?'2px solid #1E1B4B':'2px solid transparent',background:'transparent',color:tab===key?'#1E1B4B':'#6B7280',fontSize:13,fontWeight:tab===key?700:500,cursor:'pointer',marginBottom:-2}}>{label}</button>
        ))}
      </div>

      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:'0 0 14px 14px',overflow:'hidden'}}>
        {loading ? <div style={{padding:40,textAlign:'center',color:'#9CA3AF'}}>⏳ Loading from database…</div> : <>

          {tab==='books' && <>
            <div style={{display:'flex',gap:10,padding:14,borderBottom:'1px solid #F3F4F6',flexWrap:'wrap'}}>
              <input placeholder="🔍 Search title, author, ISBN…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,maxWidth:300,flex:1}}/>
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...inp,width:'auto'}}>
                <option value="">All Categories</option>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
              <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={{...inp,width:'auto'}}>
                <option value="">All Classes</option>
                {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {(search||filterCat||filterClass) && <button onClick={()=>{setSearch('');setFilterCat('');setFilterClass('');}} style={{padding:'9px 14px',border:'1px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:12,color:'#6B7280',cursor:'pointer'}}>Clear ✕</button>}
            </div>
            {books.length===0
              ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:10}}>📚</div><div style={{fontWeight:600,color:'#6B7280'}}>No books yet — click "+ Add Book"</div></div>
              : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['Title','Author','ISBN','Category','Rack','Total','Available','Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>{books.map((b,i)=>(
                    <tr key={b.id} onMouseEnter={e=>e.currentTarget.style.background='#F5F3FF'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{...td,fontWeight:700,color:'#111827'}}>{b.title}</td>
                      <td style={td}>{b.author||'—'}</td>
                      <td style={{...td,fontFamily:'monospace',fontSize:11,color:'#9CA3AF'}}>{b.isbn||'—'}</td>
                      <td style={td}>{b.category?<span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#EDE9F8',color:'#1E1B4B',fontWeight:600}}>{b.category}</span>:'—'}</td>
                      <td style={td}>{b.mapped_class?<span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#D1FAE5',color:'#065F46',fontWeight:600}}>{b.mapped_class}</span>:'All'}</td>
                      <td style={{...td,textAlign:'center'}}>{b.rack_no||'—'}</td>
                      <td style={{...td,textAlign:'center',fontWeight:700}}>{b.total_copies}</td>
                      <td style={{...td,textAlign:'center'}}><span style={{fontWeight:700,color:b.available_copies>0?'#065F46':'#DC2626'}}>{b.available_copies}</span></td>
                      <td style={td}>
                        <button onClick={()=>{setShowIssue(b);setIssueForm({studentId:'',dueDate:''}); }}
                          disabled={b.available_copies<=0}
                          style={{padding:'5px 12px',background:b.available_copies>0?'#1E1B4B':'#F3F4F6',color:b.available_copies>0?'#fff':'#9CA3AF',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:b.available_copies>0?'pointer':'not-allowed'}}>
                          {b.available_copies>0?'Issue':'Unavailable'}
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
            }
          </>}

          {tab==='issues' && (issues.length===0
            ? <div style={{padding:48,textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:10}}>📋</div><div style={{fontWeight:600,color:'#6B7280'}}>No books currently issued</div></div>
            : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr>{['Book','Student','Issue Date','Due Date','Fine','Status','Action'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{issues.map((r,i)=>{
                  const overdue = !r.return_date && r.due_date < today;
                  const fine    = parseFloat(r.calculated_fine||r.fine_amount||0);
                  return <tr key={r.id} style={{background:overdue?'#FFF8F0':''}}>
                    <td style={{...td,fontWeight:700}}>{r.title}</td>
                    <td style={td}>{r.student_name?.trim()||r.admission_no||'—'}</td>
                    <td style={td}>{r.issue_date}</td>
                    <td style={{...td,color:overdue?'#DC2626':'#374151',fontWeight:overdue?700:400}}>{r.due_date}{overdue?' ⚠️':''}</td>
                    <td style={{...td,fontWeight:700,color:fine>0?'#DC2626':'#374151'}}>₹{fine}</td>
                    <td style={td}><span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:r.return_date?'#D1FAE5':overdue?'#FEE2E2':'#FEF3C7',color:r.return_date?'#065F46':overdue?'#991B1B':'#92400E'}}>{r.return_date?'Returned':overdue?'Overdue':'Issued'}</span></td>
                    <td style={td}>{!r.return_date&&<button onClick={()=>handleReturn(r.id,r.title)} style={{padding:'5px 12px',background:'#D1FAE5',color:'#065F46',border:'1px solid #10B981',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>✓ Return</button>}</td>
                  </tr>;
                })}</tbody>
              </table>
          )}
        </>}
      </div>

      {/* Add Book Modal */}
      {showAddBook && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:560,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff'}}>
              <div style={{fontWeight:700,fontSize:15}}>📚 Add New Book</div>
              <button onClick={()=>setShowAddBook(false)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleAddBook} style={{padding:20}}>
              <div style={{marginBottom:12}}><label style={lbl}>Title *</label><input required value={bookForm.title} onChange={e=>setBookForm({...bookForm,title:e.target.value})} placeholder="Book title" style={inp} autoFocus/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Author</label><input value={bookForm.author} onChange={e=>setBookForm({...bookForm,author:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>ISBN</label><input value={bookForm.isbn} onChange={e=>setBookForm({...bookForm,isbn:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Publisher</label><input value={bookForm.publisher} onChange={e=>setBookForm({...bookForm,publisher:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Edition</label><input value={bookForm.edition} onChange={e=>setBookForm({...bookForm,edition:e.target.value})} placeholder="e.g. 2024" style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
                <div><label style={lbl}>Category</label>
                  <input value={bookForm.category} onChange={e=>setBookForm({...bookForm,category:e.target.value})} placeholder="e.g. Textbook" list="cat-list" style={inp}/>
                  <datalist id="cat-list">{categories.map(c=><option key={c} value={c}/>)}</datalist>
                </div>
                <div><label style={lbl}>Total Copies</label><input type="number" min="1" value={bookForm.copies} onChange={e=>setBookForm({...bookForm,copies:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>Rack No.</label><input value={bookForm.rack} onChange={e=>setBookForm({...bookForm,rack:e.target.value})} placeholder="e.g. A1" style={inp}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>Map to Class (optional)</label>
                <select value={bookForm.classId} onChange={e=>setBookForm({...bookForm,classId:e.target.value})} style={inp}>
                  <option value="">All Classes (General)</option>
                  {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div style={{fontSize:10,color:'#9CA3AF',marginTop:3}}>Book will appear for selected class and all classes</div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowAddBook(false)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>{saving?'⏳ Saving…':'💾 Add Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssue && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:18,width:460,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E5E7EB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:15}}>📤 Issue Book</div>
              <button onClick={()=>setShowIssue(null)} style={{background:'#F3F4F6',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <form onSubmit={handleIssue} style={{padding:20}}>
              <div style={{padding:12,background:'#EDE9F8',borderRadius:10,marginBottom:16}}>
                <div style={{fontWeight:700,color:'#1E1B4B'}}>{showIssue.title}</div>
                <div style={{fontSize:11,color:'#6B7280',marginTop:2}}>by {showIssue.author||'—'} · {showIssue.available_copies} copies available</div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={lbl}>Filter by Class</label>
                <select value={issueClass} onChange={e=>setIssueClass(e.target.value)} style={inp}>
                  <option value="">All Classes</option>
                  {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{marginBottom:12}}><label style={lbl}>Select Student *</label>
                <select required value={issueForm.studentId} onChange={e=>setIssueForm({...issueForm,studentId:e.target.value})} style={inp}>
                  <option value="">Select Student</option>
                  {students.filter(s=>!issueClass||s.current_class_id===issueClass||s.class_id===issueClass).map(s=>(
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name||''} ({s.admission_no}) — {s.class_name||''}</option>
                  ))}
                </select>
              </div>
              <div style={{marginBottom:16}}><label style={lbl}>Due Date *</label>
                <input required type="date" min={today} value={issueForm.dueDate} onChange={e=>setIssueForm({...issueForm,dueDate:e.target.value})} style={inp}/>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setShowIssue(null)} style={{padding:'10px 16px',border:'1.5px solid #E5E7EB',borderRadius:9,background:'#fff',fontSize:13,cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'10px 22px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>{saving?'⏳ Saving…':'📤 Issue Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
