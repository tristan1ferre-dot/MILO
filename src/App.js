import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const MUSCLE_GROUPS = ["Pectoraux","Dos","Épaules","Biceps","Triceps","Avant-bras","Abdominaux","Obliques","Quadriceps","Ischio-jambiers","Fessiers","Mollets","Trapèzes","Lombaires"];
const DAYS_FR   = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const C = {
  bg:"#0f0f0f", bgCard:"#161616", bgCardHover:"#1c1c1c",
  border:"#1e2e24", borderHover:"#2e5040",
  green:"#00e676", greenDim:"#00e67633", greenFaint:"#00e67611", greenText:"#00c864",
  purple:"#9c6fff", blue:"#4da6ff", red:"#ff5252", redDim:"#ff525211", orange:"#ffab40",
  textPrimary:"#f0f0f0", textSecondary:"#8a9e92", textMuted:"#3a5244",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:${C.bg}; }
  @keyframes flicker { 0%,100%{opacity:1}92%{opacity:1}93%{opacity:.85}94%{opacity:1}96%{opacity:.92}97%{opacity:1} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes gridMove { 0%{background-position:0 0}100%{background-position:40px 40px} }
  @keyframes borderPulse { 0%,100%{border-color:${C.greenDim}}50%{border-color:${C.green}55} }
  @keyframes dayglow { 0%,100%{box-shadow:0 0 6px ${C.green}55}50%{box-shadow:0 0 16px ${C.green}88} }
  @keyframes warningPulse { 0%,100%{box-shadow:0 0 6px ${C.red}22}50%{box-shadow:0 0 16px ${C.red}44} }
  @keyframes upgradePulse { 0%,100%{box-shadow:0 0 6px ${C.green}22}50%{box-shadow:0 0 16px ${C.green}44} }
  @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }

  .neo-input { width:100%;background:#111;border:1px solid ${C.border};border-bottom:2px solid ${C.green}55;color:${C.green};font-family:'Share Tech Mono',monospace;font-size:16px;padding:14px 16px;outline:none;letter-spacing:.06em;transition:all .2s;border-radius:8px 8px 0 0; }
  .neo-input:focus { border-color:${C.green}88;box-shadow:0 0 16px ${C.green}12;background:#141414; }
  .neo-input::placeholder { color:${C.textMuted}; }

  .muscle-tag { cursor:pointer;padding:6px 14px;border-radius:20px;border:1px solid ${C.border};background:transparent;color:${C.textSecondary};font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.08em;transition:all .15s;text-transform:uppercase; }
  .muscle-tag:hover { border-color:${C.green};color:${C.green};background:${C.greenFaint}; }
  .muscle-tag.sel { border-color:${C.green};color:#0f0f0f;background:${C.green};font-weight:bold; }

  .submit-btn { padding:15px 20px;border:1px solid ${C.green};background:transparent;color:${C.green};font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:.2em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px; }
  .submit-btn:not(:disabled):hover { background:${C.green};color:#0f0f0f;box-shadow:0 0 24px ${C.green}44; }
  .submit-btn:disabled { border-color:${C.border};color:${C.textMuted};cursor:not-allowed; }
  .submit-btn.full { width:100%; }

  .ghost-btn { padding:12px 20px;border:1px solid ${C.border};background:transparent;color:${C.textSecondary};font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.15em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px; }
  .ghost-btn:hover { color:${C.textPrimary};border-color:${C.textSecondary}; }

  .ex-card { border:1px solid ${C.border};background:${C.bgCard};padding:18px 20px;transition:all .2s;animation:fadeSlideUp .3s ease forwards;border-radius:12px; }
  .ex-card:hover { border-color:${C.borderHover};background:${C.bgCardHover}; }

  .sess-ex-card { border:1px solid ${C.border};background:${C.bgCard};padding:22px;animation:fadeSlideUp .25s ease forwards;border-radius:12px; }

  .diff-dot { width:36px;height:36px;border-radius:50%;border:1px solid ${C.border};background:transparent;cursor:pointer;transition:all .2s;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:${C.textMuted};display:flex;align-items:center;justify-content:center; }
  .diff-dot:hover { border-color:${C.green}66;color:${C.green}; }
  .diff-dot.active { border-color:${C.green};background:${C.green};color:#0f0f0f;box-shadow:0 0 10px ${C.green}55; }

  .toggle-btn { flex:1;padding:13px;border:1px solid ${C.border};background:transparent;color:${C.textSecondary};font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.1em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px; }
  .toggle-btn:hover { border-color:${C.green}55;color:${C.green}; }
  .toggle-btn.active { border-color:${C.green};color:${C.green};background:${C.greenFaint}; }

  .fail-btn { flex:1;padding:13px;border:1px solid ${C.border};background:transparent;color:${C.textSecondary};font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.1em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px; }
  .fail-btn:hover { border-color:${C.red}55;color:${C.red}; }
  .fail-btn.active-fail { border-color:${C.red};color:${C.red};background:${C.redDim}; }
  .fail-btn.active-success { border-color:${C.green};color:${C.green};background:${C.greenFaint}; }

  .ex-prog-row { width:100%;padding:18px 20px;border:1px solid ${C.border};background:${C.bgCard};color:${C.textPrimary};font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:.05em;cursor:pointer;transition:all .2s;text-align:left;display:flex;justify-content:space-between;align-items:center;border-radius:12px; }
  .ex-prog-row:hover { border-color:${C.borderHover};background:${C.bgCardHover};color:${C.green}; }

  .bottom-nav { position:fixed;bottom:0;left:0;right:0;z-index:100;background:#111;border-top:1px solid ${C.border};display:flex;justify-content:space-around;align-items:center;padding:10px 0 22px;backdrop-filter:blur(10px); }
  .bnav-btn { display:flex;flex-direction:column;align-items:center;gap:4px;background:transparent;border:none;cursor:pointer;color:${C.textMuted};transition:all .2s;padding:6px 16px;border-radius:12px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase; }
  .bnav-btn:hover { color:${C.green}; }
  .bnav-btn.active { color:${C.green}; }
  .bnav-btn .icon { font-size:20px;line-height:1; }

  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:${C.bg}; }
  ::-webkit-scrollbar-thumb { background:${C.border};border-radius:2px; }
  ::-webkit-scrollbar-thumb:hover { background:${C.green}44; }
`;

// ── UI Primitives ──────────────────────────────────────────────────────────────
const Shell = ({children, page, onNav}) => (
  <div style={{minHeight:"100vh",background:C.bg,color:C.textPrimary,overflowX:"hidden"}}>
    <style>{GLOBAL_CSS}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.015) 3px,rgba(0,0,0,.015) 4px)"}}/>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${C.green}04 1px,transparent 1px),linear-gradient(90deg,${C.green}04 1px,transparent 1px)`,backgroundSize:"40px 40px",animation:"gridMove 12s linear infinite"}}/>
    <div style={{maxWidth:680,margin:"0 auto",padding:"32px 20px 100px",position:"relative"}}>{children}</div>
    {onNav && (
      <nav className="bottom-nav">
        {[{id:"home",icon:"🏠",label:"Accueil"},{id:"new-session",icon:"⚡",label:"Séance"},{id:"progression",icon:"◈",label:"Progression"},{id:"exercises",icon:"◧",label:"Exercices"}].map(n=>(
          <button key={n.id} className={`bnav-btn ${page===n.id?"active":""}`} onClick={()=>onNav(n.id)}>
            <span className="icon">{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </nav>
    )}
  </div>
);

const SL  = ({children}) => <div style={{fontFamily:"'Share Tech Mono',monospace",color:C.greenText,fontSize:10,letterSpacing:".4em",marginBottom:8,opacity:.7,textTransform:"uppercase"}}>{children}</div>;
const PT  = ({accent,children}) => <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(24px,5vw,36px)",fontWeight:900,letterSpacing:".04em",lineHeight:1.1,animation:"flicker 8s infinite",marginBottom:6,color:C.textPrimary}}>{children} <span style={{color:C.green,textShadow:`0 0 24px ${C.green}88`}}>{accent}</span></h1>;
const Div = () => <div style={{width:48,height:2,background:`linear-gradient(90deg,${C.green},transparent)`,marginTop:12,marginBottom:28}}/>;
const Lbl = ({children}) => <div style={{fontSize:11,letterSpacing:".2em",color:C.textSecondary,textTransform:"uppercase",marginBottom:8,fontFamily:"'Share Tech Mono',monospace"}}>{children}</div>;
const Card = ({children,style={}}) => <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px",...style}}>{children}</div>;
const StatBox = ({label,value,color=C.green}) => (
  <div style={{flex:1,padding:"16px",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,textAlign:"center"}}>
    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color,lineHeight:1}}>{value}</div>
    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textSecondary,letterSpacing:".15em",textTransform:"uppercase",marginTop:6}}>{label}</div>
  </div>
);
const Loader = ({text="CHARGEMENT..."}) => (
  <Shell>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:20}}>
      <div style={{width:40,height:40,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.green}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:C.textSecondary,letterSpacing:".3em"}}>{text}</div>
    </div>
  </Shell>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().slice(0,10);
