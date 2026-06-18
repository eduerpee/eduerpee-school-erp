import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Reports() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data.data?.stats||{})).catch(()=>{});
  }, []);

  const REPORTS = [
    { icon:'💰', title:'Fee Collection Report', desc:'Daily, monthly & class-wise fee collections', color:'#EDE9F8', tc:'#4C1D95', link:'/fees?tab=report', stat: '₹'+(parseFloat(stats.todayCollection||0)).toLocaleString('en-IN')+' today' },
    { icon:'⏳', title:'Pending Fees Report',   desc:'Outstanding dues class-wise & student-wise', color:'#FEE2E2', tc:'#991B1B', link:'/fees?tab=pending', stat: 'View pending dues' },
    { icon:'✅', title:'Attendance Report',      desc:'Class-wise daily & monthly attendance',      color:'#D1FAE5', tc:'#065F46', link:'/attendance-report', stat: (stats.todayAttendancePercent||0)+'% today' },
    { icon:'📝', title:'Exam Results',           desc:'Class-wise marks, grades & report cards',   color:'#DBEAFE', tc:'#1E40AF', link:'/exams', stat: 'View results' },
    { icon:'👨‍🎓', title:'Student Report',        desc:'Total admissions, class-wise & category',   color:'#FCE7F3', tc:'#9D174D', link:'/students', stat: (stats.total_students||0)+' students' },
    { icon:'👥', title:'Staff Report',           desc:'Employee list, designation & salary summary',color:'#FEF3C7', tc:'#92400E', link:'/employees', stat: (stats.total_employees||0)+' employees' },
    { icon:'🚌', title:'Transport Report',       desc:'Route-wise students & vehicle details',      color:'#D1FAE5', tc:'#065F46', link:'/transport', stat: 'View routes' },
    { icon:'📚', title:'Library Report',         desc:'Books issued, overdue & fine collection',    color:'#EDE9F8', tc:'#5B21B6', link:'/library', stat: 'View issues' },
    { icon:'💸', title:'Expense Report',         desc:'Category-wise monthly expense summary',      color:'#FEE2E2', tc:'#DC2626', link:'/expenses', stat: 'View expenses' },
  ];

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>Reports & Analytics</h2>
        <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>
          Click any report to view live data &nbsp;
          <span style={{padding:'2px 8px',background:'#D1FAE5',color:'#065F46',borderRadius:10,fontSize:10,fontWeight:700}}>🟢 Live DB</span>
        </p>
      </div>

      {/* Quick stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {[
          { label:'Total Students',    value: stats.total_students||0,              icon:'👨‍🎓', bg:'#EDE9F8', c:'#4C1D95' },
          { label:'Today Attendance',  value: (stats.todayAttendancePercent||0)+'%',icon:'✅',   bg:'#D1FAE5', c:'#065F46' },
          { label:"Today's Collection",value: '₹'+(parseFloat(stats.todayCollection||0)).toLocaleString('en-IN'), icon:'💰', bg:'#FEF3C7', c:'#92400E' },
          { label:'Total Employees',   value: stats.total_employees||0,             icon:'👥',   bg:'#DBEAFE', c:'#1E40AF' },
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.value}</div>
            <div style={{fontSize:11,color:s.c,opacity:.8,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        {REPORTS.map(r=>(
          <div key={r.title} onClick={()=>navigate(r.link)}
            style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:20,cursor:'pointer',transition:'all .18s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)';e.currentTarget.style.borderColor='#C4B5FD';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='#E5E7EB';}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
              <div style={{width:46,height:46,borderRadius:12,background:r.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                {r.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:'#111827',marginBottom:4}}>{r.title}</div>
                <div style={{fontSize:12,color:'#6B7280',lineHeight:1.4,marginBottom:8}}>{r.desc}</div>
                <div style={{padding:'3px 10px',background:r.color,color:r.tc,borderRadius:20,fontSize:11,fontWeight:700,display:'inline-block'}}>{r.stat}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:20,padding:'12px 16px',background:'#F9FAFB',borderRadius:10,fontSize:12,color:'#6B7280',textAlign:'center'}}>
        💡 All reports show live data from database. Click any report card to view detailed information.
      </div>
    </div>
  );
}
