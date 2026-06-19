import React, { useEffect, useState } from 'react';

export default function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(true);

  useEffect(() => {
    // Fast to 70%, then slow, then jump to 100%
    const t1 = setTimeout(() => setProgress(40),  50);
    const t2 = setTimeout(() => setProgress(65),  150);
    const t3 = setTimeout(() => setProgress(80),  280);
    const t4 = setTimeout(() => setProgress(95),  450);
    const t5 = setTimeout(() => setProgress(100), 600);
    const t6 = setTimeout(() => setVisible(false), 800);
    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 8px rgba(245,158,11,.6); }
          50%      { box-shadow: 0 0 20px rgba(245,158,11,.9), 0 0 40px rgba(245,158,11,.3); }
        }
      `}</style>

      {/* Top progress bar */}
      <div style={{
        position:'fixed', top:0, left:0, right:0,
        height:3, zIndex:9999,
        background:'rgba(0,0,0,.06)',
      }}>
        {/* Track */}
        <div style={{
          height:'100%',
          width:`${progress}%`,
          background:'linear-gradient(90deg,#1E1B4B,#7C3AED,#F59E0B)',
          borderRadius:'0 99px 99px 0',
          transition:'width .3s cubic-bezier(.4,0,.2,1)',
          position:'relative', overflow:'hidden',
          animation:'glowPulse 1.5s ease-in-out infinite',
        }}>
          {/* Shimmer */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.6) 50%,transparent 100%)',
            animation:'shimmerBar 1.2s ease-in-out infinite',
          }}/>
        </div>

        {/* Glow dot at tip */}
        <div style={{
          position:'absolute', top:'50%', left:`${progress}%`,
          transform:'translate(-50%,-50%)',
          width:8, height:8, borderRadius:'50%',
          background:'#F59E0B',
          boxShadow:'0 0 10px #F59E0B, 0 0 20px #F59E0B88',
          transition:'left .3s cubic-bezier(.4,0,.2,1)',
        }}/>
      </div>

      {/* Full page overlay with spinner */}
      <div style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'rgba(248,250,252,.85)',
        backdropFilter:'blur(4px)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:20,
        opacity: progress < 100 ? 1 : 0,
        transition:'opacity .2s ease',
      }}>
        {/* Premium spinner */}
        <div style={{position:'relative', width:56, height:56}}>
          {/* Outer ring */}
          <svg width="56" height="56" viewBox="0 0 56 56" style={{position:'absolute',inset:0,animation:'spin 1.4s linear infinite'}}
            xmlns="http://www.w3.org/2000/svg">
            <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
            <circle cx="28" cy="28" r="24" fill="none" stroke="url(#grad)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray="40 111"/>
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E1B4B"/>
                <stop offset="100%" stopColor="#F59E0B"/>
              </linearGradient>
            </defs>
          </svg>
          {/* Inner dot */}
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              width:16, height:16, borderRadius:'50%',
              background:'linear-gradient(135deg,#1E1B4B,#7C3AED)',
              boxShadow:'0 2px 8px rgba(30,27,75,.4)',
            }}/>
          </div>
        </div>

        {/* Loading text */}
        <div style={{textAlign:'center'}}>
          <div style={{
            fontSize:13, fontWeight:700, color:'#1E293B',
            letterSpacing:'.02em', marginBottom:4,
          }}>
            Loading EduErpee
          </div>
          <div style={{
            fontSize:11, color:'#94A3B8',
            fontWeight:500,
          }}>
            Please wait…
          </div>
        </div>

        {/* Progress percentage */}
        <div style={{
          padding:'4px 14px',
          background:'linear-gradient(135deg,#1E1B4B15,#7C3AED15)',
          border:'1px solid #1E1B4B22',
          borderRadius:100,
          fontSize:11, fontWeight:800,
          color:'#1E1B4B',
        }}>
          {progress}%
        </div>
      </div>
    </>
  );
}
