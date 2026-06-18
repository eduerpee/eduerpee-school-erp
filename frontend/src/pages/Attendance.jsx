import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { attendanceAPI, schoolAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';

var SC = {
  present: { label:'Present', short:'P',  bg:'#D1FAE5', c:'#065F46', color:'#10B981' },
  absent:  { label:'Absent',  short:'A',  bg:'#FEE2E2', c:'#991B1B', color:'#EF4444' },
  leave:   { label:'Leave',   short:'L',  bg:'#FEF3C7', c:'#92400E', color:'#F59E0B' },
  late:    { label:'Late',    short:'Lt', bg:'#EDE9FE', c:'#5B21B6', color:'#7C3AED' },
};
var PAGE = 10;

function fmtDate(d) { return d ? String(d).split('T')[0] : '—'; }

function downloadCSV(filename, headers, rows) {
  var lines = [headers].concat(rows).map(function(r) {
    return r.map(function(v) { return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',');
  });
  var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type:'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Attendance() {
  var today = new Date().toISOString().split('T')[0];

  var [allStudents, setAllStudents] = useState([]);
  var [classList,   setClassList]   = useState([]);
  var [isLiveDB,    setIsLiveDB]    = useState(false);
  var [selClass,    setSelClass]    = useState('');
  var [selClassId,  setSelClassId]  = useState('');
  var [selSec,      setSelSec]      = useState('');
  var [date,        setDate]        = useState(today);
  var [localAtt,    setLocalAtt]    = useState({});  // { 'date|studentId': 'present' }
  var [page,        setPage]        = useState(0);
  var [saved,       setSaved]       = useState(false);
  var [saving,      setSaving]      = useState(false);
  var [loadingStudents, setLoadingStudents] = useState(false);

  // ── Load classes from DB ────────────────────────────────
  var loadClasses = useCallback(async function() {
    try {
      var res = await schoolAPI.getClasses();
      var cls = res.data.data || [];
      if (cls.length) { setClassList(cls); setIsLiveDB(true); }
    } catch {}
  }, []);

  // ── Load students for selected class from DB ────────────
  var loadStudents = useCallback(async function(classId, className) {
    if (!classId && !className) {
      // Load all students
      try {
        var res = await studentAPI.getAll({ limit:200 });
        var data = res.data.data || [];
        setAllStudents(data.map(function(s) { return { ...s, student_id:s.id }; }));
        setIsLiveDB(true);
      } catch { setIsLiveDB(false); }
      return;
    }
    setLoadingStudents(true);
    try {
      // Load students for this class with their existing attendance for today
      var res = await attendanceAPI.getClass({ classId: classId || undefined, date: date });
      var data = res.data.data || [];
      setAllStudents(data.map(function(s) { return { ...s, student_id: s.student_id || s.id }; }));
      // Pre-fill existing attendance from DB
      var existing = {};
      data.forEach(function(r) {
        if (r.status) existing[date + '|' + (r.student_id||r.id)] = r.status;
      });
      if (Object.keys(existing).length) {
        setLocalAtt(function(p) { return Object.assign({}, p, existing); });
      }
      setIsLiveDB(true);
    } catch {
      // Fallback: load students via studentAPI
      try {
        var params = {};
        if (className) params.className = className;
        var res2 = await studentAPI.getAll(Object.assign({ limit:200 }, params));
        var data2 = res2.data.data || [];
        setAllStudents(data2.map(function(s) { return { ...s, student_id:s.id }; }));
        setIsLiveDB(true);
      } catch { setIsLiveDB(false); }
    } finally { setLoadingStudents(false); }
  }, [date]);

  useEffect(function() { loadClasses(); loadStudents('', ''); }, [loadClasses]);

  // ── When class or date changes, reload students + attendance ──
  var handleClassChange = useCallback(function(name, id) {
    setSelClass(name);
    setSelClassId(id || '');
    setSelSec('');
    setPage(0);
    setSaved(false);
    loadStudents(id, name);
  }, [loadStudents]);

  var handleDateChange = useCallback(function(newDate) {
    setDate(newDate);
    setSaved(false);
    setPage(0);
    // Reload attendance for new date
    if (selClassId) {
      setLoadingStudents(true);
      attendanceAPI.getClass({ classId: selClassId, date: newDate })
        .then(function(res) {
          var data = res.data.data || [];
          setAllStudents(data.map(function(s) { return { ...s, student_id: s.student_id||s.id }; }));
          var existing = {};
          data.forEach(function(r) {
            if (r.status) existing[newDate + '|' + (r.student_id||r.id)] = r.status;
          });
          setLocalAtt(existing); // reset for new date
        })
        .catch(function() {})
        .finally(function() { setLoadingStudents(false); });
    }
  }, [selClassId]);

  // ── Filter by section ────────────────────────────────────
  var sections = useMemo(function() {
    return Array.from(new Set(
      allStudents.map(function(s) { return s.section_name || s.sec || ''; }).filter(Boolean)
    )).sort();
  }, [allStudents]);

  var filtered = useMemo(function() {
    return allStudents.filter(function(s) {
      return !selSec || (s.section_name||s.sec) === selSec;
    });
  }, [allStudents, selSec]);

  var totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE));
  var pageStudents = filtered.slice(page * PAGE, (page+1) * PAGE);

  function keyOf(id) { return date + '|' + id; }

  function getStatus(id) {
    return localAtt[keyOf(id)] || '';
  }

  function setStatus(id, status) {
    var next = Object.assign({}, localAtt);
    next[keyOf(id)] = status;
    setLocalAtt(next);
    setSaved(false);
  }

  function markAll(status) {
    var next = Object.assign({}, localAtt);
    filtered.forEach(function(s) { next[keyOf(s.student_id||s.id)] = status; });
    setLocalAtt(next);
    setSaved(false);
    toast.success('All ' + filtered.length + ' marked ' + SC[status].label);
  }

  var handleSave = async function() {
    if (!filtered.length) { toast.error('No students loaded. Select a class first.'); return; }
    setSaving(true);

    // Only save students that have been EXPLICITLY marked — do NOT default unmarked to present
    var final = Object.assign({}, localAtt);

    // Build array — only include students with an explicit status
    var attendanceArr = filtered
      .map(function(s) {
        var id = s.student_id || s.id;
        var status = final[keyOf(id)];
        return status ? { studentId: id, status: status } : null;
      })
      .filter(function(r) { return r !== null && r.studentId; });

    if (!attendanceArr.length) {
      toast.error('Please mark at least one student before saving.');
      setSaving(false);
      return;
    }

    try {
      var res = await attendanceAPI.mark({
        date:      date,
        classId:   selClassId || undefined,
        attendance: attendanceArr,
      });
      var msg = res.data?.message || 'Saved!';
      toast.success('✅ ' + msg);
      setSaved(true);
      setIsLiveDB(true);
    } catch (err) {
      var errMsg = err.response?.data?.message || err.message || 'Save failed';
      toast.error('❌ ' + errMsg + ' — check backend logs');
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  function handleDownload() {
    var headers = ['S.No','Adm No','Student Name','Class','Section','Status','Date'];
    var rows = filtered.map(function(s, i) {
      var id   = s.student_id || s.id;
      var name = ((s.first_name||'') + ' ' + (s.last_name||'')).trim();
      return [i+1, s.admission_no||'', name, s.class_name||s.cls||'', s.section_name||s.sec||'', getStatus(id)||'not marked', date];
    });
    downloadCSV('Attendance_' + (selClass||'All') + '_' + date + '.csv', headers, rows);
    toast.success('Downloaded!');
  }

  var summary = useMemo(function() {
    var c = { present:0, absent:0, leave:0, late:0, unmarked:0 };
    filtered.forEach(function(s) {
      var v = getStatus(s.student_id||s.id);
      if (v && c[v] !== undefined) c[v]++; else c.unmarked++;
    });
    return c;
  }, [filtered, localAtt, date]);

  var pct = filtered.length > 0 ? Math.round((summary.present/filtered.length)*100) : 0;
  var inpStyle = { padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' };

  return React.createElement('div', null,
    // Header
    React.createElement('div', { style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:12} },
      React.createElement('div', null,
        React.createElement('h2', { style:{fontSize:20,fontWeight:700,color:'#111827'} }, 'Mark Attendance'),
        React.createElement('p', { style:{fontSize:12,color:'#6B7280',marginTop:2} },
          isLiveDB
            ? React.createElement('span', { style:{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700} }, '🟢 Live DB — saves to PostgreSQL')
            : React.createElement('span', { style:{padding:'2px 8px',background:'#FEF3C7',color:'#92400E',borderRadius:10,fontSize:10,fontWeight:700} }, '⚠️ Backend not connected')
        )
      ),
      React.createElement('div', { style:{display:'flex',gap:10,flexWrap:'wrap'} },
        React.createElement('button', { onClick:function(){markAll('present');}, style:{padding:'8px 14px',border:'1.5px solid #10B981',borderRadius:9,background:'#D1FAE5',color:'#065F46',fontSize:12,fontWeight:700,cursor:'pointer'} }, '✅ All Present'),
        React.createElement('button', { onClick:function(){markAll('absent');},  style:{padding:'8px 14px',border:'1.5px solid #EF4444',borderRadius:9,background:'#FEE2E2',color:'#991B1B',fontSize:12,fontWeight:700,cursor:'pointer'} }, '❌ All Absent'),
        React.createElement('button', { onClick:handleDownload, style:{padding:'8px 14px',border:'1.5px solid #1E40AF',borderRadius:9,background:'#DBEAFE',color:'#1E40AF',fontSize:12,fontWeight:700,cursor:'pointer'} }, '📥 CSV'),
        React.createElement('button', { onClick:handleSave, disabled:saving, style:{padding:'8px 20px',background:saving?'#9CA3AF':'#1E1B4B',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer'} },
          saving ? '⏳ Saving…' : '💾 Save Attendance'
        )
      )
    ),

    // Filters
    React.createElement('div', { style:{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'flex-end'} },
      React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:5} },
        React.createElement('label', { style:{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'} }, 'Date'),
        React.createElement('input', { type:'date', value:date, onChange:function(e){handleDateChange(e.target.value);}, style:inpStyle })
      ),
      React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:5} },
        React.createElement('label', { style:{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'} }, 'Class'),
        React.createElement('select', {
          value: selClass,
          onChange: function(e) {
            var opt = e.target.options[e.target.selectedIndex];
            handleClassChange(e.target.value, opt.getAttribute('data-id'));
          },
          style: Object.assign({},inpStyle,{minWidth:140})
        },
          React.createElement('option', { value:'', 'data-id':'' }, 'All Classes'),
          classList.map(function(c) {
            return React.createElement('option', { key:c.id, value:c.name, 'data-id':c.id }, c.name);
          })
        )
      ),
      sections.length > 0 ? React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:5} },
        React.createElement('label', { style:{fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'} }, 'Section'),
        React.createElement('select', {
          value: selSec,
          onChange: function(e) { setSelSec(e.target.value); setPage(0); },
          style: Object.assign({},inpStyle,{minWidth:100})
        },
          React.createElement('option', { value:'' }, 'All'),
          sections.map(function(s) { return React.createElement('option', { key:s }, s); })
        )
      ) : null,
      React.createElement('div', { style:{alignSelf:'flex-end',padding:'9px 14px',background:'#EDE9F8',borderRadius:9,fontSize:12,fontWeight:700,color:'#1E1B4B'} },
        filtered.length + ' students' + (selClass ? ' · ' + selClass : '')
      ),
      saved ? React.createElement('div', { style:{alignSelf:'flex-end',padding:'9px 14px',background:'#D1FAE5',borderRadius:9,fontSize:12,fontWeight:700,color:'#065F46'} }, '✅ Saved to DB') : null
    ),

    // Main grid
    React.createElement('div', { style:{display:'grid',gridTemplateColumns:'1fr 270px',gap:16} },

      // Mark sheet
      React.createElement('div', { style:{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column'} },
        // Column headers
        React.createElement('div', { style:{display:'grid',gridTemplateColumns:'36px 1fr 88px 88px 88px 88px',padding:'10px 14px',background:'#F9FAFB',borderBottom:'1px solid #E5E7EB',alignItems:'center'} },
          React.createElement('div', { style:{fontSize:10,fontWeight:700,color:'#9CA3AF'} }, '#'),
          React.createElement('div', { style:{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.06em'} }, 'Student'),
          Object.entries(SC).map(function(entry) {
            var k=entry[0],v=entry[1];
            return React.createElement('div', { key:k, style:{textAlign:'center',fontSize:10,fontWeight:700,color:v.c,background:v.bg,padding:'3px 0',borderRadius:6,margin:'0 2px'} }, v.short + ' ' + v.label);
          })
        ),

        // Student rows
        React.createElement('div', { style:{flex:1,minHeight:260} },
          (loadingStudents) ? React.createElement('div', { style:{padding:40,textAlign:'center',color:'#9CA3AF'} }, '⏳ Loading students…') :
          filtered.length === 0
            ? React.createElement('div', { style:{padding:48,textAlign:'center',color:'#9CA3AF'} },
                React.createElement('div', { style:{fontSize:36,marginBottom:10} }, '👨‍🎓'),
                React.createElement('div', { style:{fontWeight:600,color:'#6B7280'} }, 'No students found'),
                React.createElement('div', { style:{fontSize:12,marginTop:4} }, selClass ? 'No students in ' + selClass : 'Select a class above or add students first')
              )
            : pageStudents.map(function(s, idx) {
                var id  = s.student_id || s.id;
                var cur = getStatus(id);
                var nm  = ((s.first_name||'') + ' ' + (s.last_name||'')).trim();
                return React.createElement('div', {
                  key: id,
                  style:{display:'grid',gridTemplateColumns:'36px 1fr 88px 88px 88px 88px',padding:'9px 14px',borderBottom:'0.5px solid #F3F4F6',alignItems:'center',background:idx%2?'#FAFAFA':'#fff'},
                  onMouseEnter:function(e){e.currentTarget.style.background='#F5F3FF';},
                  onMouseLeave:function(e){e.currentTarget.style.background=idx%2?'#FAFAFA':'#fff';}
                },
                  React.createElement('div', { style:{fontSize:11,color:'#9CA3AF',fontWeight:600} }, page*PAGE+idx+1),
                  React.createElement('div', { style:{display:'flex',alignItems:'center',gap:8} },
                    s.photo_url
                      ? React.createElement('img', { src:s.photo_url, alt:'', style:{width:30,height:30,borderRadius:7,objectFit:'cover',flexShrink:0,border:'1px solid #E5E7EB'} })
                      : React.createElement('div', { style:{width:30,height:30,borderRadius:7,background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#1E1B4B',flexShrink:0} }, nm[0]||'?'),
                    React.createElement('div', null,
                      React.createElement('div', { style:{fontSize:12,fontWeight:600,color:'#111827'} }, nm),
                      React.createElement('div', { style:{fontSize:10,color:'#9CA3AF'} }, (s.admission_no||'') + (s.class_name ? ' · '+s.class_name+(s.section_name?'-'+s.section_name:'') : ''))
                    )
                  ),
                  Object.entries(SC).map(function(entry) {
                    var k=entry[0],v=entry[1];
                    var isActive = cur === k;
                    return React.createElement('div', { key:k, style:{display:'flex',alignItems:'center',justifyContent:'center'} },
                      React.createElement('div', {
                        onClick:function() { setStatus(id, k); },
                        style:{cursor:'pointer',width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:isActive?v.bg:'transparent',border:'2px solid '+(isActive?v.color:'#E5E7EB'),transition:'all .15s'}
                      },
                        React.createElement('span', { style:{fontSize:16,color:isActive?v.color:'#D1D5DB',lineHeight:1} }, isActive?'●':'○')
                      )
                    );
                  })
                );
              })
        ),

        // Pagination
        filtered.length > PAGE ? React.createElement('div', { style:{padding:'12px 16px',borderTop:'1px solid #E5E7EB',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F9FAFB',flexShrink:0} },
          React.createElement('span', { style:{fontSize:12,color:'#6B7280'} },
            'Showing ' + (page*PAGE+1) + '–' + Math.min((page+1)*PAGE, filtered.length) + ' of ' + filtered.length
          ),
          React.createElement('div', { style:{display:'flex',gap:6} },
            React.createElement('button', { onClick:function(){setPage(function(p){return Math.max(0,p-1);});}, disabled:page===0, style:{width:34,height:34,border:'1.5px solid #E5E7EB',borderRadius:8,background:page===0?'#F9FAFB':'#fff',color:page===0?'#D1D5DB':'#1E1B4B',cursor:page===0?'not-allowed':'pointer',fontSize:16,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'} }, '←'),
            React.createElement('span', { style:{padding:'6px 12px',background:'#1E1B4B',color:'#fff',borderRadius:8,fontWeight:700,fontSize:12} }, page+1+'/'+totalPages),
            React.createElement('button', { onClick:function(){setPage(function(p){return Math.min(totalPages-1,p+1);});}, disabled:page>=totalPages-1, style:{width:34,height:34,border:'1.5px solid #E5E7EB',borderRadius:8,background:page>=totalPages-1?'#F9FAFB':'#fff',color:page>=totalPages-1?'#D1D5DB':'#1E1B4B',cursor:page>=totalPages-1?'not-allowed':'pointer',fontSize:16,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'} }, '→')
          )
        ) : null
      ),

      // Summary panel
      React.createElement('div', { style:{display:'flex',flexDirection:'column',gap:12} },
        React.createElement('div', { style:{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'} },
          React.createElement('div', { style:{padding:'12px 14px',borderBottom:'0.5px solid #F3F4F6',fontWeight:700,fontSize:13,color:'#111827'} }, '📊 ' + date),
          React.createElement('div', { style:{padding:14} },
            React.createElement('div', { style:{display:'flex',alignItems:'center',gap:12,marginBottom:14} },
              React.createElement('div', { style:{position:'relative',width:72,height:72,flexShrink:0} },
                React.createElement('svg', { width:72,height:72,viewBox:'0 0 36 36',style:{transform:'rotate(-90deg)'} },
                  React.createElement('circle', { cx:18,cy:18,r:15.9,fill:'none',stroke:'#F3F4F6',strokeWidth:3 }),
                  React.createElement('circle', { cx:18,cy:18,r:15.9,fill:'none',stroke:'#10B981',strokeWidth:3,strokeDasharray:pct+' '+(100-pct),strokeLinecap:'round' })
                ),
                React.createElement('div', { style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#1E1B4B'} }, pct+'%')
              ),
              React.createElement('div', null,
                React.createElement('div', { style:{fontSize:16,fontWeight:800} }, summary.present+'/'+filtered.length),
                React.createElement('div', { style:{fontSize:11,color:'#6B7280'} }, 'Present today'),
                summary.unmarked > 0 ? React.createElement('div', { style:{fontSize:10,color:'#F59E0B',fontWeight:600,marginTop:2} }, '⚠️ '+summary.unmarked+' unmarked') : null
              )
            ),
            Object.entries(SC).map(function(entry) {
              var k=entry[0],v=entry[1];
              var cnt = summary[k]||0;
              var p   = filtered.length>0 ? Math.round((cnt/filtered.length)*100) : 0;
              return React.createElement('div', { key:k, style:{marginBottom:8} },
                React.createElement('div', { style:{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3} },
                  React.createElement('span', { style:{fontWeight:600,color:'#374151'} }, v.label),
                  React.createElement('span', { style:{fontWeight:700,color:v.c} }, cnt+' ('+p+'%)')
                ),
                React.createElement('div', { style:{height:6,background:'#F3F4F6',borderRadius:3} },
                  React.createElement('div', { style:{height:'100%',width:p+'%',background:v.color,borderRadius:3,transition:'width .4s'} })
                )
              );
            })
          )
        ),
        React.createElement('div', { style:{background:'#EDE9F8',borderRadius:12,padding:12,fontSize:11,color:'#4C1D95',lineHeight:1.9} },
          React.createElement('strong', { style:{display:'block',marginBottom:4} }, '📋 How to use:'),
          '1. Pick date & class', React.createElement('br'),
          '2. Students load from DB', React.createElement('br'),
          '3. Click ● to mark status', React.createElement('br'),
          '4. Click Save → stores in DB', React.createElement('br'),
          isLiveDB
            ? React.createElement('strong', { style:{color:'#065F46'} }, '✅ Connected to PostgreSQL')
            : React.createElement('span', { style:{color:'#92400E'} }, '⚠️ Start backend first')
        )
      )
    )
  );
}
