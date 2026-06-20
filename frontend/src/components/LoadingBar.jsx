import React, { useEffect, useState } from 'react';

export default function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(20),  100);
    const t2 = setTimeout(() => setProgress(45),  250);
    const t3 = setTimeout(() => setProgress(68),  420);
    const t4 = setTimeout(() => setProgress(85),  600);
    const t5 = setTimeout(() => setProgress(100), 820);
    const t6 = setTimeout(() => setVisible(false), 1050);
    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset    = circumference - (progress / 100) * circumference;

  return (
    <>
      <style>{`
        @keyframes spinRing  { to { transform: rotate(360deg); } }
        @keyframes spinRing2 { to { transform: rotate(-360deg); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes countUp   { from { opacity:0; transform:scale(.8); } to { opacity:1; transform:scale(1); } }
        @keyframes glowBeat  {
          0%,100% { box-shadow: 0 0 10px #F59E0B88, 0 0 20px #F59E0B44; }
          50%     { box-shadow: 0 0 22px #F59E0BCC, 0 0 44px #F59E0B66, 0 0 66px #F59E0B22; }
        }
        @keyframes bgPulse {
          0%,100% { background: rgba(30,27,75,.03); }
          50%     { background: rgba(124,58,237,.06); }
        }
      `}</style>

      {/* ── Full page overlay ── */}
      <div style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(248,250,252,.94)',
        backdropFilter:'blur(8px)',
        WebkitBackdropFilter:'blur(8px)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        animation:'fadeIn .18s ease',
      }}>

        {/* ── Decorative background ring ── */}
        <div style={{
          position:'absolute',
          width:320, height:320,
          borderRadius:'50%',
          border:'1px solid rgba(124,58,237,.08)',
          animation:'bgPulse 2s ease-in-out infinite',
        }}/>
        <div style={{
          position:'absolute',
          width:220, height:220,
          borderRadius:'50%',
          border:'1px solid rgba(245,158,11,.1)',
          animation:'bgPulse 2s ease-in-out infinite',
          animationDelay:'.5s',
        }}/>

        {/* ── Main spinner container ── */}
        <div style={{ position:'relative', width:160, height:160, marginBottom:28 }}>

          {/* Outer slow ring — Yellow */}
          <svg width="160" height="160" viewBox="0 0 160 160"
            style={{ position:'absolute', inset:0, animation:'spinRing 3s linear infinite' }}>
            <circle cx="80" cy="80" r="72"
              fill="none" stroke="#FDE68A" strokeWidth="2.5"
              strokeDasharray="12 8" strokeLinecap="round"/>
          </svg>

          {/* Middle ring — Gradient progress */}
          <svg width="160" height="160" viewBox="0 0 160 160"
            style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="80" cy="80" r="60"
              fill="none" stroke="#EDE9FE" strokeWidth="10"/>
            {/* Progress fill */}
            <circle cx="80" cy="80" r="60"
              fill="none"
              stroke="url(#mainGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(progress/100)*(2*Math.PI*60)} ${2*Math.PI*60}`}
              style={{ transition:'stroke-dasharray .35s cubic-bezier(.4,0,.2,1)' }}/>
            <defs>
              <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#1E1B4B"/>
                <stop offset="40%"  stopColor="#7C3AED"/>
                <stop offset="75%"  stopColor="#F59E0B"/>
                <stop offset="100%" stopColor="#FDE68A"/>
              </linearGradient>
            </defs>
          </svg>

          {/* Inner spinning ring — Indigo dashes */}
          <svg width="160" height="160" viewBox="0 0 160 160"
            style={{ position:'absolute', inset:0, animation:'spinRing2 2s linear infinite' }}>
            <circle cx="80" cy="80" r="46"
              fill="none" stroke="#C4B5FD" strokeWidth="2"
              strokeDasharray="6 10" strokeLinecap="round"/>
          </svg>

          {/* Center circle */}
          <div style={{
            position:'absolute', inset:0,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            gap:2,
          }}>
            {/* Yellow glow dot */}
            <div style={{
              width:14, height:14, borderRadius:'50%',
              background:'linear-gradient(135deg,#F59E0B,#FDE68A)',
              marginBottom:4,
              animation:'glowBeat 1.2s ease-in-out infinite',
            }}/>
            {/* % counter */}
            <div style={{
              fontSize:28, fontWeight:900, color:'#1E1B4B',
              lineHeight:1, fontFamily:'"Segoe UI",system-ui,sans-serif',
              animation:'countUp .2s ease',
              key: progress,
            }}>
              {progress}
            </div>
            <div style={{
              fontSize:11, fontWeight:700, color:'#7C3AED',
              letterSpacing:'.1em',
            }}>%</div>
          </div>
        </div>

        {/* ── Text section ── */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{
            fontSize:16, fontWeight:800, color:'#1E1B4B',
            letterSpacing:'.02em', marginBottom:8,
            fontFamily:'"Segoe UI",system-ui,sans-serif',
          }}>
            Loading EduErpee
          </div>

          {/* Slim progress bar */}
          <div style={{
            width:200, height:4, background:'#EDE9FE',
            borderRadius:99, overflow:'hidden', margin:'0 auto 8px',
          }}>
            <div style={{
              height:'100%',
              width:`${progress}%`,
              background:'linear-gradient(90deg,#1E1B4B,#7C3AED,#F59E0B)',
              borderRadius:99,
              transition:'width .35s cubic-bezier(.4,0,.2,1)',
              boxShadow:'0 0 8px rgba(245,158,11,.5)',
            }}/>
          </div>

          <div style={{
            fontSize:12, color:'#9CA3AF', fontWeight:500,
            fontFamily:'"Segoe UI",system-ui,sans-serif',
          }}>
            Please wait…
          </div>
        </div>

        {/* ── 3 dot indicator ── */}
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:7, height:7, borderRadius:'50%',
              background: i===0 ? '#1E1B4B' : i===1 ? '#7C3AED' : '#F59E0B',
              opacity: progress > i*33 ? 1 : .25,
              transition:'opacity .3s ease',
              boxShadow: progress > i*33 ? `0 0 8px ${i===0?'#1E1B4B':i===1?'#7C3AED':'#F59E0B'}88` : 'none',
            }}/>
          ))}
        </div>

      </div>
    </>
  );
}
