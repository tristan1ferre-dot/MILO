import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const MUSCLE_GROUPS = ["Pectoraux","Dos","Épaules","Biceps","Triceps","Avant-bras","Abdominaux","Obliques","Quadriceps","Ischio-jambiers","Fessiers","Mollets","Trapèzes","Lombaires"];
const DAYS_FR   = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#080808; }
  @keyframes flicker { 0%,100%{opacity:1}92%{opacity:1}93%{opacity:.8}94%{opacity:1}96%{opacity:.9}97%{opacity:1} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes gridMove { 0%{background-position:0 0}100%{background-position:40px 40px} }
  @keyframes borderPulse { 0%,100%{border-color:#00ff8833}50%{border-color:#00ff8877} }
  @keyframes dayglow { 0%,100%{box-shadow:0 0 8px #00ff8866}50%{box-shadow:0 0 20px #00ff88aa,0 0 40px #00ff8833} }
  @keyframes warningPulse { 0%,100%{box-shadow:0 0 8px #ff444422}50%{box-shadow:0 0 20px #ff444455} }
  @keyframes upgradePulse { 0%,100%{box-shadow:0 0 8px #00ff8822}50%{box-shadow:0 0 20px #00ff8855} }
  @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  .neo-input{width:100%;background:#0d0d0d;border:1px solid #1a3d2b;border-bottom:1px solid #00ff8844;color:#00ff88;font-family:'Share Tech Mono',monospace;font-size:15px;padding:12px 14px;outline:none;letter-spacing:.08em;transition:all .2s;}
  .neo-input:focus{border-color:#00ff88;box-shadow:0 0 20px #00ff8818;background:#0f0f0f}
  .neo-input::placeholder{color:#1e4d35}
  .muscle-tag{cursor:pointer;padding:5px 12px;border:1px solid #1a3d2b;background:transparent;color:#4a7a5f;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.1em;transition:all .15s;text-transform:uppercase;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}
  .muscle-tag:hover{border-color:#00ff88;color:#00ff88;background:#00ff8811}
  .muscle-tag.sel{border-color:#00ff88;color:#080808;background:#00ff88;font-weight:bold}
  .submit-btn{padding:14px 20px;border:1px solid #00ff88;background:transparent;color:#00ff88;font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:.25em;cursor:pointer;transition:all .2s;text-transform:uppercase;}
  .submit-btn:not(:disabled):hover{background:#00ff88;color:#080808;box-shadow:0 0 30px #00ff8855}
  .submit-btn:disabled{border-color:#1a3d2b;color:#1a3d2b;cursor:not-allowed}
  .submit-btn.full{width:100%}
  .ghost-btn{padding:14px 20px;border:1px solid #1a3d2b;background:transparent;color:#3a5c47;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.2em;cursor:pointer;transition:all .2s;text-transform:uppercase;}
  .ghost-btn:hover{color:#e0e0e0;border-color:#3a5c47}
  .nav-btn{width:100%;padding:20px;border:1px solid #0f2d1f;background:#090909;color:#e0e0e0;font-family:'Orbitron',sans-serif;font-size:13px;letter-spacing:.2em;cursor:pointer;transition:all .25s;text-transform:uppercase;text-align:left;display:flex;align-items:center;gap:14px;}
  .nav-btn:hover{border-color:#00ff88;background:#0d0d0d;box-shadow:0 0 30px #00ff8812}
  .nav-btn.accent{border-color:#00ff8855;animation:borderPulse 3s infinite}
  .nav-btn.prog{border-color:#8844ff33}
  .nav-btn.prog:hover{border-color:#8844ff88;box-shadow:0 0 30px #8844ff11}
  .ex-card{border:1px solid #0f2d1f;background:#0a0a0a;padding:16px 18px;transition:all .2s;animation:fadeSlideUp .3s ease forwards;}
  .ex-card:hover{border-color:#00ff8833;background:#0d0d0d}
  .sess-ex-card{border:1px solid #0f2d1f;background:#090909;padding:20px;animation:fadeSlideUp .25s ease forwards;position:relative;}
  .diff-dot{width:32px;height:32px;border-radius:50%;border:1px solid #1a3d2b;background:transparent;cursor:pointer;transition:all .2s;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;color:#3a5c47;display:flex;align-items:center;justify-content:center;}
  .diff-dot:hover{border-color:#00ff8866;color:#00ff88}
  .diff-dot.active{border-color:#00ff88;background:#00ff88;color:#080808;box-shadow:0 0 12px #00ff8866}
  .toggle-btn{flex:1;padding:12px;border:1px solid #1a3d2b;background:transparent;color:#4a7a5f;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.12em;cursor:pointer;transition:all .2s;text-transform:uppercase;}
  .toggle-btn:hover{border-color:#00ff8855;color:#00ff88}
  .toggle-btn.active{border-color:#00ff88;color:#00ff88;background:#00ff8811}
  .fail-btn{flex:1;padding:12px;border:1px solid #1a3d2b;background:transparent;color:#4a7a5f;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.12em;cursor:pointer;transition:all .2s;text-transform:uppercase;}
  .fail-btn:hover{border-color:#ff444455;color:#ff4444}
  .fail-btn.active-fail{border-color:#ff4444;color:#ff4444;background:#ff444411}
  .fail-btn.active-success{border-color:#00ff88;color:#00ff88;background:#00ff8811}
  .ex-prog-row{width:100%;padding:16px 18px;border:1px solid #0f2d1f;background:#090909;color:#e0e0e0;font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:.06em;cursor:pointer;transition:all .2s;text-align:left;display:flex;justify-content:space-between;align-items:center;}
  .ex-prog-row:hover{border-color:#00ff8844;background:#0d0d0d;color:#00ff88}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:#080808}
  ::-webkit-scrollbar-thumb{background:#1a3d2b}
  ::-webkit-scrollbar-thumb:hover{background:#00ff8844}
`;

// ── UI primitives ──────────────────────────────────────────────────────────────
const Shell = ({children}) => (
  <div style={{minHeight:"100vh",background:"#080808",color:"#e0e0e0",overflowX:"hidden"}}>
    <style>{GLOBAL_CSS}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)"}}/>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(#00ff8805 1px,transparent 1px),linear-gradient(90deg,#00ff8805 1px,transparent 1px)",backgroundSize:"40px 40px",animation:"gridMove 10s linear infinite"}}/>
    <div style={{maxWidth:700,margin:"0 auto",padding:"36px 20px",position:"relative"}}>{children}</div>
  </div>
);
const SL  = ({children}) => <div style={{fontFamily:"'Share Tech Mono',monospace",color:"#00ff88",fontSize:10,letterSpacing:".4em",marginBottom:10,opacity:.6,textTransform:"uppercase"}}>{children}</div>;
const PT  = ({accent,children}) => <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(22px,5vw,34px)",fontWeight:900,letterSpacing:".05em",lineHeight:1.1,animation:"flicker 6s infinite",marginBottom:6}}>{children} <span style={{color:"#00ff88",textShadow:"0 0 20px #00ff88aa"}}>{accent}</span></h1>;
const Div = () => <div style={{width:50,height:2,background:"linear-gradient(90deg,#00ff88,transparent)",marginTop:14,marginBottom:32}}/>;
const Lbl = ({children}) => <div style={{fontSize:9,letterSpacing:".3em",color:"#3a5c47",textTransform:"uppercase",marginBottom:8,fontFamily:"'Share Tech Mono',monospace"}}>{children}</div>;

const Loader = ({text="CHARGEMENT..."}) => (
  <Shell>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:20}}>
      <div style={{width:40,height:40,border:"2px solid #00ff8833",borderTop:"2px solid #00ff88",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#3a5c47",letterSpacing:".3em"}}>{text}</div>
    </div>
  </Shell>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().slice(0,10);
const mondayISO = () => { const d=new Date(),dow=d.getDay(); d.setDate(d.getDate()-((dow+6)%7)); return d.toISOString().slice(0,10); };
const getExEntries = (sessions,exId) => { const r=[]; sessions.forEach(s=>s.entries.forEach(e=>{ if(e.exercise_id===exId) r.push({...e,date:s.date}); })); return r.sort((a,b)=>a.date.localeCompare(b.date)); };
const computeAdvice = (entries) => {
  if(entries.length<2) return null;
  const last3=entries.slice(-3),last2=entries.slice(-2);
  if(last2.filter(e=>e.failure===true).length>=2) return {type:"reduce",reason:"2 échecs récents"};
  if(last3.length===3&&last3.every(e=>e.difficulty===5)) return {type:"reduce",reason:"Difficulté max 3× de suite"};
  if(last2.some(e=>e.difficulty===1)) return {type:"increase",reason:"Difficulté très faible"};
  if(last2.length===2&&last2.every(e=>e.difficulty<=2)) return {type:"increase",reason:"Très facile 2× de suite"};
  return null;
};

// ── Sparkline ──────────────────────────────────────────────────────────────────
const Sparkline = ({data,color="#00ff88"}) => {
  if(!data||data.length<2) return null;
  const W=260,H=56,pad=6;
  const vals=data.map(d=>d.y),minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1;
  const pts=data.map((d,i)=>{ const x=pad+(i/(data.length-1))*(W-2*pad); const y=H-pad-((d.y-minV)/range)*(H-2*pad); return [x,y]; });
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area=path+` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#sg)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={color} style={{filter:`drop-shadow(0 0 3px ${color})`}}/>)}
    </svg>
  );
};

const ProgBar = ({pct,color="#00ff88",label}) => (
  <div>
    {label&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".2em",color:"#3a5c47",textTransform:"uppercase",marginBottom:6}}>{label}</div>}
    <div style={{height:4,background:"#0f2d1f",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${Math.min(pct,100)}%`,background:color,boxShadow:`0 0 8px ${color}`,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,color,marginTop:4,textAlign:"right"}}>{pct.toFixed(0)}%</div>
  </div>
);

// ── Monthly Calendar ───────────────────────────────────────────────────────────
const MonthCal = ({sessions}) => {
  const [off,setOff]=useState(0);
  const today=new Date(),ref=new Date(today.getFullYear(),today.getMonth()+off,1);
  const year=ref.getFullYear(),month=ref.getMonth();
  const dim=new Date(year,month+1,0).getDate();
  const firstDow=(new Date(year,month,1).getDay()+6)%7;
  const sessdays=new Set(sessions.filter(s=>s.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).map(s=>parseInt(s.date.slice(8))));
  const todayD=today.getFullYear()===year&&today.getMonth()===month?today.getDate():null;
  const cells=Array(firstDow).fill(null).concat(Array.from({length:dim},(_,i)=>i+1));
  return (
    <div style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <SL>Calendrier mensuel</SL>
        <div style={{display:"flex",gap:6}}>
          {[{dir:-1,icon:"‹"},{dir:1,icon:"›",disabled:off===0}].map(({dir,icon,disabled})=>(
            <button key={dir} onClick={()=>!disabled&&setOff(o=>o+dir)} disabled={disabled}
              style={{background:"transparent",border:`1px solid ${disabled?"#0f1f18":"#1a3d2b"}`,color:disabled?"#0f1f18":"#3a5c47",width:26,height:26,cursor:disabled?"default":"pointer",fontSize:12,fontFamily:"'Share Tech Mono',monospace",transition:"all .15s"}}
              onMouseEnter={e=>{if(!disabled){e.currentTarget.style.borderColor="#00ff88";e.currentTarget.style.color="#00ff88"}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=disabled?"#0f1f18":"#1a3d2b";e.currentTarget.style.color=disabled?"#0f1f18":"#3a5c47"}}>{icon}</button>
          ))}
        </div>
      </div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:"#e0e0e0",letterSpacing:".15em",marginBottom:12,textAlign:"center"}}>{MONTHS_FR[month].toUpperCase()} <span style={{color:"#3a5c47"}}>{year}</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Share Tech Mono',monospace",fontSize:8,letterSpacing:".1em",color:"#1e4d35",paddingBottom:6}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((day,i)=>(
          <div key={i} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",border:day?"1px solid":"none",borderColor:day&&sessdays.has(day)?"#00ff88":day===todayD?"#00ff8833":"#0f2d1f",background:day&&sessdays.has(day)?"#00ff8811":day===todayD?"#0a160e":"#090909",animation:day&&sessdays.has(day)?"dayglow 2.5s infinite":"none"}}>
            {day&&<span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:sessdays.has(day)?"#00ff88":day===todayD?"#e0e0e0":"#1e4d35"}}>{day}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const WeekBar = ({sessions}) => {
  const today=new Date(),mon=new Date(today); mon.setDate(today.getDate()-((today.getDay()+6)%7));
  const days=Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); const key=d.toISOString().slice(0,10); return {label:DAYS_FR[i],key,isToday:key===todayISO(),has:sessions.some(s=>s.date===key),num:d.getDate()}; });
  return (
    <div style={{display:"flex",gap:3,marginBottom:28}}>
      {days.map(d=>(
        <div key={d.key} style={{flex:1,padding:"10px 4px",textAlign:"center",border:"1px solid",borderColor:d.has?"#00ff88":d.isToday?"#00ff8833":"#0f2d1f",background:d.has?"#00ff8811":d.isToday?"#0a160e":"#090909",animation:d.has?"dayglow 2.5s infinite":"none",position:"relative"}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:d.isToday?"#00ff88":"#3a5c47",marginBottom:6}}>{d.label}</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:d.has?"#00ff88":d.isToday?"#e0e0e0":"#2a4a36"}}>{d.num}</div>
          {d.has&&<div style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",margin:"5px auto 0",boxShadow:"0 0 8px #00ff88"}}/>}
          {d.isToday&&!d.has&&<div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"#00ff8844"}}/>}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════════════════════════
const AuthPage = () => {
  const [mode,setMode]   = useState("login"); // login | signup
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [err,setErr]     = useState("");
  const [loading,setLoading] = useState(false);
  const [confirm,setConfirm] = useState(false);

  const handle = async () => {
    setErr(""); setLoading(true);
    if(mode==="login"){
      const {error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error) setErr(error.message);
    } else {
      const {error}=await supabase.auth.signUp({email,password:pass});
      if(error) setErr(error.message);
      else setConfirm(true);
    }
    setLoading(false);
  };

  if(confirm) return (
    <Shell>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:20,animation:"fadeSlideUp .4s ease"}}>
        <div style={{width:60,height:60,border:"2px solid #00ff88",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 30px #00ff88",animation:"dayglow 2s infinite"}}>
          <span style={{fontSize:26,color:"#00ff88"}}>✓</span>
        </div>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,color:"#00ff88",letterSpacing:".2em",textAlign:"center"}}>COMPTE CRÉÉ !</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#3a5c47",letterSpacing:".1em",textAlign:"center",lineHeight:1.8}}>
          Vérifie ta boîte mail<br/>et clique sur le lien de confirmation.
        </div>
        <button className="ghost-btn" onClick={()=>{setConfirm(false);setMode("login")}}>← Se connecter</button>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh",paddingTop:0,animation:"fadeSlideUp .4s ease"}}>
        <SL>SPORT TRACKER SYS // v3.0</SL>
        <PT accent="MILO">BIENVENUE</PT>
        <Div/>
        <div style={{padding:"28px",border:"1px solid #00ff8822",background:"#090909",boxShadow:"0 0 40px #00ff8806"}}>
          <div style={{display:"flex",gap:2,marginBottom:24}}>
            {[{v:"login",l:"Se connecter"},{v:"signup",l:"Créer un compte"}].map(t=>(
              <button key={t.v} className={`toggle-btn ${mode===t.v?"active":""}`} onClick={()=>{setMode(t.v);setErr("")}}>{t.l}</button>
            ))}
          </div>
          <div style={{marginBottom:16}}><Lbl>Email</Lbl><input className="neo-input" type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          <div style={{marginBottom:24}}><Lbl>Mot de passe {mode==="signup"&&<span style={{color:"#2a4a36"}}>(min. 6 caractères)</span>}</Lbl><input className="neo-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          {err&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#ff4444",letterSpacing:".1em",marginBottom:16,padding:"8px 12px",border:"1px solid #ff444433",background:"#ff444408"}}>⚠ {err}</div>}
          <button className="submit-btn full" onClick={handle} disabled={loading||!email||!pass}>
            {loading?"...":(mode==="login"?"Connexion":"Créer le compte")}
          </button>
        </div>
        <div style={{marginTop:40,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1a3d2b",letterSpacing:".3em",textAlign:"center"}}>DONNÉES SÉCURISÉES // SUPABASE</div>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EXERCISE STATS
// ══════════════════════════════════════════════════════════════════════════════
const ExStatsPage = ({exercise,sessions,onBack}) => {
  const entries  = getExEntries(sessions,exercise.id);
  const isW      = exercise.type==="weights";
  const sessWithEx= sessions.filter(s=>s.entries&&s.entries.some(e=>e.exercise_id===exercise.id)).length;
  const pctSess  = sessions.length>0?(sessWithEx/sessions.length*100):0;
  const withRes  = entries.filter(e=>e.failure!==null);
  const failPct  = withRes.length>0?(withRes.filter(e=>e.failure===true).length/withRes.length*100):0;
  const chartData= entries.map(e=>({date:e.date,y:isW?parseFloat(e.weight||0):parseFloat(e.reps||0)})).filter(d=>d.y>0);
  const first=chartData[0],last=chartData[chartData.length-1];
  const delta=first&&last?last.y-first.y:null;
  const deltaPct=first&&first.y?(delta/first.y*100):null;
  const advice=computeAdvice(entries);
  const recent=entries.slice(-5).reverse();
  const unit=isW?"kg":(entries[0]?.measure_type==="time"?"sec":"rép");
  const maxVal=chartData.length?Math.max(...chartData.map(d=>d.y)):0;

  return (
    <Shell>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 03 // STATS</SL>
      <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(18px,4vw,28px)",fontWeight:900,color:"#e0e0e0",letterSpacing:".06em",marginBottom:6,animation:"flicker 6s infinite"}}>{exercise.name}</h1>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:isW?"#4488ff77":"#00ff8877",letterSpacing:".15em"}}>{isW?"🏋️ HALTÈRES":"⚡ POIDS CORPS"}</span>
        {exercise.muscles.map(m=><span key={m} style={{fontSize:9,color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace"}}>#{m.toLowerCase()}</span>)}
      </div>
      <Div/>
      {entries.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:"#1a3d2b",fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:".2em",lineHeight:2}}>
          <div style={{fontSize:28,marginBottom:12,opacity:.3}}>◯</div>CET EXERCICE N'A PAS ENCORE ÉTÉ PRATIQUÉ
        </div>
      ):(
        <>
          {advice&&(
            <div style={{padding:"18px 20px",marginBottom:24,border:`1px solid ${advice.type==="increase"?"#00ff8855":"#ff444455"}`,background:advice.type==="increase"?"#00ff8808":"#ff444808",animation:advice.type==="increase"?"upgradePulse 2.5s infinite":"warningPulse 2.5s infinite"}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".35em",color:advice.type==="increase"?"#00ff88":"#ff6644",marginBottom:8}}>{advice.type==="increase"?"▲ AUGMENTER LA DIFFICULTÉ":"▼ RÉDUIRE LA DIFFICULTÉ"}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#e0e0e0",lineHeight:1.7,letterSpacing:".03em"}}>{advice.type==="increase"?`Tu maîtrises cet exercice ! Augmente ${isW?"la charge":"le temps ou les répétitions"}.`:`${advice.reason}. Réduis ${isW?"la charge":"le temps / les répétitions"}.`}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#3a5c47",marginTop:8,letterSpacing:".15em"}}>◈ {advice.reason.toUpperCase()}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,marginBottom:24}}>
            {[{l:isW?"Charge max":"Meilleure perf",v:`${maxVal}${unit}`,c:"#00ff88"},{l:"Taux d'échec",v:`${failPct.toFixed(0)}%`,c:failPct>30?"#ff4444":failPct>15?"#ffaa00":"#00ff88"},{l:"% des séances",v:`${pctSess.toFixed(0)}%`,c:"#8888ff"}].map((s,i)=>(
              <div key={i} style={{padding:"16px",background:"#090909",border:"1px solid #0f2d1f"}}>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"#3a5c47",letterSpacing:".2em",textTransform:"uppercase",marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>
          {chartData.length>=2&&(
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <Lbl>{isW?"Progression charge":entries[0]?.measure_type==="time"?"Progression temps":"Progression répétitions"}</Lbl>
                {delta!==null&&<div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:delta>=0?"#00ff88":"#ff4444"}}>{delta>=0?"+":""}{delta.toFixed(delta%1===0?0:1)}{unit}{deltaPct!==null&&<span style={{fontSize:9,marginLeft:6,opacity:.6}}>({deltaPct>=0?"+":""}{deltaPct.toFixed(0)}%)</span>}</div>}
              </div>
              <div style={{padding:"16px",background:"#090909",border:"1px solid #0f2d1f"}}><Sparkline data={chartData}/><div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#1e4d35"}}><span>{first?.date}</span><span>{last?.date}</span></div></div>
            </div>
          )}
          <div style={{marginBottom:24,padding:"16px",background:"#090909",border:"1px solid #0f2d1f"}}><ProgBar pct={pctSess} label={`Présent dans ${sessWithEx}/${sessions.length} séances`} color="#8888ff"/></div>
          <div style={{marginBottom:16}}>
            <Lbl>Dernières performances</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {recent.map((e,i)=>(
                <div key={i} style={{padding:"12px 14px",background:"#090909",border:"1px solid #0f2d1f",display:"flex",justifyContent:"space-between",alignItems:"center",animation:`fadeSlideUp .3s ${i*.05}s ease both`}}>
                  <div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#3a5c47",letterSpacing:".15em",marginBottom:4}}>{e.date}</div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:"#e0e0e0"}}>{e.sets}×{e.reps}{e.measure_type==="time"?"s":"rep"}{isW&&e.weight&&<span style={{color:"#4488ff",marginLeft:8}}>@ {e.weight}kg</span>}</div>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"#2a4a36",letterSpacing:".15em",marginBottom:3}}>DIFF</div>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:e.difficulty>=4?"#ffaa00":e.difficulty<=2?"#00ff88":"#e0e0e0"}}>{e.difficulty}/5</div>
                    </div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,color:e.failure?"#ff4444":"#00ff88"}}>{e.failure?"✗":"✓"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{marginTop:32,paddingTop:16,borderTop:"1px solid #0f2d1f",fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1a3d2b",letterSpacing:".3em",display:"flex",justifyContent:"space-between"}}><span>MODULE 03 — STATS</span><span>3 MODULES</span></div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESSION PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ProgressionPage = ({exercises,sessions,weeklyGoal,onSetGoal,onBack,onSelectEx,saving}) => {
  const [goalInput,setGoalInput]=useState("");
  if(weeklyGoal===null) return (
    <Shell>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 03 // PREMIER ACCÈS</SL><PT accent="OBJECTIF">MON</PT><Div/>
      <div style={{padding:"28px",border:"1px solid #00ff8822",background:"#090909",animation:"fadeSlideUp .3s ease"}}>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#3a5c47",lineHeight:1.9,marginBottom:24,letterSpacing:".04em"}}>Bienvenue dans ton espace progression.<br/>Combien de séances vises-tu par semaine ?</div>
        <Lbl>Objectif séances / semaine</Lbl>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[2,3,4,5,6,7].map(n=><button key={n} className={`toggle-btn ${goalInput===n?"active":""}`} onClick={()=>setGoalInput(n)} style={{flex:"none",width:46,padding:"11px 0",textAlign:"center"}}>{n}</button>)}
        </div>
        <div style={{marginBottom:24}}><input type="number" className="neo-input" placeholder="ou saisir un nombre..." min="1" max="14" value={goalInput} onChange={e=>setGoalInput(parseInt(e.target.value)||"")}/></div>
        <button className="submit-btn full" onClick={()=>goalInput&&onSetGoal(parseInt(goalInput))} disabled={!goalInput||saving}>{saving?"SAUVEGARDE...":"Valider mon objectif"}</button>
      </div>
    </Shell>
  );
  const mon=mondayISO(),sessWeek=sessions.filter(s=>s.date>=mon).length;
  const weekPct=Math.min((sessWeek/weeklyGoal)*100,100),goalMet=sessWeek>=weeklyGoal;
  return (
    <Shell>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 03</SL><PT accent="PROGRESSION">MA</PT><Div/>
      <div style={{padding:"20px 22px",marginBottom:28,border:`1px solid ${goalMet?"#00ff88":"#00ff8822"}`,background:goalMet?"#00ff8810":"#090909",animation:goalMet?"dayglow 2s infinite":"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".3em",color:goalMet?"#00ff88":"#3a5c47",marginBottom:8}}>{goalMet?"✦ OBJECTIF ATTEINT !":"OBJECTIF SEMAINE"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:"#e0e0e0",letterSpacing:".04em",lineHeight:1.7}}>{goalMet?`Bravo ! ${sessWeek} séance${sessWeek>1?"s":""} cette semaine.`:Math.max(weeklyGoal-sessWeek,0)===1?"Plus qu'1 séance !":` ${sessWeek} / ${weeklyGoal} séances.`}</div>
          </div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:32,fontWeight:900,color:goalMet?"#00ff88":"#e0e0e0",lineHeight:1,flexShrink:0,marginLeft:16}}>{sessWeek}<span style={{fontSize:14,color:"#3a5c47"}}>/{weeklyGoal}</span></div>
        </div>
        <ProgBar pct={weekPct} color={goalMet?"#00ff88":"#ffaa00"}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Lbl>Statistiques par exercice</Lbl>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#1e4d35",letterSpacing:".15em"}}>{exercises.length} EXERCICE{exercises.length!==1?"S":""}</span>
        </div>
        {exercises.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:"#1a3d2b",fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:".2em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◯</div>AJOUTEZ DES EXERCICES POUR<br/>ACCÉDER AUX STATISTIQUES</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {exercises.map((ex,i)=>{
              const exE=getExEntries(sessions,ex.id),sessCount=sessions.filter(s=>s.entries&&s.entries.some(e=>e.exercise_id===ex.id)).length;
              const last=exE[exE.length-1],adv=computeAdvice(exE);
              return (
                <button key={ex.id} className="ex-prog-row" onClick={()=>onSelectEx(ex)} style={{animationDelay:`${i*.04}s`,animation:`fadeSlideUp .3s ${i*.04}s ease both`}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700}}>{ex.name}</span>
                      <span style={{fontSize:8,color:ex.type==="weights"?"#4488ff55":"#00ff8855",fontFamily:"'Share Tech Mono',monospace"}}>{ex.type==="weights"?"🏋️":"⚡"}</span>
                      {adv&&<span style={{fontSize:8,padding:"1px 7px",border:`1px solid ${adv.type==="increase"?"#00ff8844":"#ff444444"}`,color:adv.type==="increase"?"#00ff88":"#ff6644",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".1em"}}>{adv.type==="increase"?"▲":"▼"}</span>}
                    </div>
                    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#2a4a36"}}>{sessCount} séance{sessCount!==1?"s":""}</span>
                      {last&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#2a4a36"}}>Dernière : {last.sets}×{last.reps}{last.measure_type==="time"?"s":"rep"}{ex.type==="weights"&&last.weight?` @ ${last.weight}kg`:""}</span>}
                    </div>
                  </div>
                  <span style={{fontSize:16,opacity:.35,marginLeft:8}}>›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <button className="ghost-btn" onClick={()=>onSetGoal(null)} style={{fontSize:10,padding:"8px 14px",letterSpacing:".15em"}}>Modifier l'objectif ({weeklyGoal}/sem)</button>
      </div>
      <div style={{marginTop:32,paddingTop:16,borderTop:"1px solid #0f2d1f",fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1a3d2b",letterSpacing:".3em",display:"flex",justifyContent:"space-between"}}><span>MODULE 03 — PROGRESSION</span><span>3 MODULES</span></div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EXERCISES PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ExercisesPage = ({exercises,onAdd,onDelete,onBack,saving}) => {
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",muscles:[],type:""});
  const [hovered,setHovered]=useState(null);
  const toggleM=m=>setForm(f=>({...f,muscles:f.muscles.includes(m)?f.muscles.filter(x=>x!==m):[...f.muscles,m]}));
  const submit=async()=>{ if(!form.name||!form.muscles.length||!form.type)return; await onAdd(form); setForm({name:"",muscles:[],type:""}); setShowForm(false); };
  const valid=form.name&&form.muscles.length>0&&form.type;
  return (
    <Shell>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 01</SL><PT accent="EXERCICES">MES</PT><Div/>
      <div style={{display:"flex",gap:1,marginBottom:28}}>
        {[{l:"Total",v:exercises.length},{l:"Poids corps",v:exercises.filter(e=>e.type==="bodyweight").length},{l:"Avec poids",v:exercises.filter(e=>e.type==="weights").length}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"12px 14px",background:"#0a0a0a",border:"1px solid #0f2d1f",borderLeft:i===0?"2px solid #00ff88":undefined}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,color:"#00ff88",fontWeight:700}}>{s.v.toString().padStart(2,"0")}</div>
            <div style={{fontSize:9,color:"#3a5c47",letterSpacing:".2em",textTransform:"uppercase",marginTop:2,fontFamily:"'Share Tech Mono',monospace"}}>{s.l}</div>
          </div>
        ))}
      </div>
      {!showForm&&<button onClick={()=>setShowForm(true)} style={{width:"100%",padding:"16px",border:"1px dashed #00ff8844",background:"transparent",color:"#00ff8877",fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".3em",cursor:"pointer",transition:"all .2s",textTransform:"uppercase",marginBottom:24,animation:"borderPulse 3s infinite"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ff88";e.currentTarget.style.color="#00ff88";e.currentTarget.style.background="#00ff8808"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#00ff8844";e.currentTarget.style.color="#00ff8877";e.currentTarget.style.background="transparent"}}>+ Nouvel exercice</button>}
      {showForm&&(
        <div style={{border:"1px solid #00ff8822",background:"#090909",padding:"24px",marginBottom:24,animation:"fadeSlideUp .25s ease"}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".4em",color:"#00ff8877",marginBottom:20}}>▸ NOUVEL EXERCICE</div>
          <div style={{marginBottom:20}}><Lbl>Nom</Lbl><input className="neo-input" placeholder="ex: SQUAT, TRACTIONS..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value.toUpperCase()}))}/></div>
          <div style={{marginBottom:20}}><Lbl>Muscles ciblés {form.muscles.length>0&&<span style={{color:"#00ff88"}}>[{form.muscles.length}]</span>}</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{MUSCLE_GROUPS.map(m=><button key={m} className={`muscle-tag ${form.muscles.includes(m)?"sel":""}`} onClick={()=>toggleM(m)}>{m}</button>)}</div></div>
          <div style={{marginBottom:24}}><Lbl>Type</Lbl><div style={{display:"flex",gap:2}}>{[{v:"bodyweight",l:"⚡ Poids de corps"},{v:"weights",l:"🏋️ Haltères / Poids"}].map(t=><button key={t.v} className={`toggle-btn ${form.type===t.v?"active":""}`} onClick={()=>setForm(f=>({...f,type:t.v}))}>{t.l}</button>)}</div></div>
          <div style={{display:"flex",gap:8}}>
            <button className="ghost-btn" onClick={()=>{setShowForm(false);setForm({name:"",muscles:[],type:""})}}>Annuler</button>
            <button className="submit-btn full" onClick={submit} disabled={!valid||saving}>{saving?"SAUVEGARDE...":"Enregistrer"}</button>
          </div>
        </div>
      )}
      {exercises.length===0&&!showForm&&<div style={{textAlign:"center",padding:"50px 20px",color:"#1a3d2b",fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:".2em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◯</div>AUCUN EXERCICE<br/>COMMENCEZ PAR EN AJOUTER UN</div>}
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {exercises.map((ex,i)=>(
          <div key={ex.id} className="ex-card" onMouseEnter={()=>setHovered(ex.id)} onMouseLeave={()=>setHovered(null)} style={{animationDelay:`${i*.05}s`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:"#e0e0e0"}}>{ex.name}</div>
                  <div style={{padding:"2px 8px",border:"1px solid",borderColor:ex.type==="bodyweight"?"#00ff8833":"#4488ff33",color:ex.type==="bodyweight"?"#00ff8877":"#4488ff77",fontSize:8,letterSpacing:".2em",fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase"}}>{ex.type==="bodyweight"?"POIDS CORPS":"HALTÈRES"}</div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ex.muscles.map(m=><span key={m} style={{fontSize:9,color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".1em"}}>#{m.toLowerCase()}</span>)}</div>
              </div>
              {hovered===ex.id&&<button onClick={()=>onDelete(ex.id)} style={{background:"transparent",border:"1px solid #3d1a1a",color:"#7a3a3a",width:26,height:26,cursor:"pointer",fontSize:11,flexShrink:0,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.background="#3d1a1a";e.currentTarget.style.color="#ff4444"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#7a3a3a"}}>✕</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:40,paddingTop:16,borderTop:"1px solid #0f2d1f",fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1a3d2b",letterSpacing:".3em",display:"flex",justifyContent:"space-between"}}><span>MODULE 01 — EXERCICES</span><span>3 MODULES</span></div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW SESSION
// ══════════════════════════════════════════════════════════════════════════════
const NewSessionPage = ({exercises,onSave,onBack,saving}) => {
  const [entries,setEntries]=useState([]);
  const [showPicker,setShowPicker]=useState(false);
  const [note,setNote]=useState("");
  const [done,setDone]=useState(false);
  const today=new Date(),dateStr=today.toISOString().slice(0,10);
  const dateLabel=today.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  const addEx=ex=>{ setEntries(p=>[...p,{id:Date.now(),exercise_id:ex.id,exercise_name:ex.name,weight:"",sets:"",reps:"",measure_type:"reps",difficulty:0,failure:null}]); setShowPicker(false); };
  const updE=(id,patch)=>setEntries(p=>p.map(e=>e.id===id?{...e,...patch}:e));
  const remE=id=>setEntries(p=>p.filter(e=>e.id!==id));
  const canSave=entries.length>0&&entries.every(e=>e.sets&&e.reps&&e.difficulty>0&&e.failure!==null);
  const usedIds=entries.map(e=>e.exercise_id);
  const save=async()=>{ await onSave({date:dateStr,note,entries}); setDone(true); setTimeout(()=>{setDone(false);onBack();},1800); };
  if(done) return <Shell><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:24,animation:"fadeSlideUp .3s ease"}}><div style={{width:64,height:64,border:"2px solid #00ff88",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 30px #00ff88",animation:"dayglow 1s infinite"}}><span style={{fontSize:28,color:"#00ff88"}}>✓</span></div><div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,color:"#00ff88",letterSpacing:".2em"}}>SÉANCE ENREGISTRÉE</div></div></Shell>;
  return (
    <Shell>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 02</SL><PT accent="SÉANCE">MA</PT>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#3a5c47",letterSpacing:".15em",marginTop:6,marginBottom:4,textTransform:"capitalize"}}>{dateLabel}</div>
      <Div/>
      {entries.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:16}}>
          {entries.map(entry=>{ const ex=exercises.find(e=>e.id===entry.exercise_id); return (
            <div key={entry.id} className="sess-ex-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#e0e0e0"}}>{ex?.name}</div>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <span style={{fontSize:9,color:ex?.type==="weights"?"#4488ff77":"#00ff8877",fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase"}}>{ex?.type==="weights"?"🏋️ HALTÈRES":"⚡ POIDS CORPS"}</span>
                  </div>
                </div>
                <button onClick={()=>remE(entry.id)} style={{background:"transparent",border:"1px solid #2a1a1a",color:"#7a3a3a",width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#3d1a1a";e.currentTarget.style.color="#ff4444"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#7a3a3a"}}>✕</button>
              </div>
              {ex?.type==="weights"&&<div style={{marginBottom:16}}><Lbl>Charge (kg)</Lbl><input type="number" className="neo-input" placeholder="ex: 20" min="0" step="0.5" value={entry.weight||""} onChange={e=>updE(entry.id,{weight:e.target.value})} style={{fontSize:16,color:"#4488ff"}}/></div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <div><Lbl>Séries</Lbl><input type="number" className="neo-input" placeholder="4" min="1" value={entry.sets||""} onChange={e=>updE(entry.id,{sets:e.target.value})}/></div>
                <div><Lbl>{entry.measure_type==="time"?"Durée (sec)":"Répétitions"}</Lbl><input type="number" className="neo-input" placeholder={entry.measure_type==="time"?"40":"20"} min="1" value={entry.reps||""} onChange={e=>updE(entry.id,{reps:e.target.value})}/></div>
              </div>
              <div style={{marginBottom:16}}><Lbl>Mesure</Lbl><div style={{display:"flex",gap:2}}>{[{v:"reps",l:"🔢 Répétitions"},{v:"time",l:"⏱ Temps"}].map(t=><button key={t.v} className={`toggle-btn ${entry.measure_type===t.v?"active":""}`} onClick={()=>updE(entry.id,{measure_type:t.v})}>{t.l}</button>)}</div></div>
              {entry.sets&&entry.reps&&<div style={{padding:"8px 12px",background:"#00ff8808",border:"1px solid #00ff8822",marginBottom:16,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ff8899"}}>▸ {entry.sets}x {entry.reps}{entry.measure_type==="time"?"s":"rep"}{ex?.type==="weights"&&entry.weight?` @ ${entry.weight}kg`:""}</div>}
              <div style={{marginBottom:16}}><Lbl>Difficulté {entry.difficulty>0&&<span style={{color:"#00ff88"}}>{entry.difficulty}/5</span>}</Lbl><div style={{display:"flex",gap:8}}>{[1,2,3,4,5].map(d=><button key={d} className={`diff-dot ${entry.difficulty>=d?"active":""}`} onClick={()=>updE(entry.id,{difficulty:d})}>{d}</button>)}</div></div>
              <div><Lbl>Résultat</Lbl><div style={{display:"flex",gap:2}}><button className={`fail-btn ${entry.failure===false?"active-success":""}`} onClick={()=>updE(entry.id,{failure:false})}>✓ Réussi</button><button className={`fail-btn ${entry.failure===true?"active-fail":""}`} onClick={()=>updE(entry.id,{failure:true})}>✗ Échec</button></div></div>
            </div>
          ); })}
        </div>
      )}
      {!showPicker&&<button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"14px",border:`1px dashed ${entries.length===0?"#00ff8844":"#0f2d1f"}`,background:"transparent",color:entries.length===0?"#00ff8877":"#3a5c47",fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".25em",cursor:"pointer",transition:"all .2s",textTransform:"uppercase",marginBottom:16}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#00ff88";e.currentTarget.style.color="#00ff88";e.currentTarget.style.background="#00ff8806"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=entries.length===0?"#00ff8844":"#0f2d1f";e.currentTarget.style.color=entries.length===0?"#00ff8877":"#3a5c47";e.currentTarget.style.background="transparent"}}>+ Ajouter un exercice</button>}
      {showPicker&&(
        <div style={{border:"1px solid #00ff8822",background:"#090909",padding:"20px",marginBottom:16,animation:"fadeSlideUp .2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".3em",color:"#00ff8877"}}>CHOISIR UN EXERCICE</div>
            <button onClick={()=>setShowPicker(false)} style={{background:"transparent",border:"none",color:"#3a5c47",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
          {exercises.length===0?<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#3a5c47",padding:"20px 0"}}>Aucun exercice dans la bibliothèque.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:2,maxHeight:280,overflowY:"auto"}}>
              {exercises.map(ex=>{ const added=usedIds.includes(ex.id); return <button key={ex.id} onClick={()=>!added&&addEx(ex)} style={{width:"100%",padding:"12px 14px",border:"1px solid",borderColor:added?"#0f2d1f":"#1a3d2b",background:added?"#0a0a0a":"transparent",color:added?"#1a3d2b":"#e0e0e0",fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".08em",cursor:added?"not-allowed":"pointer",transition:"all .15s",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseEnter={e=>{if(!added){e.currentTarget.style.borderColor="#00ff88";e.currentTarget.style.background="#00ff8806"}}} onMouseLeave={e=>{if(!added){e.currentTarget.style.borderColor="#1a3d2b";e.currentTarget.style.background="transparent"}}}><span>{ex.name}</span><span style={{fontSize:9,opacity:.6}}>{added?"AJOUTÉ":ex.type==="weights"?"🏋️":"⚡"}</span></button>; })}
            </div>
          )}
        </div>
      )}
      {entries.length>0&&<div style={{marginBottom:20}}><Lbl>Note (optionnel)</Lbl><textarea className="neo-input" rows={2} placeholder="Ressenti général..." value={note} onChange={e=>setNote(e.target.value)} style={{resize:"none",lineHeight:1.6}}/></div>}
      {entries.length>0&&!canSave&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#2a4a36",letterSpacing:".15em",marginBottom:16}}>▸ Complétez tous les champs</div>}
      {entries.length>0&&<button className="submit-btn full" onClick={save} disabled={!canSave||saving}>{saving?"SAUVEGARDE...":"Valider la séance"}</button>}
      {entries.length===0&&!showPicker&&<div style={{textAlign:"center",padding:"40px 20px",color:"#1a3d2b",fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:".2em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◇</div>AJOUTEZ AU MOINS UN EXERCICE</div>}
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
const HomePage = ({sessions,weeklyGoal,user,onNewSession,onProgression,onExercises,onLogout}) => {
  const mon=mondayISO(),sessWeek=sessions.filter(s=>s.date>=mon).length;
  const goalMet=weeklyGoal!==null&&sessWeek>=weeklyGoal;
  return (
    <Shell>
      <div style={{animation:"fadeSlideUp .4s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <SL>SPORT TRACKER // MILO</SL>
          <button onClick={onLogout} style={{background:"transparent",border:"1px solid #1a3d2b",color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".2em",cursor:"pointer",padding:"5px 10px",transition:"all .15s",textTransform:"uppercase"}} onMouseEnter={e=>{e.currentTarget.style.color="#ff4444";e.currentTarget.style.borderColor="#ff444444"}} onMouseLeave={e=>{e.currentTarget.style.color="#3a5c47";e.currentTarget.style.borderColor="#1a3d2b"}}>Déconnexion</button>
        </div>
        <PT accent="TRAINING">MON</PT>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1e4d35",letterSpacing:".15em",marginBottom:4}}>{user?.email}</div>
        <Div/>
        <div style={{display:"flex",gap:2,marginBottom:28}}>
          <div style={{flex:1,padding:"14px 16px",background:"#0a0a0a",border:"1px solid #0f2d1f",borderLeft:"2px solid #00ff88"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,color:"#00ff88",fontWeight:700}}>{sessWeek.toString().padStart(2,"0")}</div>
            <div style={{fontSize:9,color:"#3a5c47",letterSpacing:".2em",textTransform:"uppercase",marginTop:2,fontFamily:"'Share Tech Mono',monospace"}}>Cette semaine</div>
          </div>
          <div style={{flex:1,padding:"14px 16px",background:"#0a0a0a",border:"1px solid #0f2d1f"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,color:"#e0e0e0",fontWeight:700}}>{sessions.length.toString().padStart(2,"0")}</div>
            <div style={{fontSize:9,color:"#3a5c47",letterSpacing:".2em",textTransform:"uppercase",marginTop:2,fontFamily:"'Share Tech Mono',monospace"}}>Total séances</div>
          </div>
          {weeklyGoal!==null&&(
            <div style={{flex:1,padding:"14px 16px",background:goalMet?"#00ff8810":"#0a0a0a",border:`1px solid ${goalMet?"#00ff8844":"#0f2d1f"}`}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,color:goalMet?"#00ff88":"#3a5c47",fontWeight:700}}>{goalMet?"✦":`${sessWeek}/${weeklyGoal}`}</div>
              <div style={{fontSize:9,color:"#3a5c47",letterSpacing:".2em",textTransform:"uppercase",marginTop:2,fontFamily:"'Share Tech Mono',monospace"}}>{goalMet?"Objectif ✓":"Objectif"}</div>
            </div>
          )}
        </div>
        <SL>Semaine en cours</SL>
        <WeekBar sessions={sessions}/>
        <MonthCal sessions={sessions}/>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          <button className="nav-btn accent" onClick={onNewSession}>
            <span style={{fontSize:20}}>⚡</span>
            <div><div style={{color:"#00ff88",marginBottom:3}}>Enregistrer une nouvelle séance</div><div style={{fontSize:10,color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".1em"}}>LOG SESSION // AUJOURD'HUI</div></div>
          </button>
          <button className="nav-btn prog" onClick={onProgression}>
            <span style={{fontSize:20,opacity:.8}}>◈</span>
            <div><div style={{color:"#aa88ff",marginBottom:3}}>Ma progression</div><div style={{fontSize:10,color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".1em"}}>STATS // OBJECTIFS // CONSEILS{weeklyGoal===null&&<span style={{color:"#8844ff55",marginLeft:8}}>— CONFIGURER</span>}</div></div>
          </button>
          <button className="nav-btn" onClick={onExercises}>
            <span style={{fontSize:20,opacity:.5}}>◧</span>
            <div><div style={{marginBottom:3}}>Mes exercices</div><div style={{fontSize:10,color:"#3a5c47",fontFamily:"'Share Tech Mono',monospace",letterSpacing:".1em"}}>GÉRER MA BIBLIOTHÈQUE</div></div>
          </button>
        </div>
        <div style={{marginTop:40,paddingTop:16,borderTop:"1px solid #0f2d1f",fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#1a3d2b",letterSpacing:".3em",display:"flex",justifyContent:"space-between"}}><span>MODULE 00 — ACCUEIL</span><span>3 MODULES</span></div>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — données Supabase
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]           = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [page,setPage]           = useState("home");
  const [exercises,setExercises] = useState([]);
  const [sessions,setSessions]   = useState([]);
  const [weeklyGoal,setWeeklyGoal] = useState(null);
  const [selectedEx,setSelectedEx] = useState(null);
  const [saving,setSaving]       = useState(false);
  const [dataLoading,setDataLoading] = useState(false);

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); setAuthLoading(false); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{ setUser(session?.user??null); setAuthLoading(false); });
    return ()=>subscription.unsubscribe();
  },[]);

  // Load data when user logs in
  useEffect(()=>{ if(user) loadAll(); else { setExercises([]); setSessions([]); setWeeklyGoal(null); } },[user, loadAll]);

  const loadAll = async () => {
    setDataLoading(true);
    // Exercises
    const {data:exData}=await supabase.from("exercises").select("*").order("created_at");
    if(exData) setExercises(exData);
    // Sessions + entries
    const {data:sessData}=await supabase.from("sessions").select("*, entries:session_entries(*)").order("date");
    if(sessData) setSessions(sessData.map(s=>({...s,entries:s.entries||[]})));
    // Settings
    const {data:settData}=await supabase.from("user_settings").select("*").eq("user_id",user.id).single();
    if(settData) setWeeklyGoal(settData.weekly_goal);
    setDataLoading(false);
  };

  const addExercise = async (form) => {
    setSaving(true);
    const {data,error}=await supabase.from("exercises").insert({...form,user_id:user.id,muscles:form.muscles}).select().single();
    if(!error&&data) setExercises(p=>[...p,data]);
    setSaving(false);
  };

  const deleteExercise = async (id) => {
    await supabase.from("exercises").delete().eq("id",id);
    setExercises(p=>p.filter(e=>e.id!==id));
  };

  const saveSession = async ({date,note,entries}) => {
    setSaving(true);
    const {data:sess,error}=await supabase.from("sessions").insert({user_id:user.id,date,note}).select().single();
    if(!error&&sess){
      const entriesPayload=entries.map(e=>({ session_id:sess.id, exercise_id:e.exercise_id, exercise_name:e.exercise_name, weight:e.weight||null, sets:e.sets, reps:e.reps, measure_type:e.measure_type, difficulty:e.difficulty, failure:e.failure }));
      const {data:entData}=await supabase.from("session_entries").insert(entriesPayload).select();
      setSessions(p=>[...p,{...sess,entries:entData||[]}]);
    }
    setSaving(false);
  };

  const saveGoal = async (g) => {
    setSaving(true);
    if(g===null){
      await supabase.from("user_settings").delete().eq("user_id",user.id);
      setWeeklyGoal(null);
    } else {
      await supabase.from("user_settings").upsert({user_id:user.id,weekly_goal:g,updated_at:new Date().toISOString()});
      setWeeklyGoal(g);
      setPage("progression");
    }
    setSaving(false);
  };

  const logout = async () => { await supabase.auth.signOut(); setPage("home"); };

  if(authLoading) return <Loader text="INITIALISATION..."/>;
  if(!user) return <AuthPage/>;
  if(dataLoading) return <Loader text="CHARGEMENT DES DONNÉES..."/>;

  if(page==="exercises")   return <ExercisesPage exercises={exercises} onAdd={addExercise} onDelete={deleteExercise} onBack={()=>setPage("home")} saving={saving}/>;
  if(page==="new-session") return <NewSessionPage exercises={exercises} onSave={saveSession} onBack={()=>setPage("home")} saving={saving}/>;
  if(page==="ex-stats"&&selectedEx) return <ExStatsPage exercise={selectedEx} sessions={sessions} onBack={()=>setPage("progression")}/>;
  if(page==="progression") return <ProgressionPage exercises={exercises} sessions={sessions} weeklyGoal={weeklyGoal} onSetGoal={saveGoal} onBack={()=>setPage("home")} onSelectEx={ex=>{setSelectedEx(ex);setPage("ex-stats");}} saving={saving}/>;

  return <HomePage sessions={sessions} weeklyGoal={weeklyGoal} user={user} onNewSession={()=>setPage("new-session")} onProgression={()=>setPage("progression")} onExercises={()=>setPage("exercises")} onLogout={logout}/>;
}