const mondayISO = () => { const d=new Date(),dow=d.getDay(); d.setDate(d.getDate()-((dow+6)%7)); return d.toISOString().slice(0,10); };
const getExEntries = (sessions,exId) => { const r=[]; sessions.forEach(s=>s.entries&&s.entries.forEach(e=>{ if(e.exercise_id===exId) r.push({...e,date:s.date}); })); return r.sort((a,b)=>a.date.localeCompare(b.date)); };
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
const Sparkline = ({data,color=C.green}) => {
  if(!data||data.length<2) return null;
  const W=260,H=60,pad=8;
  const vals=data.map(d=>d.y),minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1;
  const pts=data.map((d,i)=>{ const x=pad+(i/(data.length-1))*(W-2*pad); const y=H-pad-((d.y-minV)/range)*(H-2*pad); return [x,y]; });
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area=path+` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#sg)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}}/>)}
    </svg>
  );
};

const ProgBar = ({pct,color=C.green,label}) => (
  <div>
    {label&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:".15em",color:C.textSecondary,textTransform:"uppercase",marginBottom:8}}>{label}</div>}
    <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,boxShadow:`0 0 8px ${color}`,borderRadius:3,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color,marginTop:6,textAlign:"right",fontWeight:700}}>{pct.toFixed(0)}%</div>
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
    <Card style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:C.textPrimary,letterSpacing:".12em",fontWeight:700}}>{MONTHS_FR[month].toUpperCase()} <span style={{color:C.textSecondary,fontWeight:400}}>{year}</span></div>
        <div style={{display:"flex",gap:8}}>
          {[{dir:-1,icon:"‹"},{dir:1,icon:"›",disabled:off===0}].map(({dir,icon,disabled})=>(
            <button key={dir} onClick={()=>!disabled&&setOff(o=>o+dir)} disabled={disabled}
              style={{background:"transparent",border:`1px solid ${disabled?C.border:C.borderHover}`,color:disabled?C.textMuted:C.textSecondary,width:30,height:30,borderRadius:6,cursor:disabled?"default":"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
              onMouseEnter={e=>{if(!disabled){e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green;}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=disabled?C.border:C.borderHover;e.currentTarget.style.color=disabled?C.textMuted:C.textSecondary;}}>{icon}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.textMuted,paddingBottom:4}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {cells.map((day,i)=>(
          <div key={i} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:day?"1px solid":"none",borderColor:day&&sessdays.has(day)?C.green:day===todayD?`${C.green}44`:C.border,background:day&&sessdays.has(day)?C.greenFaint:day===todayD?"#0a1a12":"transparent",animation:day&&sessdays.has(day)?"dayglow 2.5s infinite":"none"}}>
            {day&&<span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:sessdays.has(day)?C.green:day===todayD?C.textPrimary:C.textMuted}}>{day}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
};

const WeekBar = ({sessions}) => {
  const today=new Date(),mon=new Date(today); mon.setDate(today.getDate()-((today.getDay()+6)%7));
  const days=Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); const key=d.toISOString().slice(0,10); return {label:DAYS_FR[i],key,isToday:key===todayISO(),has:sessions.some(s=>s.date===key),num:d.getDate()}; });
  return (
    <div style={{display:"flex",gap:4,marginBottom:24}}>
      {days.map(d=>(
        <div key={d.key} style={{flex:1,padding:"10px 4px",textAlign:"center",borderRadius:10,border:"1px solid",borderColor:d.has?C.green:d.isToday?`${C.green}44`:C.border,background:d.has?C.greenFaint:d.isToday?"#0a1a12":"transparent",animation:d.has?"dayglow 2.5s infinite":"none",position:"relative"}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,textTransform:"uppercase",color:d.isToday?C.green:C.textMuted,marginBottom:6}}>{d.label}</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:d.has?C.green:d.isToday?C.textPrimary:C.textMuted}}>{d.num}</div>
          {d.has&&<div style={{width:5,height:5,borderRadius:"50%",background:C.green,margin:"5px auto 0",boxShadow:`0 0 6px ${C.green}`}}/>}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════════════════════════
const AuthPage = () => {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const handle = async () => {
    setErr(""); setLoading(true);
    if(mode==="login"){ const {error}=await supabase.auth.signInWithPassword({email,password:pass}); if(error) setErr(error.message); }
    else { const {error}=await supabase.auth.signUp({email,password:pass}); if(error) setErr(error.message); else setConfirm(true); }
    setLoading(false);
  };
  if(confirm) return (
    <Shell>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:24,animation:"fadeSlideUp .4s ease"}}>
        <div style={{width:72,height:72,border:`2px solid ${C.green}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 30px ${C.green}44`,animation:"dayglow 2s infinite"}}><span style={{fontSize:30,color:C.green}}>✓</span></div>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,color:C.green,letterSpacing:".2em"}}>COMPTE CRÉÉ !</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:C.textSecondary,textAlign:"center",lineHeight:1.8}}>Vérifie ta boîte mail<br/>et clique sur le lien de confirmation.</div>
        <button className="ghost-btn" onClick={()=>{setConfirm(false);setMode("login")}}>← Se connecter</button>
      </div>
    </Shell>
  );
  return (
    <Shell>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh",animation:"fadeSlideUp .4s ease"}}>
        <SL>SPORT TRACKER // MILO</SL><PT accent="MILO">BIENVENUE</PT><Div/>
        <Card>
          <div style={{display:"flex",gap:4,marginBottom:24}}>{[{v:"login",l:"Se connecter"},{v:"signup",l:"Créer un compte"}].map(t=><button key={t.v} className={`toggle-btn ${mode===t.v?"active":""}`} onClick={()=>{setMode(t.v);setErr("")}}>{t.l}</button>)}</div>
          <div style={{marginBottom:16}}><Lbl>Email</Lbl><input className="neo-input" type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          <div style={{marginBottom:24}}><Lbl>Mot de passe</Lbl><input className="neo-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          {err&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:C.red,marginBottom:16,padding:"10px 14px",border:`1px solid ${C.red}33`,background:C.redDim,borderRadius:8}}>⚠ {err}</div>}
          <button className="submit-btn full" onClick={handle} disabled={loading||!email||!pass}>{loading?"...":(mode==="login"?"Connexion":"Créer le compte")}</button>
        </Card>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EXERCISE STATS
// ══════════════════════════════════════════════════════════════════════════════
const ExStatsPage = ({exercise,sessions,onBack,onNav,page}) => {
  const entries=getExEntries(sessions,exercise.id);
  const isW=exercise.type==="weights";
  const sessWithEx=sessions.filter(s=>s.entries&&s.entries.some(e=>e.exercise_id===exercise.id)).length;
  const pctSess=sessions.length>0?(sessWithEx/sessions.length*100):0;
  const withRes=entries.filter(e=>e.failure!==null);
  const failPct=withRes.length>0?(withRes.filter(e=>e.failure===true).length/withRes.length*100):0;
  const chartData=entries.map(e=>({date:e.date,y:isW?parseFloat(e.weight||0):parseFloat(e.reps||0)})).filter(d=>d.y>0);
  const first=chartData[0],last=chartData[chartData.length-1];
  const delta=first&&last?last.y-first.y:null;
  const deltaPct=first&&first.y?(delta/first.y*100):null;
  const advice=computeAdvice(entries);
  const recent=entries.slice(-5).reverse();
  const unit=isW?"kg":(entries[0]?.measure_type==="time"?"sec":"rép");
  const maxVal=chartData.length?Math.max(...chartData.map(d=>d.y)):0;
  return (
    <Shell page={page} onNav={onNav}>
      <button className="ghost-btn" onClick={onBack} style={{marginBottom:24,padding:"8px 16px",fontSize:11}}>← Retour</button>
      <SL>MODULE 03 // STATS</SL>
      <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(20px,4vw,30px)",fontWeight:900,color:C.textPrimary,letterSpacing:".05em",marginBottom:8,animation:"flicker 6s infinite"}}>{exercise.name}</h1>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:isW?C.blue:C.greenText}}>{isW?"🏋️ HALTÈRES":"⚡ POIDS CORPS"}</span>
        {exercise.muscles.map(m=><span key={m} style={{fontSize:10,color:C.textMuted,fontFamily:"'Share Tech Mono',monospace"}}>#{m.toLowerCase()}</span>)}
      </div>
      <Div/>
      {entries.length===0?(
        <Card><div style={{textAlign:"center",padding:"40px 0",color:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:32,marginBottom:12,opacity:.3}}>◯</div>PAS ENCORE PRATIQUÉ</div></Card>
      ):(
        <>
          {advice&&<div style={{padding:"18px 20px",marginBottom:20,border:`1px solid ${advice.type==="increase"?C.green:C.red}55`,background:advice.type==="increase"?C.greenFaint:C.redDim,borderRadius:12,animation:advice.type==="increase"?"upgradePulse 2.5s infinite":"warningPulse 2.5s infinite"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:".25em",color:advice.type==="increase"?C.green:C.red,marginBottom:8}}>{advice.type==="increase"?"▲ AUGMENTER":"▼ RÉDUIRE"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:C.textPrimary,lineHeight:1.7}}>{advice.type==="increase"?`Tu maîtrises cet exercice ! Augmente ${isW?"la charge":"le temps ou les reps"}.`:`${advice.reason}. Réduis ${isW?"la charge":"le temps / les reps"}.`}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textSecondary,marginTop:8}}>◈ {advice.reason}</div>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
            {[{l:isW?"Charge max":"Meilleure perf",v:`${maxVal}${unit}`,c:C.green},{l:"Taux d'échec",v:`${failPct.toFixed(0)}%`,c:failPct>30?C.red:failPct>15?C.orange:C.green},{l:"% séances",v:`${pctSess.toFixed(0)}%`,c:C.purple}].map((s,i)=><StatBox key={i} label={s.l} value={s.v} color={s.c}/>)}
          </div>
          {chartData.length>=2&&<Card style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <Lbl>{isW?"Progression charge":entries[0]?.measure_type==="time"?"Progression temps":"Progression reps"}</Lbl>
              {delta!==null&&<div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:delta>=0?C.green:C.red}}>{delta>=0?"+":""}{delta.toFixed(delta%1===0?0:1)}{unit}{deltaPct!==null&&<span style={{fontSize:10,marginLeft:6,opacity:.6,fontWeight:400}}>({deltaPct>=0?"+":""}{deltaPct.toFixed(0)}%)</span>}</div>}
            </div>
            <Sparkline data={chartData}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.textMuted}}><span>{first?.date}</span><span>{last?.date}</span></div>
          </Card>}
          <Card style={{marginBottom:20}}><ProgBar pct={pctSess} label={`Présent dans ${sessWithEx} séance${sessWithEx>1?"s":""} sur ${sessions.length}`} color={C.purple}/></Card>
          <Lbl>Dernières performances</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recent.map((e,i)=>(
              <Card key={i} style={{padding:"14px 16px",animation:`fadeSlideUp .3s ${i*.05}s ease both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textMuted,marginBottom:6}}>{e.date}</div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,color:C.textPrimary,fontWeight:700}}>{e.sets}×{e.reps}{e.measure_type==="time"?"s":"rep"}{isW&&e.weight&&<span style={{color:C.blue,marginLeft:8,fontSize:13}}>@ {e.weight}kg</span>}</div>
                  </div>
                  <div style={{display:"flex",gap:14,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.textMuted,marginBottom:3}}>DIFF</div>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,color:e.difficulty>=4?C.orange:e.difficulty<=2?C.green:C.textPrimary}}>{e.difficulty}/5</div>
                    </div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:22,color:e.failure?C.red:C.green}}>{e.failure?"✗":"✓"}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESSION PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ProgressionPage = ({exercises,sessions,weeklyGoal,onSetGoal,onSelectEx,onNav,page,saving}) => {
  const [goalInput,setGoalInput]=useState("");
  if(weeklyGoal===null) return (
    <Shell page={page} onNav={onNav}>
      <SL>MODULE 03 // PREMIER ACCÈS</SL><PT accent="OBJECTIF">MON</PT><Div/>
      <Card>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:C.textSecondary,lineHeight:1.9,marginBottom:24}}>Bienvenue dans ton espace progression.<br/>Combien de séances vises-tu par semaine ?</div>
        <Lbl>Objectif séances / semaine</Lbl>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{[2,3,4,5,6,7].map(n=><button key={n} className={`toggle-btn ${goalInput===n?"active":""}`} onClick={()=>setGoalInput(n)} style={{flex:"none",width:48,padding:"12px 0",textAlign:"center"}}>{n}</button>)}</div>
        <div style={{marginBottom:24}}><input type="number" className="neo-input" placeholder="ou saisir un nombre..." min="1" max="14" value={goalInput} onChange={e=>setGoalInput(parseInt(e.target.value)||"")}/></div>
        <button className="submit-btn full" onClick={()=>goalInput&&onSetGoal(parseInt(goalInput))} disabled={!goalInput||saving}>{saving?"SAUVEGARDE...":"Valider mon objectif"}</button>
      </Card>
    </Shell>
  );
  const mon=mondayISO(),sessWeek=sessions.filter(s=>s.date>=mon).length;
  const weekPct=Math.min((sessWeek/weeklyGoal)*100,100),goalMet=sessWeek>=weeklyGoal;
  return (
    <Shell page={page} onNav={onNav}>
      <SL>MODULE 03</SL><PT accent="PROGRESSION">MA</PT><Div/>
      <div style={{padding:"20px",marginBottom:20,border:`1px solid ${goalMet?C.green:`${C.green}22`}`,background:goalMet?C.greenFaint:C.bgCard,borderRadius:12,animation:goalMet?"dayglow 2s infinite":"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:".25em",color:goalMet?C.green:C.textSecondary,marginBottom:8}}>{goalMet?"✦ OBJECTIF ATTEINT !":"OBJECTIF SEMAINE"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:C.textPrimary,lineHeight:1.7}}>{goalMet?`Bravo ! ${sessWeek} séance${sessWeek>1?"s":""} cette semaine.`:Math.max(weeklyGoal-sessWeek,0)===1?"Plus qu'1 séance !":`${sessWeek} / ${weeklyGoal} séances réalisées.`}</div>
          </div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:goalMet?C.green:C.textPrimary,lineHeight:1,flexShrink:0,marginLeft:16}}>{sessWeek}<span style={{fontSize:16,color:C.textSecondary,fontWeight:400}}>/{weeklyGoal}</span></div>
        </div>
        <ProgBar pct={weekPct} color={goalMet?C.green:C.orange}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <Lbl>Statistiques par exercice</Lbl>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textMuted}}>{exercises.length} exercice{exercises.length!==1?"s":""}</span>
      </div>
      {exercises.length===0?(
        <Card><div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◯</div>AJOUTEZ DES EXERCICES</div></Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {exercises.map((ex,i)=>{
            const exE=getExEntries(sessions,ex.id),sessCount=sessions.filter(s=>s.entries&&s.entries.some(e=>e.exercise_id===ex.id)).length;
            const last=exE[exE.length-1],adv=computeAdvice(exE);
            return (
              <button key={ex.id} className="ex-prog-row" onClick={()=>onSelectEx(ex)} style={{animation:`fadeSlideUp .3s ${i*.04}s ease both`}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700}}>{ex.name}</span>
                    <span style={{fontSize:10,color:ex.type==="weights"?C.blue:C.greenText}}>{ex.type==="weights"?"🏋️":"⚡"}</span>
                    {adv&&<span style={{fontSize:9,padding:"2px 8px",border:`1px solid ${adv.type==="increase"?C.green:C.red}55`,color:adv.type==="increase"?C.green:C.red,fontFamily:"'Share Tech Mono',monospace",borderRadius:10}}>{adv.type==="increase"?"▲":"▼"}</span>}
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textMuted}}>{sessCount} séance{sessCount!==1?"s":""}</span>
                    {last&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textMuted}}>Dernière : {last.sets}×{last.reps}{last.measure_type==="time"?"s":"rep"}{ex.type==="weights"&&last.weight?` @ ${last.weight}kg`:""}</span>}
                  </div>
                </div>
                <span style={{fontSize:18,color:C.textMuted,marginLeft:8}}>›</span>
              </button>
            );
          })}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <button className="ghost-btn" onClick={()=>onSetGoal(null)} style={{fontSize:10,padding:"8px 14px"}}>Modifier l'objectif ({weeklyGoal}/sem)</button>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EXERCISES PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ExercisesPage = ({exercises,onAdd,onDelete,onNav,page,saving}) => {
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",muscles:[],type:""});
  const [hovered,setHovered]=useState(null);
  const toggleM=m=>setForm(f=>({...f,muscles:f.muscles.includes(m)?f.muscles.filter(x=>x!==m):[...f.muscles,m]}));
  const submit=async()=>{ if(!form.name||!form.muscles.length||!form.type)return; await onAdd(form); setForm({name:"",muscles:[],type:""}); setShowForm(false); };
  const valid=form.name&&form.muscles.length>0&&form.type;
  return (
    <Shell page={page} onNav={onNav}>
      <SL>MODULE 01</SL><PT accent="EXERCICES">MES</PT><Div/>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[{l:"Total",v:exercises.length,c:C.green},{l:"Poids corps",v:exercises.filter(e=>e.type==="bodyweight").length,c:C.greenText},{l:"Avec poids",v:exercises.filter(e=>e.type==="weights").length,c:C.blue}].map((s,i)=><StatBox key={i} label={s.l} value={s.v.toString().padStart(2,"0")} color={s.c}/>)}
      </div>
      {!showForm&&<button onClick={()=>setShowForm(true)} style={{width:"100%",padding:"16px",border:`1px dashed ${C.green}44`,background:"transparent",color:`${C.green}88`,fontFamily:"'Share Tech Mono',monospace",fontSize:13,letterSpacing:".2em",cursor:"pointer",transition:"all .2s",textTransform:"uppercase",marginBottom:20,borderRadius:12}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green;e.currentTarget.style.background=C.greenFaint;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.green}44`;e.currentTarget.style.color=`${C.green}88`;e.currentTarget.style.background="transparent";}}>+ Nouvel exercice</button>}
      {showForm&&(
        <Card style={{marginBottom:20}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".35em",color:C.greenText,marginBottom:20}}>▸ NOUVEL EXERCICE</div>
          <div style={{marginBottom:18}}><Lbl>Nom de l'exercice</Lbl><input className="neo-input" placeholder="ex: SQUAT, TRACTIONS..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value.toUpperCase()}))}/></div>
          <div style={{marginBottom:18}}><Lbl>Muscles ciblés {form.muscles.length>0&&<span style={{color:C.green}}>({form.muscles.length} sélectionné{form.muscles.length>1?"s":""})</span>}</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{MUSCLE_GROUPS.map(m=><button key={m} className={`muscle-tag ${form.muscles.includes(m)?"sel":""}`} onClick={()=>toggleM(m)}>{m}</button>)}</div></div>
          <div style={{marginBottom:24}}><Lbl>Type d'exercice</Lbl><div style={{display:"flex",gap:8}}>{[{v:"bodyweight",l:"⚡ Poids de corps"},{v:"weights",l:"🏋️ Haltères / Poids"}].map(t=><button key={t.v} className={`toggle-btn ${form.type===t.v?"active":""}`} onClick={()=>setForm(f=>({...f,type:t.v}))}>{t.l}</button>)}</div></div>
          <div style={{display:"flex",gap:8}}>
            <button className="ghost-btn" onClick={()=>{setShowForm(false);setForm({name:"",muscles:[],type:""})}}>Annuler</button>
            <button className="submit-btn full" onClick={submit} disabled={!valid||saving}>{saving?"SAUVEGARDE...":"Enregistrer"}</button>
          </div>
        </Card>
      )}
      {exercises.length===0&&!showForm&&<Card><div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:32,marginBottom:12,opacity:.3}}>◯</div>AUCUN EXERCICE</div></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {exercises.map((ex,i)=>(
          <div key={ex.id} className="ex-card" onMouseEnter={()=>setHovered(ex.id)} onMouseLeave={()=>setHovered(null)} style={{animationDelay:`${i*.05}s`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,color:C.textPrimary}}>{ex.name}</div>
                  <div style={{padding:"3px 10px",border:"1px solid",borderColor:ex.type==="bodyweight"?`${C.green}44`:`${C.blue}44`,color:ex.type==="bodyweight"?C.greenText:C.blue,fontSize:9,letterSpacing:".15em",fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase",borderRadius:20}}>{ex.type==="bodyweight"?"POIDS CORPS":"HALTÈRES"}</div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ex.muscles.map(m=><span key={m} style={{fontSize:10,color:C.textSecondary,fontFamily:"'Share Tech Mono',monospace"}}>#{m.toLowerCase()}</span>)}</div>
              </div>
              {hovered===ex.id&&<button onClick={()=>onDelete(ex.id)} style={{background:"transparent",border:`1px solid ${C.red}33`,color:`${C.red}66`,width:28,height:28,borderRadius:6,cursor:"pointer",fontSize:12,flexShrink:0,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.background=C.redDim;e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor=C.red;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=`${C.red}66`;e.currentTarget.style.borderColor=`${C.red}33`;}}>✕</button>}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NEW SESSION
// ══════════════════════════════════════════════════════════════════════════════
const NewSessionPage = ({exercises,onSave,onNav,page,saving}) => {
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
  const save=async()=>{ await onSave({date:dateStr,note,entries}); setDone(true); setTimeout(()=>{setDone(false);onNav("home");},1800); };
  if(done) return <Shell page={page} onNav={onNav}><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:24,animation:"fadeSlideUp .3s ease"}}><div style={{width:72,height:72,border:`2px solid ${C.green}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 30px ${C.green}44`,animation:"dayglow 1s infinite"}}><span style={{fontSize:30,color:C.green}}>✓</span></div><div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,color:C.green,letterSpacing:".2em"}}>SÉANCE ENREGISTRÉE</div></div></Shell>;
  return (
    <Shell page={page} onNav={onNav}>
      <SL>MODULE 02</SL><PT accent="SÉANCE">MA</PT>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:C.textSecondary,letterSpacing:".1em",marginTop:6,marginBottom:4,textTransform:"capitalize"}}>{dateLabel}</div>
      <Div/>
      {entries.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          {entries.map(entry=>{ const ex=exercises.find(e=>e.id===entry.exercise_id); return (
            <Card key={entry.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,color:C.textPrimary,marginBottom:6}}>{ex?.name}</div>
                  <span style={{fontSize:10,color:ex?.type==="weights"?C.blue:C.greenText,fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase"}}>{ex?.type==="weights"?"🏋️ HALTÈRES":"⚡ POIDS CORPS"}</span>
                </div>
                <button onClick={()=>remE(entry.id)} style={{background:"transparent",border:`1px solid ${C.red}33`,color:`${C.red}66`,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.redDim;e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor=C.red;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=`${C.red}66`;e.currentTarget.style.borderColor=`${C.red}33`;}}>✕</button>
              </div>
              {ex?.type==="weights"&&<div style={{marginBottom:16}}><Lbl>Charge (kg)</Lbl><input type="number" className="neo-input" placeholder="ex: 20" min="0" step="0.5" value={entry.weight||""} onChange={e=>updE(entry.id,{weight:e.target.value})} style={{fontSize:17,color:C.blue}}/></div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><Lbl>Séries</Lbl><input type="number" className="neo-input" placeholder="4" min="1" value={entry.sets||""} onChange={e=>updE(entry.id,{sets:e.target.value})}/></div>
                <div><Lbl>{entry.measure_type==="time"?"Durée (sec)":"Répétitions"}</Lbl><input type="number" className="neo-input" placeholder={entry.measure_type==="time"?"40":"20"} min="1" value={entry.reps||""} onChange={e=>updE(entry.id,{reps:e.target.value})}/></div>
              </div>
              <div style={{marginBottom:16}}><Lbl>Mesure</Lbl><div style={{display:"flex",gap:8}}>{[{v:"reps",l:"🔢 Répétitions"},{v:"time",l:"⏱ Temps"}].map(t=><button key={t.v} className={`toggle-btn ${entry.measure_type===t.v?"active":""}`} onClick={()=>updE(entry.id,{measure_type:t.v})}>{t.l}</button>)}</div></div>
              {entry.sets&&entry.reps&&<div style={{padding:"10px 14px",background:C.greenFaint,border:`1px solid ${C.green}33`,borderRadius:8,marginBottom:16,fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:C.greenText}}>▸ {entry.sets}x {entry.reps}{entry.measure_type==="time"?"s":"rep"}{ex?.type==="weights"&&entry.weight?` @ ${entry.weight}kg`:""}</div>}
              <div style={{marginBottom:16}}><Lbl>Difficulté {entry.difficulty>0&&<span style={{color:C.green}}>({entry.difficulty}/5)</span>}</Lbl><div style={{display:"flex",gap:8}}>{[1,2,3,4,5].map(d=><button key={d} className={`diff-dot ${entry.difficulty>=d?"active":""}`} onClick={()=>updE(entry.id,{difficulty:d})}>{d}</button>)}</div></div>
              <div><Lbl>Résultat</Lbl><div style={{display:"flex",gap:8}}><button className={`fail-btn ${entry.failure===false?"active-success":""}`} onClick={()=>updE(entry.id,{failure:false})}>✓ Réussi</button><button className={`fail-btn ${entry.failure===true?"active-fail":""}`} onClick={()=>updE(entry.id,{failure:true})}>✗ Échec</button></div></div>
            </Card>
          ); })}
        </div>
      )}
      {!showPicker&&<button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"15px",border:`1px dashed ${entries.length===0?`${C.green}44`:C.border}`,background:"transparent",color:entries.length===0?`${C.green}88`:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:13,letterSpacing:".18em",cursor:"pointer",transition:"all .2s",textTransform:"uppercase",marginBottom:16,borderRadius:12}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green;e.currentTarget.style.background=C.greenFaint;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=entries.length===0?`${C.green}44`:C.border;e.currentTarget.style.color=entries.length===0?`${C.green}88`:C.textMuted;e.currentTarget.style.background="transparent";}}>+ Ajouter un exercice</button>}
      {showPicker&&(
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".3em",color:C.greenText}}>CHOISIR UN EXERCICE</div>
            <button onClick={()=>setShowPicker(false)} style={{background:"transparent",border:"none",color:C.textSecondary,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
          {exercises.length===0?<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:C.textMuted,padding:"16px 0"}}>Aucun exercice dans la bibliothèque.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto"}}>
              {exercises.map(ex=>{ const added=usedIds.includes(ex.id); return <button key={ex.id} onClick={()=>!added&&addEx(ex)} style={{width:"100%",padding:"13px 16px",border:`1px solid ${added?C.border:C.borderHover}`,background:"transparent",color:added?C.textMuted:C.textPrimary,fontFamily:"'Share Tech Mono',monospace",fontSize:13,letterSpacing:".06em",cursor:added?"not-allowed":"pointer",transition:"all .15s",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:8}} onMouseEnter={e=>{if(!added){e.currentTarget.style.borderColor=C.green;e.currentTarget.style.background=C.greenFaint;e.currentTarget.style.color=C.green;}}} onMouseLeave={e=>{if(!added){e.currentTarget.style.borderColor=C.borderHover;e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textPrimary;}}}><span>{ex.name}</span><span style={{fontSize:10,opacity:.7}}>{added?"✓ Ajouté":ex.type==="weights"?"🏋️":"⚡"}</span></button>; })}
            </div>
          )}
        </Card>
      )}
      {entries.length>0&&<div style={{marginBottom:16}}><Lbl>Note de séance (optionnel)</Lbl><textarea className="neo-input" rows={2} placeholder="Ressenti général, conditions..." value={note} onChange={e=>setNote(e.target.value)} style={{resize:"none",lineHeight:1.7}}/></div>}
      {entries.length>0&&!canSave&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textMuted,letterSpacing:".12em",marginBottom:16}}>▸ Complétez tous les champs pour valider</div>}
      {entries.length>0&&<button className="submit-btn full" onClick={save} disabled={!canSave||saving}>{saving?"SAUVEGARDE...":"Valider la séance"}</button>}
      {entries.length===0&&!showPicker&&<Card><div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:32,marginBottom:12,opacity:.3}}>◇</div>AJOUTEZ AU MOINS UN EXERCICE</div></Card>}
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
const HomePage = ({sessions,weeklyGoal,user,onNav,page,onLogout}) => {
  const mon=mondayISO(),sessWeek=sessions.filter(s=>s.date>=mon).length;
  const goalMet=weeklyGoal!==null&&sessWeek>=weeklyGoal;
  return (
    <Shell page={page} onNav={onNav}>
      <div style={{animation:"fadeSlideUp .4s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <SL>SPORT TRACKER // MILO</SL>
          <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".15em",cursor:"pointer",padding:"5px 10px",transition:"all .15s",textTransform:"uppercase",borderRadius:6}} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor=`${C.red}44`;}} onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.borderColor=C.border;}}>Déconnexion</button>
        </div>
        <PT accent="TRAINING">MON</PT>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textMuted,letterSpacing:".12em",marginBottom:4}}>{user?.email}</div>
        <Div/>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          <StatBox label="Cette semaine" value={sessWeek.toString().padStart(2,"0")} color={C.green}/>
          <StatBox label="Total séances" value={sessions.length.toString().padStart(2,"0")} color={C.textSecondary}/>
          {weeklyGoal!==null&&<StatBox label={goalMet?"Objectif ✓":"Objectif"} value={goalMet?"✦":`${sessWeek}/${weeklyGoal}`} color={goalMet?C.green:C.textSecondary}/>}
        </div>
        <SL>Semaine en cours</SL>
        <WeekBar sessions={sessions}/>
        <MonthCal sessions={sessions}/>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]               = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [page,setPage]               = useState("home");
  const [exercises,setExercises]     = useState([]);
  const [sessions,setSessions]       = useState([]);
  const [weeklyGoal,setWeeklyGoal]   = useState(null);
  const [selectedEx,setSelectedEx]   = useState(null);
  const [saving,setSaving]           = useState(false);
  const [dataLoading,setDataLoading] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); setAuthLoading(false); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{ setUser(session?.user??null); setAuthLoading(false); });
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{ if(user) loadAll(); else { setExercises([]); setSessions([]); setWeeklyGoal(null); } },[user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setDataLoading(true);
    const {data:exData}=await supabase.from("exercises").select("*").order("created_at"); if(exData) setExercises(exData);
    const {data:sessData}=await supabase.from("sessions").select("*, entries:session_entries(*)").order("date"); if(sessData) setSessions(sessData.map(s=>({...s,entries:s.entries||[]})));
    const {data:settData}=await supabase.from("user_settings").select("*").eq("user_id",user.id).single(); if(settData) setWeeklyGoal(settData.weekly_goal);
    setDataLoading(false);
  };

  const addExercise    = async (form) => { setSaving(true); const {data,error}=await supabase.from("exercises").insert({...form,user_id:user.id}).select().single(); if(!error&&data) setExercises(p=>[...p,data]); setSaving(false); };
  const deleteExercise = async (id)   => { await supabase.from("exercises").delete().eq("id",id); setExercises(p=>p.filter(e=>e.id!==id)); };
  const saveSession    = async ({date,note,entries}) => {
    setSaving(true);
    const {data:sess,error}=await supabase.from("sessions").insert({user_id:user.id,date,note}).select().single();
    if(!error&&sess){ const ep=entries.map(e=>({session_id:sess.id,exercise_id:e.exercise_id,exercise_name:e.exercise_name,weight:e.weight||null,sets:e.sets,reps:e.reps,measure_type:e.measure_type,difficulty:e.difficulty,failure:e.failure})); const {data:ed}=await supabase.from("session_entries").insert(ep).select(); setSessions(p=>[...p,{...sess,entries:ed||[]}]); }
    setSaving(false);
  };
  const saveGoal = async (g) => {
    setSaving(true);
    if(g===null){ await supabase.from("user_settings").delete().eq("user_id",user.id); setWeeklyGoal(null); }
    else { await supabase.from("user_settings").upsert({user_id:user.id,weekly_goal:g,updated_at:new Date().toISOString()}); setWeeklyGoal(g); setPage("progression"); }
    setSaving(false);
  };
  const logout = async () => { await supabase.auth.signOut(); setPage("home"); };
  const handleNav = (p) => { setPage(p); };

  if(authLoading)  return <Loader text="INITIALISATION..."/>;
  if(!user)        return <AuthPage/>;
  if(dataLoading)  return <Loader text="CHARGEMENT..."/>;

  if(page==="ex-stats"&&selectedEx) return <ExStatsPage exercise={selectedEx} sessions={sessions} onBack={()=>setPage("progression")} onNav={handleNav} page={page}/>;
  if(page==="exercises")   return <ExercisesPage exercises={exercises} onAdd={addExercise} onDelete={deleteExercise} onNav={handleNav} page={page} saving={saving}/>;
  if(page==="new-session") return <NewSessionPage exercises={exercises} onSave={saveSession} onNav={handleNav} page={page} saving={saving}/>;
  if(page==="progression") return <ProgressionPage exercises={exercises} sessions={sessions} weeklyGoal={weeklyGoal} onSetGoal={saveGoal} onSelectEx={ex=>{setSelectedEx(ex);setPage("ex-stats");}} onNav={handleNav} page={page} saving={saving}/>;
  return <HomePage sessions={sessions} weeklyGoal={weeklyGoal} user={user} onNav={handleNav} page={page} onLogout={logout}/>;
}
