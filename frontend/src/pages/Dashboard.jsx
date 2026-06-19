import React from 'react';
import { useResponsive } from '../utils/responsive';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const user     = useSelector(s => s.auth.user);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const cols = isMobile ? 1 : isTablet ? 2 : 4;

  const { data: apiData, isError, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardAPI.get().then(r => r.data.data),
    retry: 1,
    staleTime: 60000,
  });

  const stats          = apiData?.stats          || {};
  const notices        = apiData?.notices        || [];
  const recentAdmissions = apiData?.recentAdmissions || [];
  const monthlyCollection= apiData?.monthlyCollection|| [];
  const classWiseFees  = apiData?.classWiseFees  || [];
  const pendingFees    = apiData?.pendingFees     || {};

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fmt = (n) => Number(n||0).toLocaleString('en-IN');
  const fmtK= (n) => {
    const v = parseFloat(n||0);
    if (v>=100000) return '₹'+(v/100000).toFixed(1)+'L';
    if (v>=1000)   return '₹'+(v/1000).toFixed(1)+'K';
    return '₹'+v;
  };

  const CARDS = [
    { label:'Total Students',     value: fmt(stats.total_students),              icon:'🎓', c:'#7C3AED', bg:'#EDE9FE', path:'/students'   },
    { label:'Total Employees',    value: fmt(stats.total_employees),             icon:'👥', c:'#059669', bg:'#D1FAE5', path:'/employees'  },
    { label:"Today's Attendance", value: (stats.todayAttendancePercent||0)+'%',  icon:'✅', c:'#D97706', bg:'#FEF3C7', path:'/attendance' },
    { label:"Today's Collection", value: fmtK(stats.todayCollection),            icon:'💰', c:'#DC2626', bg:'#FEE2E2', path:'/fees'       },
  ];

  // Bar chart from real monthly collection data
  const maxBar = Math.max(...monthlyCollection.map(m=>parseFloat(m.total_collected)||0), 1);
  const barW   = 44;
  const chartW = Math.max(monthlyCollection.length * 64 + 40, 440);

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'#111827'}}>
            {greeting}, {user?.fullName?.split(' ')[0]||user?.full_name?.split(' ')[0]||'Admin'} 👋
          </h1>
          <p style={{fontSize:12,color:'#6B7280',marginTop:4}}>
            {isLoading ? '⏳ Loading…' : isError ? '🔴 Connection error' : '🟢 Live data'}
            {' '}· Academic Year 2025–26 · {new Date().toDateString()}
          </p>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:14,marginBottom:14}}>
        {CARDS.map(c=>(
          <div key={c.label} onClick={()=>navigate(c.path)}
            style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:18,cursor:'pointer',transition:'all .18s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
            <div style={{width:40,height:40,borderRadius:10,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:12}}>{c.icon}</div>
            <div style={{fontSize:26,fontWeight:800,color:c.c,lineHeight:1,marginBottom:4}}>{isLoading?'…':c.value}</div>
            <div style={{fontSize:12,color:'#6B7280'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Stat Cards Row 2 */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:14,marginBottom:20}}>
        {[
          { label:'New Admissions',  value: fmt(recentAdmissions.length),                    icon:'📋', sub: recentAdmissions.length>0?'Last 30 days':'No recent', c:'#1E1B4B' },
          { label:'Open Enquiries',  value: fmt(stats.open_enquiries),                        icon:'📞', sub:'Awaiting followup',                                  c:'#0891B2' },
          { label:'Pending Dues',    value: fmtK(pendingFees.total_pending),                  icon:'⏳', sub:(fmt(pendingFees.students_with_dues)||'0')+' students', c:'#D97706' },
          { label:'Total Classes',   value: fmt(stats.total_classes),                         icon:'🏫', sub:'Active classes',                                     c:'#059669' },
        ].map(c=>(
          <div key={c.label} style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:18}}>
            <div style={{fontSize:22,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:24,fontWeight:800,color:c.c,lineHeight:1,marginBottom:4}}>{isLoading?'…':c.value}</div>
            <div style={{fontSize:12,color:'#6B7280'}}>{c.label}</div>
            <div style={{fontSize:11,color:'#10B981',marginTop:4,fontWeight:600}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Notices */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
        {/* Fee Collection Chart */}
        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14}}>
          <div style={{padding:'14px 18px',borderBottom:'0.5px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:700}}>📊 Monthly Fee Collection</span>
            <span style={{fontSize:11,color:'#9CA3AF'}}>Last {monthlyCollection.length||0} months</span>
          </div>
          <div style={{padding:'16px 20px',overflowX:'auto'}}>
            {monthlyCollection.length===0
              ? <div style={{textAlign:'center',color:'#9CA3AF',padding:'24px 0',fontSize:13}}>No fee collection data yet</div>
              : <svg width="100%" viewBox={`0 0 ${chartW} 160`} style={{overflow:'visible',minWidth:300}}>
                  {[0,25,50,75,100].map((p,i)=>(
                    <g key={p}>
                      <line x1="38" y1={10+i*28} x2={chartW} y2={10+i*28} stroke="#F3F4F6" strokeWidth="1"/>
                      <text x="0" y={14+i*28} fontSize="8" fill="#9CA3AF">{fmtK((maxBar*(100-p)/100))}</text>
                    </g>
                  ))}
                  {monthlyCollection.map((m,i)=>{
                    const h = Math.round((parseFloat(m.total_collected)/maxBar)*110);
                    const x = 44 + i*64;
                    const y = 120 - h;
                    return (
                      <g key={m.month_key}>
                        <rect x={x} y={y} width={barW} height={h} rx="4" fill="#1E1B4B" opacity=".85"/>
                        <text x={x+barW/2} y={138} fontSize="8" fill="#9CA3AF" textAnchor="middle">{m.month}</text>
                        <text x={x+barW/2} y={y-4} fontSize="8" fill="#1E1B4B" textAnchor="middle" fontWeight="700">{fmtK(m.total_collected)}</text>
                      </g>
                    );
                  })}
                </svg>
            }
          </div>
        </div>

        {/* Notices */}
        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14}}>
          <div style={{padding:'14px 16px',borderBottom:'0.5px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:700}}>📢 Notices</span>
            <button onClick={()=>navigate('/notices')} style={{fontSize:11,color:'#7C3AED',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View all →</button>
          </div>
          <div style={{padding:'8px 16px'}}>
            {notices.length===0
              ? <div style={{padding:'20px 0',textAlign:'center',color:'#9CA3AF',fontSize:12}}>No notices published</div>
              : notices.map((n,i)=>(
                  <div key={n.id||i} style={{padding:'9px 0',borderBottom:'0.5px solid #F9FAFB',display:'flex',gap:10}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#7C3AED',flexShrink:0,marginTop:5}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,lineHeight:1.4}}>{n.title}</div>
                      <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>{n.posted_by} · {new Date(n.publish_date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Recent Admissions + Quick Actions */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'0.5px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:700}}>🆕 Recent Admissions</span>
            <button onClick={()=>navigate('/students')} style={{fontSize:11,color:'#7C3AED',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>View all →</button>
          </div>
          {recentAdmissions.length===0
            ? <div style={{padding:'24px',textAlign:'center',color:'#9CA3AF',fontSize:12}}>No new admissions in last 30 days</div>
            : <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F9FAFB'}}>
                  {['Student','Class','Date','Status'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',color:'#6B7280',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {recentAdmissions.map(s=>(
                    <tr key={s.id} style={{borderBottom:'0.5px solid #F3F4F6'}}>
                      <td style={{padding:'9px 12px',fontWeight:600}}>{s.first_name} {s.last_name}</td>
                      <td style={{padding:'9px 12px',color:'#6B7280'}}>{s.class_name} {s.section_name}</td>
                      <td style={{padding:'9px 12px',color:'#9CA3AF',fontSize:11}}>{new Date(s.admission_date).toLocaleDateString('en-IN')}</td>
                      <td style={{padding:'9px 12px'}}><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,background:'#D1FAE5',color:'#065F46'}}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14}}>
          <div style={{padding:'12px 16px',borderBottom:'0.5px solid #F3F4F6'}}>
            <span style={{fontSize:13,fontWeight:700}}>⚡ Quick Actions</span>
          </div>
          <div style={{padding:16,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:10}}>
            {[['📋','New Admission','/students'],['💰','Collect Fee','/fees'],['✅','Attendance','/attendance'],['📢','Notice','/notices'],
              ['👤','Add Staff','/employees'],['📊','Reports','/reports'],['🚌','Transport','/transport'],['📚','Library','/library']].map(([icon,label,path])=>(
              <div key={label} onClick={()=>navigate(path)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'12px 4px',background:'#F9FAFB',border:'0.5px solid #E5E7EB',borderRadius:12,cursor:'pointer',transition:'all .15s',textAlign:'center'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#EDE9F8';e.currentTarget.style.borderColor='#A78BFA';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.borderColor='#E5E7EB';}}>
                <span style={{fontSize:22}}>{icon}</span>
                <span style={{fontSize:10,fontWeight:600,color:'#4B5563',lineHeight:1.3}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class-wise Fee Collection */}
      <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14}}>
        <div style={{padding:'12px 18px',borderBottom:'0.5px solid #F3F4F6',display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:13,fontWeight:700}}>📊 Class-wise Fee Collection</span>
          <button onClick={()=>navigate('/fees')} style={{fontSize:11,color:'#7C3AED',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Full report →</button>
        </div>
        <div style={{padding:'16px 20px'}}>
          {classWiseFees.length===0
            ? <div style={{textAlign:'center',color:'#9CA3AF',fontSize:12,padding:'16px 0'}}>No fee data yet</div>
            : classWiseFees.map(c=>{
                const total     = parseFloat(c.collected||0) + parseFloat(c.pending||0);
                const pct       = total>0 ? Math.round((parseFloat(c.collected||0)/total)*100) : 0;
                return (
                  <div key={c.class_name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <span style={{fontSize:11,color:'#6B7280',width:80,flexShrink:0}}>{c.class_name}</span>
                    <div style={{flex:1,height:16,background:'#F3F4F6',borderRadius:8,overflow:'hidden',position:'relative'}}>
                      <div style={{width:pct+'%',height:'100%',background:'#1E1B4B',borderRadius:'8px 0 0 8px',minWidth:pct>0?4:0}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:'#1E1B4B',width:36,textAlign:'right'}}>{pct}%</span>
                    <span style={{fontSize:10,color:'#6B7280',width:80,flexShrink:0}}>₹{fmt(c.collected)} / ₹{fmt(total)}</span>
                  </div>
                );
              })
          }
          <div style={{display:'flex',gap:16,marginTop:10,fontSize:11,color:'#6B7280'}}>
            <span><span style={{display:'inline-block',width:10,height:10,background:'#1E1B4B',borderRadius:2,marginRight:4}}/>Collected</span>
            <span><span style={{display:'inline-block',width:10,height:10,background:'#F3F4F6',borderRadius:2,marginRight:4,border:'1px solid #E5E7EB'}}/>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
