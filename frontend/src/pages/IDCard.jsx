import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { studentAPI, schoolAPI } from '../services/api';
import toast from 'react-hot-toast';

const THEMES = {
  indigo:  { name:'Deep Indigo',  p1:'#1E1B4B', p2:'#3730A3', acc:'#818CF8', bg:'#EEF2FF' },
  emerald: { name:'Emerald',      p1:'#064E3B', p2:'#047857', acc:'#34D399', bg:'#ECFDF5' },
  crimson: { name:'Crimson',      p1:'#7F1D1D', p2:'#991B1B', acc:'#FCA5A5', bg:'#FEF2F2' },
  violet:  { name:'Violet',       p1:'#4C1D95', p2:'#6D28D9', acc:'#C4B5FD', bg:'#F5F3FF' },
  teal:    { name:'Ocean Teal',   p1:'#134E4A', p2:'#0F766E', acc:'#5EEAD4', bg:'#F0FDFA' },
  slate:   { name:'Slate Pro',    p1:'#0F172A', p2:'#1E293B', acc:'#94A3B8', bg:'#F8FAFC' },
};

const fmt = d => d ? String(d).split('T')[0] : '—';

// ── LOGO COMPONENT ────────────────────────────────────────────
function Logo({ sch, size, dark }) {
  const logoUrl = sch?.logo_url || sch?.logo;
  if (logoUrl) return (
    <img src={logoUrl} alt="logo"
      style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', maxWidth:size, maxHeight:size }}
      onError={e => { e.target.replaceWith(fallbackLogo(size, dark)); }}
    />
  );
  // Fallback SVG
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="5" fill={dark ? 'rgba(255,255,255,.18)' : '#E5E7EB'}/>
      <path d="M6 22L12 10L18 18L22 14L26 22H6Z" fill={dark ? 'rgba(255,255,255,.5)' : '#9CA3AF'}/>
      <circle cx="22" cy="11" r="3" fill={dark ? 'rgba(255,255,255,.5)' : '#9CA3AF'}/>
    </svg>
  );
}

function fallbackLogo(size, dark) {
  const el = document.createElementNS('http://www.w3.org/2000/svg','svg');
  el.setAttribute('width', size); el.setAttribute('height', size); el.setAttribute('viewBox','0 0 32 32');
  el.innerHTML = `<rect width="32" height="32" rx="5" fill="${dark?'rgba(255,255,255,.18)':'#E5E7EB'}"/><path d="M6 22L12 10L18 18L22 14L26 22H6Z" fill="${dark?'rgba(255,255,255,.5)':'#9CA3AF'}"/>`;
  return el;
}

// ── PHOTO COMPONENT ───────────────────────────────────────────
function Photo({ stu, w, h, radius, border, bg }) {
  const ini = ((stu?.first_name||'')[0]||'').toUpperCase() + ((stu?.last_name||'')[0]||'').toUpperCase();
  const isLight = bg && (bg.includes('EEF')||bg.includes('ECF')||bg.includes('F5F')||bg.includes('F0F')||bg.includes('F8F')||bg.includes('#F')||bg.includes('fff'));
  return (
    <div style={{ width:w, height:h, borderRadius:radius, overflow:'hidden',
      border:border||'none', background:bg||'rgba(255,255,255,.1)',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {stu?.photo_url
        ? <img src={stu.photo_url} alt="photo" style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e => { e.target.style.display='none'; }}/>
        : <span style={{ fontSize:Math.floor(w*.38), fontWeight:800, fontFamily:'Arial,sans-serif', userSelect:'none',
            color: isLight ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.3)' }}>
            {ini||'?'}
          </span>
      }
    </div>
  );
}

function Barcode({ light }) {
  const col = light ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.35)';
  return (
    <div style={{ display:'flex', gap:1.5, alignItems:'flex-end' }}>
      {[3,1,4,1,3,2,1,3,2,1,4,1].map((h,i)=>(
        <div key={i} style={{ width:2, height:h*4, background:col, borderRadius:1 }}/>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HORIZONTAL FRONT CARDS
// ════════════════════════════════════════════════════════════

function H1Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', display:'flex',
      background:'#fff', border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0 }}>
      <div style={{ width:96, background:t.p1, display:'flex', flexDirection:'column',
        alignItems:'center', padding:'12px 0 10px', gap:9, flexShrink:0 }}>
        <div style={{ width:42, height:42, borderRadius:8, background:'rgba(255,255,255,.12)',
          border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center',
          justifyContent:'center', overflow:'hidden' }}>
          <Logo sch={sch} size={34} dark/>
        </div>
        <Photo stu={stu} w={68} h={74} radius={10} border="2.5px solid rgba(255,255,255,.3)" bg="rgba(255,255,255,.08)"/>
        <Barcode/>
      </div>
      <div style={{ flex:1, padding:'11px 13px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:7, fontWeight:700, color:t.p2, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:1 }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
          <div style={{ fontSize:6, color:'#9CA3AF', marginBottom:6 }}>Student Identity Card</div>
          <div style={{ fontSize:15, fontWeight:800, color:'#111827', lineHeight:1.2, marginBottom:8 }}>{name}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:4, columnGap:8 }}>
            {[['Class',stu?.class_name||'—'],['Section',stu?.section_name||'—'],['Adm No.',stu?.admission_no||'—'],['Roll No.',stu?.roll_no||'—'],['D.O.B.',fmt(stu?.date_of_birth)],['Blood',stu?.blood_group||'—']].map(([k,v])=>(
              <div key={k}>
                <div style={{ fontSize:7, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', lineHeight:1 }}>{k}</div>
                <div style={{ fontSize:9.5, fontWeight:700, color:'#111827' }}>{v}</div>
              </div>
            ))}
          </div>
          {stu?.parent_name && <div style={{ fontSize:8, color:'#6B7280', marginTop:5 }}>Parent: <strong style={{ color:'#374151' }}>{stu.parent_name}</strong>{stu?.parent_phone && <span> · {stu.parent_phone}</span>}</div>}
        </div>
        <div style={{ borderTop:`1.5px solid ${t.bg}`, paddingTop:5, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div style={{ fontSize:6.5, color:'#9CA3AF' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:52, borderBottom:`1px solid ${t.p1}`, marginBottom:2 }}/>
            <div style={{ fontSize:7, color:t.p1, fontWeight:700 }}>PRINCIPAL</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── H1 BACK ───────────────────────────────────────────────────
function H1Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', background:t.p1,
      border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16, gap:8 }}>
        <div style={{ width:54, height:54, borderRadius:10, background:'rgba(255,255,255,.12)',
          border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          <Logo sch={sch} size={44} dark/>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#fff', letterSpacing:'.03em' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.55)', marginTop:2 }}>{sch?.address_line1||sch?.address||''}{sch?.city ? ', '+sch.city : ''}</div>
          {(sch?.phone||sch?.contact_phone||sch?.contact_number) && <div style={{ fontSize:8, color:'rgba(255,255,255,.55)', marginTop:1 }}>📞 {sch?.phone||sch?.contact_phone||sch?.contact_number}</div>}
          {sch?.email && <div style={{ fontSize:8, color:'rgba(255,255,255,.55)', marginTop:1 }}>✉ {sch.email}</div>}
        </div>
        <div style={{ width:'80%', height:1, background:'rgba(255,255,255,.15)' }}/>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', lineHeight:1.6 }}>
            If found, please return to the school.<br/>
            Finder will be rewarded. Loss to be reported immediately.
          </div>
        </div>
        <div style={{ padding:'6px 18px', background:'rgba(255,255,255,.1)', borderRadius:8, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:9, color:t.acc, fontWeight:700, textAlign:'center' }}>Emergency Contact: {stu?.parent_phone||'—'}</div>
        </div>
      </div>
      <div style={{ background:'rgba(0,0,0,.2)', padding:'5px 14px', display:'flex', justifyContent:'space-between' }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.3)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
      </div>
    </div>
  );
}

// ── H2 FRONT/BACK ─────────────────────────────────────────────
function H2Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', background:'#fff',
      border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ height:62, background:t.p1, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:38, height:38, borderRadius:7, background:'rgba(255,255,255,.12)',
            border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <Logo sch={sch} size={30} dark/>
          </div>
          <div>
            <div style={{ fontSize:10.5, fontWeight:800, color:'#fff' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
            <div style={{ fontSize:6.5, color:'rgba(255,255,255,.55)', marginTop:1 }}>STUDENT IDENTITY CARD</div>
          </div>
        </div>
        <Photo stu={stu} w={52} h={60} radius={8} border="2px solid rgba(255,255,255,.25)" bg="rgba(255,255,255,.08)"/>
      </div>
      <div style={{ flex:1, padding:'10px 14px 6px' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#111827', marginBottom:5 }}>{name}</div>
        <div style={{ display:'flex', gap:5, marginBottom:7, flexWrap:'wrap' }}>
          {[stu?.class_name, stu?.section_name?'Sec '+stu.section_name:null, stu?.admission_no].filter(Boolean).map((v,i)=>(
            <span key={i} style={{ padding:'2px 9px', background:t.bg, color:t.p1, borderRadius:20, fontSize:8.5, fontWeight:700, border:`1px solid ${t.acc}` }}>{v}</span>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4px 6px', marginBottom:6 }}>
          {[['Roll',stu?.roll_no||'—'],['D.O.B',fmt(stu?.date_of_birth).slice(5)||'—'],['Blood',stu?.blood_group||'—'],['Gender',stu?.gender||'—']].map(([k,v])=>(
            <div key={k} style={{ background:'#F9FAFB', borderRadius:6, padding:'3px 6px' }}>
              <div style={{ fontSize:6.5, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' }}>{k}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#111827' }}>{v}</div>
            </div>
          ))}
        </div>
        {stu?.parent_name && <div style={{ fontSize:8, color:'#6B7280' }}>Parent: <strong style={{ color:'#374151' }}>{stu.parent_name}</strong>{stu?.parent_phone && <span> · {stu.parent_phone}</span>}</div>}
      </div>
      <div style={{ background:t.bg, padding:'5px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontSize:6.5, color:t.p1, fontWeight:600 }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
        <div style={{ fontSize:6.5, color:t.p1, fontWeight:700 }}>AUTHORIZED SIGNATORY</div>
      </div>
    </div>
  );
}

function H2Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', background:t.bg,
      border:`1.5px solid ${t.acc}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ background:t.p1, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:5, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          <Logo sch={sch} size={22} dark/>
        </div>
        <div style={{ fontSize:9, fontWeight:700, color:'#fff' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
        <div style={{ marginLeft:'auto', fontSize:7, color:'rgba(255,255,255,.5)' }}>BACK SIDE</div>
      </div>
      <div style={{ flex:1, padding:'10px 14px', display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {[['Student Name',((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'—'],['Adm. No.',stu?.admission_no||'—'],['Address',sch?.address||'—'],['City',sch?.city||'—']].map(([k,v])=>(
            <div key={k} style={{ background:'rgba(255,255,255,.6)', borderRadius:7, padding:'5px 8px' }}>
              <div style={{ fontSize:7, color:t.p2, fontWeight:700, textTransform:'uppercase' }}>{k}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'8px 12px', background:'rgba(255,255,255,.7)', borderRadius:8, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:8, color:t.p1, fontWeight:700, marginBottom:3 }}>Emergency Contact</div>
          <div style={{ fontSize:11, fontWeight:800, color:t.p1 }}>{stu?.parent_name||'—'}</div>
          <div style={{ fontSize:10, fontWeight:700, color:t.p2 }}>{stu?.parent_phone||'—'}</div>
        </div>
        <div style={{ fontSize:8, color:'#6B7280', textAlign:'center' }}>If found please contact school: {sch?.phone||sch?.contact_phone||sch?.contact_number||'—'}</div>
      </div>
      <div style={{ background:t.p1, padding:'5px 14px', display:'flex', justifyContent:'space-between' }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.4)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
      </div>
    </div>
  );
}

// ── H3 FRONT/BACK ─────────────────────────────────────────────
function H3Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', background:t.p1,
      border:`1px solid ${t.p2}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, padding:'12px 14px', display:'flex', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:30, height:30, borderRadius:6, background:'rgba(255,255,255,.1)',
              border:'1.5px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              <Logo sch={sch} size={24} dark/>
            </div>
            <div>
              <div style={{ fontSize:9.5, fontWeight:800, color:'rgba(255,255,255,.9)' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
              <div style={{ fontSize:6, color:'rgba(255,255,255,.4)' }}>STUDENT ID CARD</div>
            </div>
          </div>
          <div style={{ fontSize:16, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:6 }}>{name}</div>
          <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap' }}>
            {[stu?.class_name, stu?.section_name?'Sec '+stu.section_name:null].filter(Boolean).map((v,i)=>(
              <span key={i} style={{ padding:'2px 9px', background:t.acc, color:t.p1, borderRadius:6, fontSize:8.5, fontWeight:800 }}>{v}</span>
            ))}
            <span style={{ padding:'2px 9px', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.75)', borderRadius:6, fontSize:8.5 }}>{stu?.admission_no||'—'}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
            {[['Roll',stu?.roll_no||'—'],['Blood',stu?.blood_group||'—'],['DOB',fmt(stu?.date_of_birth).slice(2)||'—']].map(([k,v])=>(
              <div key={k} style={{ background:'rgba(255,255,255,.08)', borderRadius:6, padding:'4px 7px' }}>
                <div style={{ fontSize:6, color:'rgba(255,255,255,.4)', textTransform:'uppercase', fontWeight:700 }}>{k}</div>
                <div style={{ fontSize:9.5, color:'#fff', fontWeight:700 }}>{v}</div>
              </div>
            ))}
          </div>
          {stu?.parent_name && <div style={{ fontSize:7.5, color:'rgba(255,255,255,.45)', marginTop:6 }}>Parent: <span style={{ color:'rgba(255,255,255,.65)' }}>{stu.parent_name}</span>{stu?.parent_phone && <span> · {stu.parent_phone}</span>}</div>}
        </div>
        <div style={{ flexShrink:0, display:'flex', alignItems:'flex-start' }}>
          <Photo stu={stu} w={68} h={76} radius={11} border={`2.5px solid ${t.acc}`} bg="rgba(255,255,255,.07)"/>
        </div>
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', padding:'5px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.3)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1} · PRINCIPAL</div>
      </div>
    </div>
  );
}

function H3Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:340, height:214, borderRadius:16, overflow:'hidden', background:'#fff',
      border:`1px solid ${t.p2}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, position:'relative', display:'flex', flexDirection:'column' }}>
      <div style={{ height:10, background:t.p1, flexShrink:0 }}/>
      <div style={{ flex:1, padding:'10px 14px', display:'flex', flexDirection:'column', gap:8, overflowY:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:7, background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', border:`1.5px solid ${t.acc}`, flexShrink:0 }}>
            <Logo sch={sch} size={28} dark={false}/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:t.p1 }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
            <div style={{ fontSize:7.5, color:'#6B7280' }}>{sch?.address_line1||sch?.address||''}{sch?.city?', '+sch.city:''}</div>
          </div>
        </div>
        <div style={{ height:1, background:'#F3F4F6' }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {[['Student',((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'—'],['Adm. No.',stu?.admission_no||'—'],['Parent',stu?.parent_name||'—'],['Contact',stu?.parent_phone||'—']].map(([k,v])=>(
            <div key={k}><div style={{ fontSize:7, color:'#9CA3AF', fontWeight:700 }}>{k}</div><div style={{ fontSize:9, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div></div>
          ))}
        </div>
        <div style={{ padding:'6px 10px', background:t.bg, borderRadius:7, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:8, color:t.p1, textAlign:'center' }}>If found, return to school · Ph: {sch?.phone||sch?.contact_phone||sch?.contact_number||'—'}</div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:10, background:t.p1 }}/>
    </div>
  );
}

// ── VERTICAL FRONT/BACK ───────────────────────────────────────
function V1Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:'#fff',
      border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ background:t.p1, padding:'10px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:6, background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          <Logo sch={sch} size={24} dark/>
        </div>
        <div>
          <div style={{ fontSize:9.5, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
          <div style={{ fontSize:6, color:'rgba(255,255,255,.5)' }}>STUDENT IDENTITY CARD</div>
        </div>
      </div>
      <div style={{ padding:'12px 0 6px', display:'flex', justifyContent:'center' }}>
        <Photo stu={stu} w={76} h={84} radius={12} border={`3px solid ${t.p1}`} bg={t.bg}/>
      </div>
      <div style={{ textAlign:'center', padding:'0 10px 8px' }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{name}</div>
        <div style={{ fontSize:9, color:t.p1, fontWeight:700, marginTop:3 }}>{stu?.class_name||'—'}{stu?.section_name?' · Sec '+stu.section_name:''}</div>
      </div>
      <div style={{ flex:1, padding:'0 12px', display:'flex', flexDirection:'column', gap:4 }}>
        {[['Adm No.',stu?.admission_no||'—'],['Roll No.',stu?.roll_no||'—'],['Date of Birth',fmt(stu?.date_of_birth)],['Blood Group',stu?.blood_group||'—'],['Parent',stu?.parent_name||'—'],['Contact',stu?.parent_phone||'—']].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'0.5px solid #F3F4F6', paddingBottom:3 }}>
            <span style={{ fontSize:7.5, color:'#9CA3AF', fontWeight:700 }}>{k}</span>
            <span style={{ fontSize:8.5, fontWeight:700, color:'#111827', maxWidth:108, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background:t.bg, padding:'7px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontSize:6.5, color:t.p1, fontWeight:600 }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:54, borderBottom:`1px solid ${t.p1}`, marginBottom:2 }}/>
          <div style={{ fontSize:6.5, fontWeight:700, color:t.p1 }}>PRINCIPAL</div>
        </div>
      </div>
    </div>
  );
}

function V1Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:t.p1,
      border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:52, height:52, borderRadius:10, background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          <Logo sch={sch} size={42} dark/>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#fff' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
          <div style={{ fontSize:7.5, color:'rgba(255,255,255,.5)', marginTop:2 }}>{sch?.address_line1||sch?.address||''}{sch?.city?', '+sch.city:''}</div>
          {(sch?.phone||sch?.contact_phone||sch?.contact_number) && <div style={{ fontSize:7.5, color:'rgba(255,255,255,.5)', marginTop:1 }}>Ph: {sch?.phone||sch?.contact_phone||sch?.contact_number}</div>}
        </div>
      </div>
      <div style={{ height:1, background:'rgba(255,255,255,.1)', margin:'0 14px' }}/>
      <div style={{ flex:1, padding:'10px 14px', display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.08)', borderRadius:8, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:7, color:t.acc, fontWeight:700, marginBottom:4 }}>Emergency Contact</div>
          <div style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{stu?.parent_name||'—'}</div>
          <div style={{ fontSize:10, fontWeight:700, color:t.acc }}>{stu?.parent_phone||'—'}</div>
        </div>
        <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', lineHeight:1.7, textAlign:'center' }}>
          This card is property of<br/><strong style={{ color:'rgba(255,255,255,.65)' }}>{sch?.name||sch?.schoolName||'the School'}</strong>.<br/>If found please return to school.
        </div>
      </div>
      <div style={{ padding:'8px 14px', borderTop:'1px solid rgba(255,255,255,.1)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.3)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
      </div>
    </div>
  );
}

// ── V2 FRONT/BACK ─────────────────────────────────────────────
function V2Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:'#fff',
      border:'1px solid #E5E7EB', fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ background:t.p1, padding:'14px 12px 30px', textAlign:'center', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:7, marginBottom:3 }}>
          <div style={{ width:26, height:26, borderRadius:5, background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <Logo sch={sch} size={20} dark/>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:'#fff' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
            <div style={{ fontSize:6, color:'rgba(255,255,255,.5)' }}>STUDENT IDENTITY CARD</div>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', marginTop:-38, position:'relative', zIndex:2, marginBottom:4, flexShrink:0 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:'4px solid #fff', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {stu?.photo_url ? <img src={stu.photo_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
            : <span style={{ fontSize:26, fontWeight:800, color:t.p1, opacity:.3, fontFamily:'Arial' }}>{((stu?.first_name||'')[0]||'').toUpperCase()+((stu?.last_name||'')[0]||'').toUpperCase()}</span>}
        </div>
      </div>
      <div style={{ textAlign:'center', padding:'0 10px 8px' }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{name}</div>
        <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:5, flexWrap:'wrap' }}>
          {[stu?.class_name, stu?.section_name?'Sec '+stu.section_name:null].filter(Boolean).map((v,i)=>(
            <span key={i} style={{ padding:'2px 9px', background:t.bg, color:t.p1, borderRadius:20, fontSize:8, fontWeight:700, border:`1px solid ${t.acc}` }}>{v}</span>
          ))}
        </div>
      </div>
      <div style={{ flex:1, padding:'0 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 8px', alignContent:'start' }}>
        {[['Adm No',stu?.admission_no||'—'],['Roll No',stu?.roll_no||'—'],['Blood',stu?.blood_group||'—'],['D.O.B',fmt(stu?.date_of_birth).slice(5)||'—'],['Parent',stu?.parent_name||'—'],['Phone',stu?.parent_phone||'—']].map(([k,v])=>(
          <div key={k} style={{ background:'#F9FAFB', borderRadius:7, padding:'4px 7px' }}>
            <div style={{ fontSize:6.5, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' }}>{k}</div>
            <div style={{ fontSize:8.5, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:t.p1, padding:'6px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6, flexShrink:0 }}>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.55)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.55)' }}>AUTHORIZED SIGNATORY</div>
      </div>
    </div>
  );
}

function V2Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:t.bg,
      border:`1.5px solid ${t.acc}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ background:t.p1, padding:'10px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:5, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          <Logo sch={sch} size={22} dark/>
        </div>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:'#fff' }}>{sch?.name||sch?.schoolName||'School'}</div>
          <div style={{ fontSize:6, color:'rgba(255,255,255,.5)' }}>BACK SIDE</div>
        </div>
      </div>
      <div style={{ flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ padding:'8px 10px', background:'rgba(255,255,255,.7)', borderRadius:8, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:7, color:t.p1, fontWeight:700, marginBottom:3 }}>EMERGENCY CONTACT</div>
          <div style={{ fontSize:12, fontWeight:800, color:t.p1 }}>{stu?.parent_name||'—'}</div>
          <div style={{ fontSize:11, fontWeight:700, color:t.p2 }}>{stu?.parent_phone||'—'}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:5 }}>
          {[['School',sch?.name||sch?.schoolName||'—'],['Phone',sch?.phone||sch?.contact_phone||sch?.contact_number||'—'],['Address',(sch?.address_line1||sch?.address||'')+(sch?.city?', '+sch.city:'')]].map(([k,v])=>(
            <div key={k} style={{ background:'rgba(255,255,255,.6)', borderRadius:6, padding:'4px 8px' }}>
              <div style={{ fontSize:7, color:t.p2, fontWeight:700, textTransform:'uppercase' }}>{k}</div>
              <div style={{ fontSize:8.5, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:8, color:t.p2, textAlign:'center', lineHeight:1.6 }}>This card is property of the school.<br/>Loss must be reported immediately.</div>
      </div>
      <div style={{ background:t.p1, padding:'6px 12px', display:'flex', justifyContent:'space-between', flexShrink:0 }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.4)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
      </div>
    </div>
  );
}

// ── V3 FRONT/BACK ─────────────────────────────────────────────
function V3Front({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  const name = ((stu?.first_name||'')+' '+(stu?.last_name||'')).trim()||'Student Name';
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:t.p1,
      border:`1px solid ${t.p2}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'11px 12px 8px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          <Logo sch={sch} size={22} dark/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.9)' }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
          <div style={{ fontSize:5.5, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.08em' }}>Student ID Card</div>
        </div>
        <div style={{ fontSize:7, color:'rgba(255,255,255,.25)' }}>#{(stu?.admission_no||'——').slice(-6)}</div>
      </div>
      <div style={{ display:'flex', justifyContent:'center', padding:'0 0 10px', flexShrink:0 }}>
        <Photo stu={stu} w={80} h={88} radius={12} border={`2.5px solid ${t.acc}`} bg="rgba(255,255,255,.07)"/>
      </div>
      <div style={{ textAlign:'center', padding:'0 10px 8px', flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:6 }}>{name}</div>
        <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
          {[stu?.class_name, stu?.section_name?'Sec '+stu.section_name:null, stu?.roll_no?'Roll '+stu.roll_no:null].filter(Boolean).map((v,i)=>(
            <span key={i} style={{ padding:'2px 8px', background:i===0?t.acc:'rgba(255,255,255,.1)', color:i===0?t.p1:'rgba(255,255,255,.8)', borderRadius:6, fontSize:8, fontWeight:700 }}>{v}</span>
          ))}
        </div>
      </div>
      <div style={{ flex:1, padding:'0 13px', display:'flex', flexDirection:'column', gap:5 }}>
        {[['Adm No.',stu?.admission_no||'—'],['Blood Group',stu?.blood_group||'—'],['Date of Birth',fmt(stu?.date_of_birth)],['Parent',stu?.parent_name||'—'],['Contact',stu?.parent_phone||'—']].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:7, color:'rgba(255,255,255,.4)', fontWeight:700, textTransform:'uppercase' }}>{k}</span>
            <span style={{ fontSize:8.5, fontWeight:700, color:'rgba(255,255,255,.85)', maxWidth:115, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', padding:'6px 13px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <Barcode/>
        <div style={{ fontSize:6.5, color:'rgba(255,255,255,.3)' }}>Valid: {new Date().getFullYear()}–{new Date().getFullYear()+1}</div>
      </div>
    </div>
  );
}

function V3Back({ stu, th, sch }) {
  const t = THEMES[th]||THEMES.indigo;
  return (
    <div style={{ width:210, height:326, borderRadius:16, overflow:'hidden', background:'#fff',
      border:`1px solid ${t.p2}`, fontFamily:'"Segoe UI",Arial,sans-serif', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ height:8, background:t.p1 }}/>
      <div style={{ flex:1, padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:38, height:38, borderRadius:8, background:t.bg, border:`1.5px solid ${t.acc}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            <Logo sch={sch} size={30} dark={false}/>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:t.p1 }}>{sch?.name||sch?.school_name||sch?.schoolName||'School Name'}</div>
            <div style={{ fontSize:7.5, color:'#6B7280' }}>{sch?.address_line1||sch?.address||''}{sch?.city?', '+sch.city:''}</div>
          </div>
        </div>
        <div style={{ height:1, background:'#F3F4F6' }}/>
        <div style={{ padding:'8px 10px', background:t.bg, borderRadius:8, border:`1px solid ${t.acc}` }}>
          <div style={{ fontSize:7.5, color:t.p1, fontWeight:700, marginBottom:4 }}>EMERGENCY CONTACT</div>
          <div style={{ fontSize:12, fontWeight:800, color:t.p1 }}>{stu?.parent_name||'—'}</div>
          <div style={{ fontSize:10, fontWeight:700, color:t.p2 }}>{stu?.parent_phone||'—'}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {[['School Phone',sch?.phone||sch?.contact_phone||sch?.contact_number||'—'],['Email',sch?.email||'—'],['Student Adm.',stu?.admission_no||'—']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:8, color:'#9CA3AF', fontWeight:700 }}>{k}</span>
              <span style={{ fontSize:8, fontWeight:700, color:'#111827' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:8, color:'#9CA3AF', textAlign:'center', lineHeight:1.6 }}>
          This card must be carried at all times.<br/>Report loss to school immediately.
        </div>
      </div>
      <div style={{ height:8, background:t.p1 }}/>
    </div>
  );
}

const DESIGNS = [
  { id:'h1', label:'Classic Split',  sub:'Horizontal', orientation:'H', Front:H1Front, Back:H1Back },
  { id:'h2', label:'Top Banner',     sub:'Horizontal', orientation:'H', Front:H2Front, Back:H2Back },
  { id:'h3', label:'Dark Premium',   sub:'Horizontal', orientation:'H', Front:H3Front, Back:H3Back },
  { id:'v1', label:'Classic',        sub:'Vertical',   orientation:'V', Front:V1Front, Back:V1Back },
  { id:'v2', label:'Circle Photo',   sub:'Vertical',   orientation:'V', Front:V2Front, Back:V2Back },
  { id:'v3', label:'Dark Premium',   sub:'Vertical',   orientation:'V', Front:V3Front, Back:V3Back },
];

// ── PRINT FUNCTION — uses ReactDOMServer to render exact same HTML as UI ──
function printCards(students, design, theme, school) {
  const isV = design.orientation === 'V';
  const FrontComp = design.Front;
  const BackComp  = design.Back;

  // Render each student's front+back to static HTML
  const pairs = students.map(stu => {
    const frontHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(FrontComp, { stu, th: theme, sch: school })
    );
    const backHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BackComp, { stu, th: theme, sch: school })
    );
    return { frontHtml, backHtml };
  });

  const pairsHTML = pairs.map(({ frontHtml, backHtml }) => `
    <div class="pair">
      <div>
        <div class="side-label">FRONT</div>
        ${frontHtml}
      </div>
      <div>
        <div class="side-label">BACK</div>
        ${backHtml}
      </div>
    </div>
  `).join('');

  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) { alert('Please allow popups for printing.'); return; }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>ID Cards — ${design.label}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:"Segoe UI",Arial,sans-serif;background:#f0f0f0;padding:20px;}
.cards-wrap{display:flex;flex-wrap:wrap;justify-content:center;gap:20px;}
.pair{display:flex;flex-direction:${isV ? 'column' : 'row'};gap:10px;align-items:center;background:#fff;padding:12px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1);break-inside:avoid;}
.side-label{font-size:9px;color:#9CA3AF;text-align:center;margin-bottom:5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
.noprint{text-align:center;padding:14px;margin-bottom:10px;}
@media print {
  @page{size:A4;margin:5mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
  body{background:#fff!important;padding:2mm!important;}
  .noprint{display:none!important;}
  .pair{box-shadow:none!important;background:transparent!important;padding:4px!important;border-radius:0!important;}
  .cards-wrap{gap:8px!important;}
}
</style>
</head>
<body>
<div class="noprint">
  <button onclick="window.print()" style="padding:10px 28px;background:#1E1B4B;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:10px;font-family:sans-serif;">🖨️ Print All Cards</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#E5E7EB;color:#374151;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif;">✕ Close</button>
  <span style="margin-left:16px;font-size:13px;color:#6B7280;">${students.length} card${students.length > 1 ? 's' : ''} · ${design.label}</span>
</div>
<div class="cards-wrap">
  ${pairsHTML}
</div>
</body>
</html>`);
  win.document.close();
}


// ── MAIN PAGE ─────────────────────────────────────────────────
export default function IDCard() {
  const [students,    setStudents]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [classes,     setClasses]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selDesign,   setSelDesign]   = useState('h1');
  const [selTheme,    setSelTheme]    = useState('indigo');
  const [selected,    setSelected]    = useState(new Set());
  const [school,      setSchool]      = useState({});
  const [previewStu,  setPreviewStu]  = useState(null);
  const [showBack,    setShowBack]    = useState(false);

  useEffect(() => {
    // Load school from API — not just localStorage
    schoolAPI.getProfile().then(r => {
      const raw = r.data?.data || {};
      // Normalize all possible field names
      const s = {
        ...raw,
        name: raw.name || raw.school_name || raw.schoolName || '',
        logo_url: raw.logo_url || raw.logo || raw.logoUrl || '',
        address: raw.address || raw.address_line1 || '',
        phone: raw.phone || raw.contact_phone || raw.contact_number || '',
      };
      setSchool(s);
    }).catch(() => {
      try { setSchool(JSON.parse(localStorage.getItem('school_settings'))||{}); } catch {}
    });
    schoolAPI.getClasses().then(r=>setClasses(r.data.data||[])).catch(()=>{});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({ limit:200, search:search||undefined, className:filterClass||undefined });
      const data = res.data.data||[];
      setStudents(data);
      if (!previewStu && data.length) setPreviewStu(data[0]);
    } catch { setStudents([]); } finally { setLoading(false); }
  }, [search, filterClass]);

  useEffect(() => { load(); }, [load]);

  const toggleSel = s => { setPreviewStu(s); setSelected(prev=>{const n=new Set(prev);n.has(s.id)?n.delete(s.id):n.add(s.id);return n;}); };
  const design = DESIGNS.find(d=>d.id===selDesign)||DESIGNS[0];
  const Front = design.Front;
  const Back  = design.Back;
  const selStudents = students.filter(s=>selected.has(s.id));
  const inpStyle = {padding:'9px 12px',border:'1.5px solid #E5E7EB',borderRadius:9,fontSize:13,outline:'none',fontFamily:'inherit',background:'#fff',boxSizing:'border-box'};

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#111827'}}>ID Card Generator</h2>
          <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>{students.length} students · {selected.size} selected</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {previewStu && <button onClick={()=>printCards([previewStu],design,selTheme,school)}
            style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',border:'1.5px solid #7B6FD4',background:'#fff',color:'#534AB7',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            <i className="ti ti-printer" style={{fontSize:16}}/> Preview Print
          </button>}
          {selected.size>0 && <button onClick={()=>printCards(selStudents,design,selTheme,school)}
            style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',background:'linear-gradient(135deg,#7B6FD4,#534AB7)',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(123,111,212,0.4)'}}>
            <i className="ti ti-printer" style={{fontSize:16}}/> Print {selected.size} Card{selected.size>1?'s':''}
          </button>}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16}}>
        {/* Left controls */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {/* Design */}
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:14}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,background:'#EEEDFE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-id-badge" style={{fontSize:15,color:'#534AB7'}}/>
              </div>
              Card Design
            </div>
            {[{label:'Horizontal',o:'H'},{label:'Vertical',o:'V'}].map(({label,o})=>(
              <div key={o} style={{marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',marginBottom:5}}>{label}</div>
                <div style={{display:'flex',gap:5}}>
                  {DESIGNS.filter(d=>d.orientation===o).map(d=>(
                    <button key={d.id} onClick={()=>setSelDesign(d.id)}
                      style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(selDesign===d.id?'#7B6FD4':'#E5E7EB'),borderRadius:9,background:selDesign===d.id?'#EEEDFE':'#fff',fontSize:9.5,fontWeight:selDesign===d.id?700:400,cursor:'pointer',color:selDesign===d.id?'#534AB7':'#374151'}}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Theme */}
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:14}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,background:'#E1F5EE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-palette" style={{fontSize:15,color:'#0F6E56'}}/>
              </div>
              Color Theme
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
              {Object.entries(THEMES).map(([key,t])=>(
                <button key={key} onClick={()=>setSelTheme(key)}
                  style={{padding:'9px',border:'2px solid '+(selTheme===key?t.p1:'#E5E7EB'),borderRadius:10,background:selTheme===key?t.bg:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:20,height:20,borderRadius:5,background:`linear-gradient(135deg,${t.p1},${t.p2})`,flexShrink:0}}/>
                  <span style={{fontSize:11,fontWeight:selTheme===key?700:600,color:selTheme===key?t.p1:'#374151'}}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Students */}
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:14}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,background:'#DBEAFE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-users" style={{fontSize:15,color:'#1E40AF'}}/>
              </div>
              Students
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:9,padding:'7px 12px',marginBottom:8}}>
              <i className="ti ti-search" style={{fontSize:15,color:'#9CA3AF'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{border:'none',outline:'none',fontSize:12,background:'transparent',width:'100%',fontFamily:'inherit'}}/>
            </div>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={{...inpStyle,width:'100%',marginBottom:8}}>
              <option value="">All Classes</option>
              {classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              <button onClick={()=>setSelected(new Set(students.map(s=>s.id)))} style={{flex:1,padding:'6px',border:'1px solid #7B6FD4',borderRadius:8,background:'#EEEDFE',fontSize:11,cursor:'pointer',fontWeight:700,color:'#534AB7',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                <i className="ti ti-checks" style={{fontSize:13}}/>All
              </button>
              <button onClick={()=>setSelected(new Set())} style={{flex:1,padding:'6px',border:'1px solid #E5E7EB',borderRadius:8,background:'#F9FAFB',fontSize:11,cursor:'pointer',fontWeight:600,color:'#6B7280',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                <i className="ti ti-x" style={{fontSize:13}}/>Clear
              </button>
            </div>
            <div style={{maxHeight:240,overflowY:'auto',border:'1px solid #F3F4F6',borderRadius:8}}>
              {loading ? <div style={{padding:16,textAlign:'center',color:'#9CA3AF',fontSize:12}}>Loading...</div>
                : students.map(s=>(
                  <div key={s.id} onClick={()=>toggleSel(s)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderBottom:'0.5px solid #F9FAFB',cursor:'pointer',background:selected.has(s.id)?'#EDE9F8':previewStu?.id===s.id?'#F5F3FF':'#fff'}}>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={()=>{}} style={{accentColor:'#1E1B4B',flexShrink:0}}/>
                    {s.photo_url
                      ? <img src={s.photo_url} style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                      : <div style={{width:26,height:26,borderRadius:'50%',background:'#EDE9F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#1E1B4B',flexShrink:0}}>{(s.first_name||'?')[0]}</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.first_name} {s.last_name||''}</div>
                      <div style={{fontSize:9,color:'#9CA3AF'}}>{s.admission_no} · {s.class_name||'—'}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div>
          <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:'#111827'}}>{design.label} — {design.sub}</div>
                <div style={{fontSize:11,color:'#9CA3AF',marginTop:2}}>{design.orientation==='H'?'Landscape 85×54mm':'Portrait 54×86mm'} · Front & Back</div>
              </div>
              {/* Front/Back toggle */}
              <div style={{display:'flex',border:'1.5px solid #E5E7EB',borderRadius:10,overflow:'hidden'}}>
                <button onClick={()=>setShowBack(false)}
                  style={{padding:'7px 18px',border:'none',background:!showBack?'linear-gradient(135deg,#7B6FD4,#534AB7)':'#fff',color:!showBack?'#fff':'#374151',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Front
                </button>
                <button onClick={()=>setShowBack(true)}
                  style={{padding:'7px 18px',border:'none',background:showBack?'linear-gradient(135deg,#7B6FD4,#534AB7)':'#fff',color:showBack?'#fff':'#374151',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Back
                </button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:24,padding:'20px',background:'#F8FAFC',borderRadius:12,border:'1px solid #E5E7EB',flexWrap:'wrap'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#9CA3AF',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>FRONT</div>
                <Front stu={previewStu} th={selTheme} sch={school}/>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#9CA3AF',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>BACK</div>
                <Back stu={previewStu} th={selTheme} sch={school}/>
              </div>
            </div>
          </div>

          {/* Selected mini thumbnails */}
          {selected.size > 0 && (
            <div style={{background:'#fff',border:'0.5px solid #E5E7EB',borderRadius:14,padding:14,marginTop:12}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:28,height:28,background:'#EEEDFE',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className="ti ti-stack" style={{fontSize:15,color:'#534AB7'}}/>
                </div>
                Selected ({selected.size}) · Front Preview
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',overflow:'hidden'}}>
                {selStudents.slice(0,6).map(s=>{
                  const sc = design.orientation==='V' ? 0.33 : 0.35;
                  const mr = design.orientation==='V' ? -141 : -222;
                  const mb = design.orientation==='V' ? -220 : -140;
                  return (
                    <div key={s.id} style={{transform:`scale(${sc})`,transformOrigin:'top left',flexShrink:0,marginRight:mr,marginBottom:mb}}>
                      <Front stu={s} th={selTheme} sch={school}/>
                    </div>
                  );
                })}
                {selStudents.length > 6 && <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:70,height:50,background:'#F9FAFB',borderRadius:8,fontSize:12,color:'#6B7280',fontWeight:600,flexShrink:0}}>+{selStudents.length-6}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
