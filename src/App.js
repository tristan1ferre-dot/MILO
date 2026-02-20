import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── Constants ────────────────────────────────────────────────────────────────
const MUSCLE_GROUPS = ["Abdominaux","Avant-bras","Biceps","Dos","Épaules","Fessiers","Ischio-jambiers","Lombaires","Mollets","Obliques","Pectoraux","Quadriceps","Trapèzes","Triceps"];
const DAYS_FR   = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// ── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:"#0f0f0f", bgCard:"#161616", bgCardHover:"#1c1c1c",
    border:"#1e2e24", borderHover:"#2e5040",
    green:"#00e676", greenDim:"#00e67633", greenFaint:"#00e67611", greenText:"#00c864",
    blue:"#4da6ff", blueDim:"#4da6ff18",
    red:"#ff5252", redDim:"#ff525211",
    orange:"#ffab40", orangeDim:"#ffab4018",
    purple:"#9c6fff", purpleDim:"#9c6fff18",
    textPrimary:"#f0f0f0", textSecondary:"#8a9e92", textMuted:"#3a5244",
    gridColor:"#00e67604",
    navBg:"rgba(22,22,22,.82)", navBorder:"rgba(255,255,255,.07)",
    navShadow:"0 8px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.1),inset 0 -1px 0 rgba(0,0,0,.1)",
    scanlines:true,
  },
  light: {
    bg:"#f5f5f5", bgCard:"#ffffff", bgCardHover:"#f0f0f0",
    border:"#d0d0d0", borderHover:"#aaaaaa",
    green:"#00e676", greenDim:"#00e67633", greenFaint:"#00e67611", greenText:"#00c864",
    blue:"#4da6ff", blueDim:"#4da6ff18",
    red:"#ff5252", redDim:"#ff525211",
    orange:"#ffab40", orangeDim:"#ffab4018",
    purple:"#9c6fff", purpleDim:"#9c6fff18",
    textPrimary:"#111111", textSecondary:"#555555", textMuted:"#aaaaaa",
    gridColor:"#00000005",
    navBg:"rgba(240,240,240,.82)", navBorder:"rgba(0,0,0,.08)",
    navShadow:"0 8px 32px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.7),inset 0 -1px 0 rgba(0,0,0,.04)",
    scanlines:false,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().slice(0,10);
const mondayISO = () => { const d=new Date(),dow=d.getDay(); d.setDate(d.getDate()-((dow+6)%7)); return d.toISOString().slice(0,10); };
const sortAlpha = (arr) => [...arr].sort((a,b)=>a.name.localeCompare(b.name,"fr"));

const getExEntries = (sessions, exId) => {
  const r=[];
  sessions.forEach(s=>s.entries&&s.entries.forEach(e=>{ if(e.exercise_id===exId) r.push({...e,date:s.date}); }));
  return r.sort((a,b)=>a.date.localeCompare(b.date));
};

const computeAdvice = (entries) => {
  if(entries.length<2) return null;
  const last3=entries.slice(-3), last2=entries.slice(-2);
  if(last2.filter(e=>e.failure===true).length>=2) return {type:"reduce",reason:"2 échecs récents"};
  if(last3.length===3&&last3.every(e=>e.difficulty===5)) return {type:"reduce",reason:"Difficulté max 3× de suite"};
  if(last2.some(e=>e.difficulty===1)) return {type:"increase",reason:"Difficulté très faible"};
  if(last2.length===2&&last2.every(e=>e.difficulty<=2)) return {type:"increase",reason:"Très facile 2× de suite"};
  return null;
};



// Compute weekly streak
const computeStreak = (sessions) => {
  let streak=0;
  const d=new Date();
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  for(let i=0;i<52;i++){
    const mon=new Date(d); mon.setDate(d.getDate()-i*7);
    const sun=new Date(mon); sun.setDate(mon.getDate()+6);
    const monISO=mon.toISOString().slice(0,10);
    const sunISO=sun.toISOString().slice(0,10);
    const count=sessions.filter(s=>s.date>=monISO&&s.date<=sunISO).length;
    if(i===0&&count===0) continue; // current week may not be done
    if(count>0) streak++;
    else break;
  }
  return streak;
};

// Predict next session day based on past habits
const predictNextSession = (sessions) => {
  if(sessions.length<3) return null;
  const dayCounts=[0,0,0,0,0,0,0];
  sessions.slice(-20).forEach(s=>{
    const day=(new Date(s.date).getDay()+6)%7;
    dayCounts[day]++;
  });
  const todayDow=(new Date().getDay()+6)%7;
  for(let i=1;i<=7;i++){
    const dow=(todayDow+i)%7;
    if(dayCounts[dow]>0){
      const next=new Date(); next.setDate(next.getDate()+i);
      return { label:["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"][dow], date:next.toLocaleDateString("fr-FR",{day:"numeric",month:"short"}), inDays:i };
    }
  }
  return null;
};

// Contextual message
const getContextualMessage = (sessions, weeklyGoal, streak) => {
  const mon=mondayISO();
  const sessWeek=sessions.filter(s=>s.date>=mon).length;
  const lastSess=sessions.length>0?sessions[sessions.length-1]:null;
  const daysSinceLast=lastSess?(new Date()-new Date(lastSess.date))/(1000*60*60*24):99;

  if(weeklyGoal!==null&&sessWeek>=weeklyGoal&&streak>=3)
    return {icon:"🔥",title:"EN FEU !",text:`${streak} semaines d'affilée avec ton objectif atteint. Continue comme ça !`};
  if(weeklyGoal!==null&&sessWeek>=weeklyGoal)
    return {icon:"🎯",title:"OBJECTIF ATTEINT",text:`${sessWeek} séances cette semaine, bien joué ! Prends soin de ta récupération.`};
  if(daysSinceLast>4)
    return {icon:"⚡",title:"IL EST TEMPS",text:`${Math.floor(daysSinceLast)} jours sans séance. Ton corps est prêt, c'est le moment !`};
  if(weeklyGoal!==null&&sessWeek>0){
    const remaining=weeklyGoal-sessWeek;
    return {icon:"💪",title:"EN BONNE VOIE",text:`${sessWeek}/${weeklyGoal} séances cette semaine. Plus que ${remaining} pour l'objectif !`};
  }
  if(sessions.length===0)
    return {icon:"🚀",title:"BIENVENUE",text:`Enregistre ta première séance pour commencer à suivre ta progression.`};
  return {icon:"📈",title:"BONNE DYNAMIQUE",text:`${sessions.length} séances au total. Tu construis quelque chose de solide.`};
};

// ── Global CSS (theme-aware via CSS vars) ────────────────────────────────────
const buildCSS = (t) => `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${t.bg}; color:${t.textPrimary}; font-family:'Share Tech Mono',monospace; transition:background .35s,color .35s; }

  @keyframes flicker{0%,100%{opacity:1}93%{opacity:.85}96%{opacity:.92}}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes gridMove{0%{background-position:0 0}100%{background-position:40px 40px}}
  @keyframes dayglow{0%,100%{box-shadow:0 0 6px ${t.green}55}50%{box-shadow:0 0 14px ${t.green}88}}
  @keyframes streakGlow{0%,100%{box-shadow:0 0 6px ${t.orange}33}50%{box-shadow:0 0 18px ${t.orange}66}}
  @keyframes borderPulse{0%,100%{border-color:${t.greenDim}}50%{border-color:${t.green}55}}
  @keyframes warningPulse{0%,100%{box-shadow:0 0 6px ${t.red}22}50%{box-shadow:0 0 16px ${t.red}44}}
  @keyframes upgradePulse{0%,100%{box-shadow:0 0 6px ${t.green}22}50%{box-shadow:0 0 16px ${t.green}44}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes sessionSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}

  .neo-input{width:100%;background:${t.bgCard};border:1px solid ${t.border};border-bottom:2px solid ${t.green}66;color:${t.textPrimary};font-family:'Share Tech Mono',monospace;font-size:16px;padding:14px 16px;outline:none;letter-spacing:.06em;transition:all .2s;border-radius:8px 8px 0 0;}
  .neo-input:focus{border-color:${t.green}88;background:${t.bgCardHover};}
  .neo-input::placeholder{color:${t.textMuted};}

  .muscle-tag{cursor:pointer;padding:6px 14px;border-radius:20px;border:1px solid ${t.border};background:transparent;color:${t.textSecondary};font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.08em;transition:all .15s;text-transform:uppercase;}
  .muscle-tag:hover{border-color:${t.green};color:${t.green};background:${t.greenFaint};}
  .muscle-tag.sel{border-color:${t.green};color:${t.bg};background:${t.green};font-weight:bold;}

  .submit-btn{padding:15px 20px;border:1px solid ${t.green};background:transparent;color:${t.green};font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:.2em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px;}
  .submit-btn:not(:disabled):hover{background:${t.green};color:${t.bg};box-shadow:0 0 24px ${t.green}44;}
  .submit-btn:disabled{border-color:${t.border};color:${t.textMuted};cursor:not-allowed;}
  .submit-btn.full{width:100%;}

  .ghost-btn{padding:10px 18px;border:1px solid ${t.border};background:transparent;color:${t.textSecondary};font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.15em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px;}
  .ghost-btn:hover{color:${t.textPrimary};border-color:${t.textSecondary};}

  .toggle-btn{flex:1;padding:12px;border:1px solid ${t.border};background:transparent;color:${t.textSecondary};font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.08em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px;}
  .toggle-btn:hover{border-color:${t.green}55;color:${t.green};}
  .toggle-btn.active{border-color:${t.green};color:${t.green};background:${t.greenFaint};}

  .fail-btn{flex:1;padding:12px;border:1px solid ${t.border};background:transparent;color:${t.textSecondary};font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.08em;cursor:pointer;transition:all .2s;text-transform:uppercase;border-radius:8px;}
  .fail-btn:hover{border-color:${t.red}55;color:${t.red};}
  .fail-btn.active-fail{border-color:${t.red};color:${t.red};background:${t.redDim};}
  .fail-btn.active-success{border-color:${t.green};color:${t.green};background:${t.greenFaint};}

  .diff-dot{width:36px;height:36px;border-radius:50%;border:1px solid ${t.border};background:transparent;cursor:pointer;transition:all .2s;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:${t.textMuted};display:inline-flex;align-items:center;justify-content:center;margin-right:4px;}
  .diff-dot:hover{border-color:${t.green}66;color:${t.green};}
  .diff-dot.active{border-color:${t.green};background:${t.green};color:${t.bg};box-shadow:0 0 10px ${t.green}55;}

  .ex-card{border:1px solid ${t.border};background:${t.bgCard};padding:18px 20px;transition:all .2s;animation:fadeSlideUp .3s ease forwards;border-radius:12px;}
  .ex-card:hover{border-color:${t.borderHover};background:${t.bgCardHover};}

  .ex-prog-row{width:100%;padding:16px 18px;border:1px solid ${t.border};background:${t.bgCard};color:${t.textPrimary};font-family:'Share Tech Mono',monospace;font-size:13px;cursor:pointer;transition:all .2s;text-align:left;display:flex;justify-content:space-between;align-items:center;border-radius:12px;}
  .ex-prog-row:hover{border-color:${t.borderHover};background:${t.bgCardHover};color:${t.green};}

  .settings-btn{background:transparent;border:1px solid ${t.border};color:${t.textSecondary};cursor:pointer;padding:0;transition:all .3s;border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;}
  .settings-btn:hover{color:${t.green};border-color:${t.green};}
  .settings-btn svg{transition:transform .4s;}
  .settings-btn:hover svg{transform:rotate(60deg);}

  .bottom-nav{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100;display:flex;gap:2px;padding:7px 8px;border-radius:28px;min-width:260px;justify-content:space-around;background:${t.navBg};backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid ${t.navBorder};box-shadow:${t.navShadow};}
  .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:4px;background:transparent;border:none;cursor:pointer;color:${t.textMuted};transition:all .25s;padding:8px 22px;border-radius:22px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;}
  .bnav-btn svg{transition:all .25s;}
  .bnav-btn:hover{color:${t.green};}
  .bnav-btn:hover svg{transform:scale(1.1);}
  .bnav-btn.active{color:${t.green};background:${t.green}12;box-shadow:inset 0 1px 0 rgba(255,255,255,.07);}

  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:${t.bg};}
  ::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px;}
`;

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconHome    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconActivity= () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconUser    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconGear    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IconLogout  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconBack    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconClose   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconChevron = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
const IconBolt    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconCalendar= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconMoon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const IconSun     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;

// ── Primitives ───────────────────────────────────────────────────────────────
const SL  = ({t,children}) => <div style={{fontFamily:"'Share Tech Mono',monospace",color:t.greenText,fontSize:10,letterSpacing:".4em",marginBottom:8,opacity:.75,textTransform:"uppercase"}}>{children}</div>;
const PT  = ({t,accent,children}) => <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(22px,5vw,32px)",fontWeight:900,letterSpacing:".04em",lineHeight:1.1,animation:"flicker 8s infinite",marginBottom:6,color:t.textPrimary}}>{children} <span style={{color:t.green,textShadow:`0 0 24px ${t.greenDim}`}}>{accent}</span></h1>;
const Div = ({t}) => <div style={{width:48,height:2,background:`linear-gradient(90deg,${t.green},transparent)`,marginTop:12,marginBottom:24,borderRadius:2}}/>;
const Lbl = ({t,children}) => <div style={{fontSize:11,letterSpacing:".2em",color:t.textSecondary,textTransform:"uppercase",marginBottom:8,fontFamily:"'Share Tech Mono',monospace"}}>{children}</div>;
const Card= ({t,children,style={}}) => <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12,padding:"18px 20px",...style}}>{children}</div>;
const StatBox=({t,label,value,color}) => (
  <div style={{flex:1,padding:"14px 10px",background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12,textAlign:"center"}}>
    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:26,fontWeight:900,color:color||t.green,lineHeight:1}}>{value}</div>
    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textSecondary,letterSpacing:".12em",textTransform:"uppercase",marginTop:5}}>{label}</div>
  </div>
);

const Shell = ({t,children,page,onNav,onOpenSettings}) => (
  <div style={{minHeight:"100vh",background:t.bg,color:t.textPrimary,overflowX:"hidden"}}>
    <style>{buildCSS(t)}</style>
    {/* Grid bg */}
    <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px)`,backgroundSize:"40px 40px",animation:"gridMove 12s linear infinite"}}/>
    {/* Scanlines (dark only) */}
    {t.scanlines&&<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.012) 3px,rgba(0,0,0,.012) 4px)"}}/>}
    <div style={{maxWidth:480,margin:"0 auto",padding:"28px 18px 110px",position:"relative"}}>
      {children}
    </div>
    {onNav&&(
      <nav className="bottom-nav">
        {[
          {id:"home",    Icon:IconHome,    label:"Accueil"},
          {id:"activite",Icon:IconActivity,label:"Activité"},
          {id:"profil",  Icon:IconUser,    label:"Profil"},
        ].map(({id,Icon,label})=>(
          <button key={id} className={`bnav-btn${page===id?" active":""}`} onClick={()=>onNav(id)}>
            <Icon/><span>{label}</span>
          </button>
        ))}
      </nav>
    )}
  </div>
);

const Loader = ({t,text="CHARGEMENT..."}) => (
  <Shell t={t}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:20}}>
      <div style={{width:40,height:40,border:`2px solid ${t.border}`,borderTop:`2px solid ${t.green}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.textSecondary,letterSpacing:".3em"}}>{text}</div>
    </div>
  </Shell>
);

const ProgBar = ({t,pct,color}) => (
  <div>
    <div style={{height:6,background:t.border,borderRadius:3,overflow:"hidden",marginBottom:6}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color||t.green,boxShadow:`0 0 8px ${color||t.green}`,borderRadius:3,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:color||t.green,textAlign:"right",fontWeight:700}}>{pct.toFixed(0)}%</div>
  </div>
);

// ── Settings Panel ───────────────────────────────────────────────────────────
const SettingsPanel = ({t,theme,onTheme,onLogout,onClose,user}) => (
  <div style={{position:"fixed",inset:0,zIndex:300}} onClick={onClose}>
    <div style={{position:"absolute",top:68,right:18,width:260,background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:16,overflow:"hidden",boxShadow:`0 8px 40px rgba(0,0,0,.35)`,animation:"fadeSlideUp .2s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${t.border}`}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:".3em",color:t.green}}>PARAMÈTRES</div>
      </div>
      <div style={{padding:"14px 18px"}}>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".3em",color:t.textMuted,textTransform:"uppercase",marginBottom:10}}>Apparence</div>
        <div style={{display:"flex",gap:6}}>
          {[{id:"dark",Icon:IconMoon,label:"Sombre"},{id:"light",Icon:IconSun,label:"Clair"}].map(({id,Icon,label})=>(
            <button key={id} onClick={()=>onTheme(id)} style={{flex:1,padding:"10px 8px",border:`1px solid ${theme===id?t.green:t.border}`,background:theme===id?t.greenFaint:"transparent",color:theme===id?t.green:t.textSecondary,fontFamily:"'Share Tech Mono',monospace",fontSize:10,cursor:"pointer",transition:"all .2s",borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <Icon/><span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{height:1,background:t.border}}/>
      <div style={{padding:"12px 18px",fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:t.textSecondary}}>{user?.email}</div>
      <div style={{height:1,background:t.border}}/>
      <button onClick={onLogout} style={{width:"100%",padding:"13px 18px",background:"transparent",border:"none",color:t.red,cursor:"pointer",transition:"all .2s",textAlign:"left",display:"flex",alignItems:"center",gap:10,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".12em"}}>
        <IconLogout/> Déconnexion
      </button>
    </div>
  </div>
);

// ── Monthly Calendar ─────────────────────────────────────────────────────────
const MonthCal = ({t,sessions}) => {
  const [off,setOff]=useState(0);
  const today=new Date(),ref=new Date(today.getFullYear(),today.getMonth()+off,1);
  const year=ref.getFullYear(),month=ref.getMonth();
  const dim=new Date(year,month+1,0).getDate();
  const firstDow=(new Date(year,month,1).getDay()+6)%7;
  const sessdays=new Set(sessions.filter(s=>s.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).map(s=>parseInt(s.date.slice(8))));
  const todayD=today.getFullYear()===year&&today.getMonth()===month?today.getDate():null;
  const cells=[...Array(firstDow).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  return (
    <Card t={t} style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:t.textPrimary,letterSpacing:".1em"}}>{MONTHS_FR[month].toUpperCase()} <span style={{color:t.textSecondary,fontWeight:400}}>{year}</span></div>
        <div style={{display:"flex",gap:6}}>
          {[{dir:-1,ch:"‹"},{dir:1,ch:"›",disabled:off===0}].map(({dir,ch,disabled})=>(
            <button key={dir} onClick={()=>!disabled&&setOff(o=>o+dir)} disabled={disabled}
              style={{background:"transparent",border:`1px solid ${disabled?t.border:t.borderHover}`,color:disabled?t.textMuted:t.textSecondary,width:28,height:28,borderRadius:6,cursor:disabled?"default":"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{ch}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {DAYS_FR.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted,paddingBottom:4}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {cells.map((day,i)=>(
          <div key={i} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:day?"1px solid":"none",borderColor:day&&sessdays.has(day)?t.green:day===todayD?`${t.green}55`:t.border,background:day&&sessdays.has(day)?t.greenFaint:day===todayD?`${t.green}08`:"transparent",animation:day&&sessdays.has(day)?"dayglow 2.5s infinite":"none"}}>
            {day&&<span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:sessdays.has(day)?t.green:day===todayD?t.textPrimary:t.textMuted}}>{day}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Muscle Heatmap ───────────────────────────────────────────────────────────
const MuscleHeatmap = ({t,sessions,exercises}) => {
  // Build fatigue map using actual exercise muscle data
  const fatigue={};
  MUSCLE_GROUPS.forEach(m=>{fatigue[m]=0;});
  const now=new Date();
  sessions.forEach(s=>{
    const daysAgo=(now-new Date(s.date))/(1000*60*60*24);
    if(daysAgo>7) return;
    const weight=daysAgo<1?5:daysAgo<2?4:daysAgo<3?3:daysAgo<4?2:1;
    s.entries&&s.entries.forEach(e=>{
      const ex=exercises.find(x=>x.id===e.exercise_id);
      if(!ex) return;
      ex.muscles.forEach(m=>{if(fatigue[m]!==undefined) fatigue[m]=Math.min(5,fatigue[m]+weight);});
    });
  });

  const colors=[
    {bg:t.bgCard,            border:t.border,           text:t.textMuted},
    {bg:`${t.green}12`,      border:`${t.green}33`,      text:t.green},
    {bg:`${t.green}25`,      border:`${t.green}55`,      text:t.green},
    {bg:"#a0e00020",         border:"#a0e00044",         text:"#b8e000"},
    {bg:`${t.orange}20`,     border:`${t.orange}44`,     text:t.orange},
    {bg:`${t.red}20`,        border:`${t.red}44`,        text:t.red},
  ];

  return (
    <Card t={t} style={{marginBottom:20}}>
      <Lbl t={t}>Récupération musculaire</Lbl>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {MUSCLE_GROUPS.map(m=>{
          const f=Math.round(fatigue[m]);
          const c=colors[f];
          return (
            <div key={m} style={{padding:"7px 6px",borderRadius:8,border:`1px solid ${c.border}`,background:c.bg,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:c.text,textAlign:"center",letterSpacing:".04em",textTransform:"uppercase"}}>
              {m}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,justifyContent:"flex-end"}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted}}>Récupéré</span>
        <div style={{display:"flex",gap:3}}>
          {[t.border,`${t.green}25`,`#a0e00035`,`${t.orange}35`,`${t.red}35`].map((c,i)=>(
            <div key={i} style={{width:10,height:10,borderRadius:3,background:c}}/>
          ))}
        </div>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted}}>Repos</span>
      </div>
    </Card>
  );
};

// ── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({t,data}) => {
  if(!data||data.length<2) return null;
  const W=260,H=56,pad=8;
  const vals=data.map(d=>d.y),minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1;
  const pts=data.map((d,i)=>{const x=pad+(i/(data.length-1))*(W-2*pad);const y=H-pad-((d.y-minV)/range)*(H-2*pad);return[x,y];});
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area=path+` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.green} stopOpacity=".2"/><stop offset="100%" stopColor={t.green} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#sg)"/>
      <path d={path} fill="none" stroke={t.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3" fill={t.green} style={{filter:`drop-shadow(0 0 4px ${t.green})`}}/>)}
    </svg>
  );
};

// ── Week Bar ─────────────────────────────────────────────────────────────────
const WeekBar = ({t,sessions}) => {
  const today=new Date(),mon=new Date(today);
  mon.setDate(today.getDate()-((today.getDay()+6)%7));
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const key=d.toISOString().slice(0,10);
    return{label:DAYS_FR[i],key,isToday:key===todayISO(),has:sessions.some(s=>s.date===key),num:d.getDate()};
  });
  return (
    <div style={{display:"flex",gap:4,marginBottom:20}}>
      {days.map(d=>(
        <div key={d.key} style={{flex:1,padding:"9px 4px",textAlign:"center",borderRadius:10,border:"1px solid",borderColor:d.has?t.green:d.isToday?`${t.green}55`:t.border,background:d.has?t.greenFaint:d.isToday?`${t.green}08`:"transparent",animation:d.has?"dayglow 2.5s infinite":"none"}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,textTransform:"uppercase",color:d.isToday?t.green:t.textMuted,marginBottom:4}}>{d.label}</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:d.has?t.green:d.isToday?t.textPrimary:t.textMuted}}>{d.num}</div>
          {d.has&&<div style={{width:4,height:4,borderRadius:"50%",background:t.green,margin:"4px auto 0",boxShadow:`0 0 5px ${t.green}`}}/>}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════════════════════════
const AuthPage = ({t}) => {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [confirm,setConfirm]=useState(false);

  const handle=async()=>{
    setErr("");setLoading(true);
    if(mode==="login"){const{error}=await supabase.auth.signInWithPassword({email,password:pass});if(error)setErr(error.message);}
    else{const{error}=await supabase.auth.signUp({email,password:pass});if(error)setErr(error.message);else setConfirm(true);}
    setLoading(false);
  };

  if(confirm) return (
    <Shell t={t}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",gap:24}}>
        <div style={{width:72,height:72,border:`2px solid ${t.green}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",animation:"dayglow 2s infinite"}}><span style={{fontSize:28,color:t.green}}>✓</span></div>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,color:t.green,letterSpacing:".2em"}}>COMPTE CRÉÉ !</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:t.textSecondary,textAlign:"center",lineHeight:1.8}}>Vérifie ta boîte mail<br/>et clique sur le lien de confirmation.</div>
        <button className="ghost-btn" onClick={()=>{setConfirm(false);setMode("login");}}>← Se connecter</button>
      </div>
    </Shell>
  );

  return (
    <Shell t={t}>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh"}}>
        <SL t={t}>SPORT TRACKER // MILO</SL>
        <PT t={t} accent="MILO">BIENVENUE</PT>
        <Div t={t}/>
        <Card t={t}>
          <div style={{display:"flex",gap:4,marginBottom:24}}>
            {[{v:"login",l:"Connexion"},{v:"signup",l:"Créer un compte"}].map(x=>(
              <button key={x.v} className={`toggle-btn${mode===x.v?" active":""}`} onClick={()=>{setMode(x.v);setErr("");}}>{x.l}</button>
            ))}
          </div>
          <div style={{marginBottom:16}}><Lbl t={t}>Email</Lbl><input className="neo-input" type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          <div style={{marginBottom:24}}><Lbl t={t}>Mot de passe</Lbl><input className="neo-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          {err&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.red,marginBottom:16,padding:"10px 14px",border:`1px solid ${t.red}33`,background:t.redDim,borderRadius:8}}>⚠ {err}</div>}
          <button className="submit-btn full" onClick={handle} disabled={loading||!email||!pass}>{loading?"...":(mode==="login"?"Connexion":"Créer le compte")}</button>
        </Card>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SESSION PAGE (overlay)
// ══════════════════════════════════════════════════════════════════════════════
const SessionPage = ({t,exercises,onSave,onBack,saving}) => {
  const [entries,setEntries]=useState([]);
  const [showPicker,setShowPicker]=useState(false);
  const [note,setNote]=useState("");
  const [done,setDone]=useState(false);
  const today=new Date();
  const dateStr=today.toISOString().slice(0,10);
  const dateLabel=today.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  const sorted=sortAlpha(exercises);

  const addEx=ex=>{setEntries(p=>[...p,{id:Date.now(),exercise_id:ex.id,exercise_name:ex.name,weight:"",sets:"",reps:"",measure_type:"reps",difficulty:0,failure:null}]);setShowPicker(false);};
  const updE=(id,patch)=>setEntries(p=>p.map(e=>e.id===id?{...e,...patch}:e));
  const remE=id=>setEntries(p=>p.filter(e=>e.id!==id));
  const canSave=entries.length>0&&entries.every(e=>e.sets&&e.reps&&e.difficulty>0&&e.failure!==null);
  const usedIds=entries.map(e=>e.exercise_id);

  const save=async()=>{
    await onSave({date:dateStr,note,entries});
    setDone(true);
    setTimeout(()=>{setDone(false);onBack();},1600);
  };

  if(done) return (
    <div style={{position:"fixed",inset:0,background:t.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,zIndex:200}}>
      <div style={{width:72,height:72,border:`2px solid ${t.green}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",animation:"dayglow 1s infinite"}}><span style={{fontSize:28,color:t.green}}>✓</span></div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,color:t.green,letterSpacing:".2em"}}>SÉANCE ENREGISTRÉE</div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:t.bg,overflowY:"auto",zIndex:200,animation:"sessionSlideIn .25s ease"}}>
      <style>{buildCSS(t)}</style>
      <div style={{maxWidth:480,margin:"0 auto",padding:"28px 18px 100px"}}>
        <button className="ghost-btn" onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <IconBack/> Retour
        </button>
        <SL t={t}>MODULE 02</SL>
        <PT t={t} accent="SÉANCE">MA</PT>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.textSecondary,letterSpacing:".1em",marginTop:6,marginBottom:4,textTransform:"capitalize"}}>{dateLabel}</div>
        <Div t={t}/>

        {entries.map(entry=>{
          const ex=exercises.find(e=>e.id===entry.exercise_id);
          return (
            <Card key={entry.id} t={t} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,color:t.textPrimary,marginBottom:6}}>{ex?.name}</div>
                  <span style={{fontSize:10,color:ex?.type==="weights"?t.blue:t.greenText,fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase"}}>{ex?.type==="weights"?"🏋 HALTÈRES":"⚡ POIDS CORPS"}</span>
                </div>
                <button onClick={()=>remE(entry.id)} style={{background:"transparent",border:`1px solid ${t.red}22`,color:`${t.red}55`,width:30,height:30,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                  <IconClose/>
                </button>
              </div>
              {ex?.type==="weights"&&<div style={{marginBottom:16}}><Lbl t={t}>Charge (kg)</Lbl><input className="neo-input" type="number" placeholder="ex: 60" min="0" step="0.5" value={entry.weight||""} onChange={e=>updE(entry.id,{weight:e.target.value})} style={{color:t.blue}}/></div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><Lbl t={t}>Séries</Lbl><input className="neo-input" type="number" placeholder="4" min="1" value={entry.sets||""} onChange={e=>updE(entry.id,{sets:e.target.value})}/></div>
                <div><Lbl t={t}>{entry.measure_type==="time"?"Durée (sec)":"Répétitions"}</Lbl><input className="neo-input" type="number" placeholder={entry.measure_type==="time"?"40":"10"} min="1" value={entry.reps||""} onChange={e=>updE(entry.id,{reps:e.target.value})}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <Lbl t={t}>Mesure</Lbl>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"reps",l:"Répétitions"},{v:"time",l:"Temps"}].map(x=><button key={x.v} className={`toggle-btn${entry.measure_type===x.v?" active":""}`} onClick={()=>updE(entry.id,{measure_type:x.v})}>{x.l}</button>)}
                </div>
              </div>
              {entry.sets&&entry.reps&&<div style={{padding:"10px 14px",background:t.greenFaint,border:`1px solid ${t.green}33`,borderRadius:8,marginBottom:16,fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.greenText}}>▸ {entry.sets}× {entry.reps}{entry.measure_type==="time"?"s":"rep"}{ex?.type==="weights"&&entry.weight?` @ ${entry.weight}kg`:""}</div>}
              <div style={{marginBottom:16}}>
                <Lbl t={t}>Difficulté {entry.difficulty>0&&<span style={{color:t.green}}>({entry.difficulty}/5)</span>}</Lbl>
                <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(d=><button key={d} className={`diff-dot${entry.difficulty>=d?" active":""}`} onClick={()=>updE(entry.id,{difficulty:d})}>{d}</button>)}</div>
              </div>
              <div><Lbl t={t}>Résultat</Lbl>
                <div style={{display:"flex",gap:8}}>
                  <button className={`fail-btn${entry.failure===false?" active-success":""}`} onClick={()=>updE(entry.id,{failure:false})}>✓ Réussi</button>
                  <button className={`fail-btn${entry.failure===true?" active-fail":""}`} onClick={()=>updE(entry.id,{failure:true})}>✗ Échec</button>
                </div>
              </div>
            </Card>
          );
        })}

        {!showPicker&&(
          <button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"14px",border:`1px dashed ${t.greenDim}`,background:"transparent",color:t.greenText,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".2em",cursor:"pointer",transition:"all .2s",textTransform:"uppercase",marginBottom:16,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <IconPlus/> Ajouter un exercice
          </button>
        )}

        {showPicker&&(
          <Card t={t} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".3em",color:t.greenText}}>CHOISIR UN EXERCICE</div>
              <button onClick={()=>setShowPicker(false)} style={{background:"transparent",border:"none",color:t.textSecondary,cursor:"pointer",display:"flex",alignItems:"center"}}><IconClose/></button>
            </div>
            {sorted.length===0?<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.textMuted,padding:"12px 0"}}>Aucun exercice. Ajoutez-en dans Profil.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto"}}>
                {sorted.map(ex=>{
                  const added=usedIds.includes(ex.id);
                  return (
                    <button key={ex.id} onClick={()=>!added&&addEx(ex)} style={{width:"100%",padding:"12px 14px",border:`1px solid ${added?t.border:t.borderHover}`,background:"transparent",color:added?t.textMuted:t.textPrimary,fontFamily:"'Share Tech Mono',monospace",fontSize:12,cursor:added?"not-allowed":"pointer",transition:"all .15s",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:8}}>
                      <span>{ex.name}</span>
                      <span style={{fontSize:10,opacity:.6}}>{added?"✓":ex.type==="weights"?"haltères":"poids corps"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {entries.length>0&&<div style={{marginBottom:16}}><Lbl t={t}>Note (optionnel)</Lbl><textarea className="neo-input" rows={2} placeholder="Ressenti, conditions..." value={note} onChange={e=>setNote(e.target.value)} style={{resize:"none",lineHeight:1.7}}/></div>}
        {entries.length>0&&!canSave&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:t.textMuted,marginBottom:16}}>▸ Remplissez tous les champs pour valider</div>}
        {entries.length>0&&<button className="submit-btn full" onClick={save} disabled={!canSave||saving}>{saving?"SAUVEGARDE...":"Valider la séance"}</button>}
        {entries.length===0&&!showPicker&&<Card t={t}><div style={{textAlign:"center",padding:"32px 0",color:t.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◇</div>AJOUTEZ AU MOINS UN EXERCICE</div></Card>}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
const HomePage = ({t,user,sessions,exercises,weeklyGoal,onSession,onNav,onOpenSettings,page}) => {
  const mon=mondayISO();
  const sessWeek=sessions.filter(s=>s.date>=mon).length;
  const streak=computeStreak(sessions);
  const nextSess=predictNextSession(sessions);
  const msg=getContextualMessage(sessions,weeklyGoal,streak);

  // Muscle suggestions from fatigue
  const fatigue={};
  MUSCLE_GROUPS.forEach(m=>{fatigue[m]=0;});
  const now2=new Date();
  sessions.forEach(s=>{
    const daysAgo=(now2-new Date(s.date))/(1000*60*60*24);
    if(daysAgo>7) return;
    const weight=daysAgo<1?5:daysAgo<2?4:daysAgo<3?3:daysAgo<4?2:1;
    s.entries&&s.entries.forEach(e=>{
      const ex=exercises.find(x=>x.id===e.exercise_id);
      if(!ex) return;
      ex.muscles.forEach(m=>{if(fatigue[m]!==undefined) fatigue[m]=Math.min(5,fatigue[m]+weight);});
    });
  });
  const fresh=MUSCLE_GROUPS.filter(m=>fatigue[m]===0);
  const possible=MUSCLE_GROUPS.filter(m=>fatigue[m]>=1&&fatigue[m]<=2);
  const needRest=MUSCLE_GROUPS.filter(m=>fatigue[m]>=4);

  return (
    <Shell t={t} page={page} onNav={onNav}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <SL t={t}>SPORT TRACKER // MILO</SL>
        <button className="settings-btn" onClick={onOpenSettings}><IconGear/></button>
      </div>
      <PT t={t} accent="TRAINING">MON</PT>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:t.textMuted,letterSpacing:".1em",marginBottom:4}}>{user?.email}</div>
      <Div t={t}/>

      {/* Stats */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <StatBox t={t} label="Cette semaine" value={sessWeek.toString().padStart(2,"0")} color={t.green}/>
        <StatBox t={t} label="Total séances" value={sessions.length.toString().padStart(2,"0")} color={t.textSecondary}/>
        {weeklyGoal!==null&&<StatBox t={t} label={sessWeek>=weeklyGoal?"Objectif ✓":"Objectif"} value={sessWeek>=weeklyGoal?"✦":`${sessWeek}/${weeklyGoal}`} color={sessWeek>=weeklyGoal?t.green:t.textSecondary}/>}
      </div>

      {/* Week */}
      <SL t={t}>Semaine en cours</SL>
      <WeekBar t={t} sessions={sessions}/>

      {/* Message contextuel */}
      <div style={{padding:"14px 16px",marginBottom:14,borderRadius:12,border:`1px solid ${t.greenDim}`,background:t.greenFaint,display:"flex",alignItems:"flex-start",gap:12,animation:"dayglow 3s infinite"}}>
        <span style={{fontSize:20,flexShrink:0}}>{msg.icon}</span>
        <div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".2em",color:t.green,marginBottom:5}}>{msg.title}</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.textPrimary,lineHeight:1.7}}>{msg.text}</div>
        </div>
      </div>

      {/* Streak */}
      {streak>0&&(
        <div style={{padding:"14px 16px",marginBottom:14,borderRadius:12,border:`1px solid ${t.orange}44`,background:t.orangeDim,display:"flex",alignItems:"center",justifyContent:"space-between",animation:"streakGlow 3s infinite"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <IconBolt/>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".2em",color:t.orange,marginBottom:4}}>SÉRIE EN COURS</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:t.textSecondary}}>semaines d'affilée avec objectif atteint</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:t.orange,lineHeight:1}}>{streak}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textSecondary,marginTop:2}}>semaines</div>
          </div>
        </div>
      )}

      {/* Muscles suggérés */}
      {exercises.length>0&&(
        <Card t={t} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <IconCheck/>
            <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".2em",color:t.textSecondary}}>MUSCLES À TRAVAILLER</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {fresh.slice(0,5).map(m=><span key={m} style={{padding:"5px 11px",borderRadius:20,fontFamily:"'Share Tech Mono',monospace",fontSize:10,border:`1px solid ${t.greenDim}`,color:t.green,background:t.greenFaint}}>{m}</span>)}
            {possible.slice(0,3).map(m=><span key={m} style={{padding:"5px 11px",borderRadius:20,fontFamily:"'Share Tech Mono',monospace",fontSize:10,border:`1px solid ${t.blueDim}`,color:t.blue,background:t.blueDim}}>{m}</span>)}
            {needRest.slice(0,2).map(m=><span key={m} style={{padding:"5px 11px",borderRadius:20,fontFamily:"'Share Tech Mono',monospace",fontSize:10,border:`1px solid ${t.red}22`,color:t.red,background:t.redDim,opacity:.6}}>{m}</span>)}
          </div>
          <div style={{display:"flex",gap:14,marginTop:10,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted}}>
            <span style={{color:t.green}}>● Prêt</span>
            <span style={{color:t.blue}}>● Possible</span>
            <span style={{color:t.red,opacity:.7}}>● Repos</span>
          </div>
        </Card>
      )}

      {/* Prochaine séance */}
      {nextSess&&(
        <div style={{padding:"14px 16px",marginBottom:20,borderRadius:12,border:`1px solid ${t.purple}33`,background:t.purpleDim,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,border:`1px solid ${t.purple}44`,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.purple}11`}}>
              <IconCalendar/>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".2em",color:t.purple,marginBottom:4}}>PROCHAINE SÉANCE</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:900,color:t.textPrimary}}>{nextSess.label}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:t.textSecondary,marginTop:2}}>dans {nextSess.inDays} jour{nextSess.inDays>1?"s":""} · basé sur tes habitudes</div>
            </div>
          </div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.purple,border:`1px solid ${t.purple}44`,padding:"4px 10px",borderRadius:10,background:`${t.purple}11`}}>{nextSess.date}</div>
        </div>
      )}

      {/* CTA */}
      <button onClick={onSession} style={{width:"100%",padding:"17px 20px",border:`1px solid ${t.green}`,background:t.greenFaint,color:t.green,fontFamily:"'Orbitron',sans-serif",fontSize:12,letterSpacing:".2em",cursor:"pointer",transition:"all .25s",textTransform:"uppercase",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,animation:"dayglow 3s infinite"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        Enregistrer une séance
      </button>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITÉ PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ExStatsPage = ({t,exercise,sessions,onBack,onNav,page}) => {
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
    <Shell t={t} page={page} onNav={onNav}>
      <button className="ghost-btn" onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,marginBottom:24,fontSize:11}}><IconBack/>Retour</button>
      <SL t={t}>ACTIVITÉ // STATS</SL>
      <h1 style={{fontFamily:"'Orbitron',sans-serif",fontSize:"clamp(18px,4vw,28px)",fontWeight:900,color:t.textPrimary,letterSpacing:".05em",marginBottom:8,animation:"flicker 6s infinite"}}>{exercise.name}</h1>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:isW?t.blue:t.greenText}}>{isW?"🏋 HALTÈRES":"⚡ POIDS CORPS"}</span>
        {exercise.muscles.map(m=><span key={m} style={{fontSize:10,color:t.textMuted,fontFamily:"'Share Tech Mono',monospace"}}>#{m.toLowerCase()}</span>)}
      </div>
      <Div t={t}/>
      {entries.length===0?<Card t={t}><div style={{textAlign:"center",padding:"32px 0",color:t.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:28,marginBottom:12,opacity:.3}}>◯</div>PAS ENCORE PRATIQUÉ</div></Card>:(
        <>
          {advice&&<div style={{padding:"16px 18px",marginBottom:16,border:`1px solid ${advice.type==="increase"?t.green:t.red}55`,background:advice.type==="increase"?t.greenFaint:t.redDim,borderRadius:12,animation:advice.type==="increase"?"upgradePulse 2.5s infinite":"warningPulse 2.5s infinite"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:".25em",color:advice.type==="increase"?t.green:t.red,marginBottom:8}}>{advice.type==="increase"?"▲ AUGMENTER":"▼ RÉDUIRE"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:t.textPrimary,lineHeight:1.7}}>{advice.type==="increase"?`Tu maîtrises cet exercice ! Augmente ${isW?"la charge":"le temps ou les reps"}.`:`${advice.reason}. Réduis ${isW?"la charge":"le temps / les reps"}.`}</div>
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            <StatBox t={t} label={isW?"Charge max":"Meilleure perf"} value={`${maxVal}${unit}`} color={t.green}/>
            <StatBox t={t} label="Taux échec" value={`${failPct.toFixed(0)}%`} color={failPct>30?t.red:failPct>15?t.orange:t.green}/>
            <StatBox t={t} label="% séances" value={`${pctSess.toFixed(0)}%`} color={t.purple}/>
          </div>
          {chartData.length>=2&&<Card t={t} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Lbl t={t}>Progression</Lbl>
              {delta!==null&&<div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:delta>=0?t.green:t.red}}>{delta>=0?"+":""}{delta.toFixed(1)}{unit}{deltaPct!==null&&<span style={{fontSize:10,marginLeft:6,opacity:.6}}>({deltaPct>=0?"+":""}{deltaPct.toFixed(0)}%)</span>}</div>}
            </div>
            <Sparkline t={t} data={chartData}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted}}><span>{first?.date}</span><span>{last?.date}</span></div>
          </Card>}
          <Lbl t={t}>Dernières performances</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recent.map((e,i)=>(
              <Card key={i} t={t} style={{padding:"13px 16px",animation:`fadeSlideUp .3s ${i*.05}s ease both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:t.textMuted,marginBottom:5}}>{e.date}</div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,color:t.textPrimary,fontWeight:700}}>{e.sets}×{e.reps}{e.measure_type==="time"?"s":"rep"}{isW&&e.weight&&<span style={{color:t.blue,marginLeft:8,fontSize:12}}>@ {e.weight}kg</span>}</div>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted,marginBottom:3}}>DIFF</div>
                      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:e.difficulty>=4?t.orange:e.difficulty<=2?t.green:t.textPrimary}}>{e.difficulty}/5</div>
                    </div>
                    <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,color:e.failure?t.red:t.green}}>{e.failure?"✗":"✓"}</div>
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

const ActivitePage = ({t,exercises,sessions,weeklyGoal,onSelectEx,onNav,page}) => {
  const mon=mondayISO();
  const sessWeek=sessions.filter(s=>s.date>=mon).length;
  const weekPct=weeklyGoal?Math.min((sessWeek/weeklyGoal)*100,100):0;
  const goalMet=weeklyGoal!==null&&sessWeek>=weeklyGoal;
  const sorted=sortAlpha(exercises);

  return (
    <Shell t={t} page={page} onNav={onNav}>
      <SL t={t}>MODULE 03</SL>
      <PT t={t} accent="ACTIVITÉ">MON</PT>
      <Div t={t}/>

      {weeklyGoal!==null&&(
        <div style={{padding:"18px 20px",marginBottom:20,border:`1px solid ${goalMet?t.green:`${t.green}22`}`,background:goalMet?t.greenFaint:t.bgCard,borderRadius:12,animation:goalMet?"dayglow 2s infinite":"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:".25em",color:goalMet?t.green:t.textSecondary,marginBottom:8}}>{goalMet?"✦ OBJECTIF ATTEINT !":"OBJECTIF SEMAINE"}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,lineHeight:1.7,color:t.textPrimary}}>{goalMet?`Bravo ! ${sessWeek} séance${sessWeek>1?"s":""} cette semaine.`:Math.max(weeklyGoal-sessWeek,0)===1?"Plus qu'1 séance !":`${sessWeek} / ${weeklyGoal} séances réalisées.`}</div>
            </div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:goalMet?t.green:t.textPrimary,lineHeight:1,flexShrink:0,marginLeft:16}}>{sessWeek}<span style={{fontSize:16,color:t.textSecondary,fontWeight:400}}>/{weeklyGoal}</span></div>
          </div>
          <ProgBar t={t} pct={weekPct} color={goalMet?t.green:t.orange}/>
        </div>
      )}

      <MonthCal t={t} sessions={sessions}/>
      <MuscleHeatmap t={t} sessions={sessions} exercises={exercises}/>

      <Lbl t={t}>Statistiques par exercice</Lbl>
      {sorted.length===0?<Card t={t}><div style={{textAlign:"center",padding:"24px 0",color:t.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:24,marginBottom:8,opacity:.3}}>◯</div>AJOUTEZ DES EXERCICES</div></Card>:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sorted.map((ex,i)=>{
            const exE=getExEntries(sessions,ex.id);
            const sessCount=sessions.filter(s=>s.entries&&s.entries.some(e=>e.exercise_id===ex.id)).length;
            const last=exE[exE.length-1];
            const adv=computeAdvice(exE);
            return (
              <button key={ex.id} className="ex-prog-row" onClick={()=>onSelectEx(ex)} style={{animation:`fadeSlideUp .3s ${i*.04}s ease both`,marginBottom:0}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700}}>{ex.name}</span>
                    {adv&&<span style={{fontSize:9,padding:"2px 7px",border:`1px solid ${adv.type==="increase"?t.green:t.red}55`,color:adv.type==="increase"?t.green:t.red,fontFamily:"'Share Tech Mono',monospace",borderRadius:10}}>{adv.type==="increase"?"▲":"▼"}</span>}
                  </div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:t.textMuted}}>
                    {sessCount} séance{sessCount!==1?"s":""}
                    {last&&<span> · {last.sets}×{last.reps}{last.measure_type==="time"?"s":"rep"}{ex.type==="weights"&&last.weight?` @ ${last.weight}kg`:""}</span>}
                  </div>
                </div>
                <IconChevron/>
              </button>
            );
          })}
        </div>
      )}
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PROFIL PAGE
// ══════════════════════════════════════════════════════════════════════════════
const ProfilPage = ({t,exercises,sessions,weeklyGoal,onAdd,onDelete,onSetGoal,onNav,page,saving}) => {
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",muscles:[],type:""});
  const [hovered,setHovered]=useState(null);
  const toggleM=m=>setForm(f=>({...f,muscles:f.muscles.includes(m)?f.muscles.filter(x=>x!==m):[...f.muscles,m]}));
  const submit=async()=>{if(!form.name||!form.muscles.length||!form.type)return;await onAdd(form);setForm({name:"",muscles:[],type:""});setShowForm(false);};
  const valid=form.name&&form.muscles.length>0&&form.type;
  const sorted=sortAlpha(exercises);

  return (
    <Shell t={t} page={page} onNav={onNav}>
      <SL t={t}>PROFIL</SL>
      <PT t={t} accent="PROFIL">MON</PT>
      <Div t={t}/>

      {/* Objectif */}
      <Card t={t} style={{marginBottom:20}}>
        <Lbl t={t}>Objectif hebdomadaire</Lbl>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:52,fontWeight:900,color:t.green,lineHeight:1}}>{weeklyGoal??"-"}</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:t.textSecondary,lineHeight:2}}>séances<br/>par semaine</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[2,3,4,5,6,7].map(n=>(
            <button key={n} onClick={()=>onSetGoal(n)} style={{flex:1,padding:"10px 0",border:`1px solid ${weeklyGoal===n?t.green:t.border}`,background:weeklyGoal===n?t.greenFaint:"transparent",color:weeklyGoal===n?t.green:t.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:11,cursor:"pointer",borderRadius:8,transition:"all .2s",textAlign:"center"}}>{n}</button>
          ))}
        </div>
      </Card>

      {/* Exercices */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <Lbl t={t} style={{margin:0}}>Mes exercices</Lbl>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:t.textMuted}}>{exercises.length} exercice{exercises.length!==1?"s":""}</span>
      </div>

      {/* Stats exercices */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <StatBox t={t} label="Total" value={exercises.length.toString().padStart(2,"0")} color={t.green}/>
        <StatBox t={t} label="Poids corps" value={exercises.filter(e=>e.type==="bodyweight").length.toString().padStart(2,"0")} color={t.greenText}/>
        <StatBox t={t} label="Haltères" value={exercises.filter(e=>e.type==="weights").length.toString().padStart(2,"0")} color={t.blue}/>
      </div>

      {!showForm&&(
        <button onClick={()=>setShowForm(true)} style={{width:"100%",padding:"13px",border:`1px dashed ${t.greenDim}`,background:"transparent",color:t.greenText,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".2em",cursor:"pointer",borderRadius:12,textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <IconPlus/>Nouvel exercice
        </button>
      )}

      {showForm&&(
        <Card t={t} style={{marginBottom:14}}>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:".35em",color:t.greenText,marginBottom:18}}>▸ NOUVEL EXERCICE</div>
          <div style={{marginBottom:16}}><Lbl t={t}>Nom</Lbl><input className="neo-input" placeholder="ex: SQUAT, TRACTIONS..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value.toUpperCase()}))}/></div>
          <div style={{marginBottom:16}}>
            <Lbl t={t}>Muscles {form.muscles.length>0&&<span style={{color:t.green}}>({form.muscles.length})</span>}</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {MUSCLE_GROUPS.map(m=><button key={m} className={`muscle-tag${form.muscles.includes(m)?" sel":""}`} onClick={()=>toggleM(m)}>{m}</button>)}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <Lbl t={t}>Type</Lbl>
            <div style={{display:"flex",gap:8}}>
              {[{v:"bodyweight",l:"⚡ Poids corps"},{v:"weights",l:"🏋 Haltères"}].map(x=>(
                <button key={x.v} className={`toggle-btn${form.type===x.v?" active":""}`} onClick={()=>setForm(f=>({...f,type:x.v}))}>{x.l}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="ghost-btn" onClick={()=>{setShowForm(false);setForm({name:"",muscles:[],type:""});}}>Annuler</button>
            <button className="submit-btn full" onClick={submit} disabled={!valid||saving}>{saving?"SAUVEGARDE...":"Enregistrer"}</button>
          </div>
        </Card>
      )}

      {sorted.length===0&&!showForm&&<Card t={t}><div style={{textAlign:"center",padding:"24px 0",color:t.textMuted,fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:".15em",lineHeight:2}}><div style={{fontSize:24,marginBottom:8,opacity:.3}}>◯</div>AUCUN EXERCICE</div></Card>}

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {sorted.map((ex,i)=>(
          <div key={ex.id} className="ex-card" onMouseEnter={()=>setHovered(ex.id)} onMouseLeave={()=>setHovered(null)} style={{animationDelay:`${i*.05}s`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:t.textPrimary}}>{ex.name}</div>
                <div style={{padding:"2px 9px",border:"1px solid",borderColor:ex.type==="bodyweight"?`${t.green}44`:`${t.blue}44`,color:ex.type==="bodyweight"?t.greenText:t.blue,fontSize:9,letterSpacing:".12em",fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase",borderRadius:20}}>{ex.type==="bodyweight"?"CORPS":"HALTÈRES"}</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ex.muscles.map(m=><span key={m} style={{fontSize:10,color:t.textSecondary,fontFamily:"'Share Tech Mono',monospace"}}>#{m.toLowerCase()}</span>)}</div>
            </div>
            {hovered===ex.id&&(
              <button onClick={()=>onDelete(ex.id)} style={{background:"transparent",border:`1px solid ${t.red}33`,color:`${t.red}55`,width:28,height:28,borderRadius:6,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                <IconClose/>
              </button>
            )}
          </div>
        ))}
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
  const [showSession,setShowSession] = useState(false);
  const [showSettings,setShowSettings]= useState(false);
  const [themeName,setThemeName]     = useState(() => localStorage.getItem("milo_theme")||"dark");

  const t = THEMES[themeName];

  const handleTheme = (name) => {
    setThemeName(name);
    localStorage.setItem("milo_theme",name);
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); setAuthLoading(false); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{ setUser(session?.user??null); setAuthLoading(false); });
    return ()=>subscription.unsubscribe();
  },[]);

  const loadAll = useCallback(async () => {
    if(!user) return;
    setDataLoading(true);
    const {data:exData}=await supabase.from("exercises").select("*").order("created_at");
    if(exData) setExercises(exData);
    const {data:sessData}=await supabase.from("sessions").select("*, entries:session_entries(*)").order("date");
    if(sessData) setSessions(sessData.map(s=>({...s,entries:s.entries||[]})));
    const {data:settData}=await supabase.from("user_settings").select("*").eq("user_id",user.id).single();
    if(settData) setWeeklyGoal(settData.weekly_goal);
    setDataLoading(false);
  },[user]);

  useEffect(()=>{ if(user) loadAll(); else{setExercises([]);setSessions([]);setWeeklyGoal(null);} },[user,loadAll]);

  const addExercise    = async (form) => { setSaving(true); const {data,error}=await supabase.from("exercises").insert({...form,user_id:user.id}).select().single(); if(!error&&data) setExercises(p=>[...p,data]); setSaving(false); };
  const deleteExercise = async (id)   => { await supabase.from("exercises").delete().eq("id",id); setExercises(p=>p.filter(e=>e.id!==id)); };

  const saveSession = async ({date,note,entries}) => {
    setSaving(true);
    const {data:sess,error}=await supabase.from("sessions").insert({user_id:user.id,date,note}).select().single();
    if(!error&&sess){
      const ep=entries.map(e=>({session_id:sess.id,exercise_id:e.exercise_id,exercise_name:e.exercise_name,weight:e.weight||null,sets:e.sets,reps:e.reps,measure_type:e.measure_type,difficulty:e.difficulty,failure:e.failure}));
      const {data:ed}=await supabase.from("session_entries").insert(ep).select();
      setSessions(p=>[...p,{...sess,entries:ed||[]}]);
    }
    setSaving(false);
  };

  const saveGoal = async (g) => {
    setSaving(true);
    await supabase.from("user_settings").upsert({user_id:user.id,weekly_goal:g,updated_at:new Date().toISOString()});
    setWeeklyGoal(g);
    setSaving(false);
  };

  const logout = async () => { await supabase.auth.signOut(); setPage("home"); setShowSettings(false); };

  if(authLoading)  return <Loader t={t} text="INITIALISATION..."/>;
  if(!user)        return <AuthPage t={t}/>;
  if(dataLoading)  return <Loader t={t} text="CHARGEMENT..."/>;

  return (
    <>
      {showSettings&&<SettingsPanel t={t} theme={themeName} onTheme={handleTheme} onLogout={logout} onClose={()=>setShowSettings(false)} user={user}/>}
      {showSession&&<SessionPage t={t} exercises={exercises} onSave={saveSession} onBack={()=>setShowSession(false)} saving={saving}/>}

      {page==="ex-stats"&&selectedEx
        ? <ExStatsPage t={t} exercise={selectedEx} sessions={sessions} onBack={()=>setPage("activite")} onNav={setPage} page={page}/>
        : page==="activite"
          ? <ActivitePage t={t} exercises={exercises} sessions={sessions} weeklyGoal={weeklyGoal} onSelectEx={ex=>{setSelectedEx(ex);setPage("ex-stats");}} onNav={setPage} page={page}/>
          : page==="profil"
            ? <ProfilPage t={t} exercises={exercises} sessions={sessions} weeklyGoal={weeklyGoal} onAdd={addExercise} onDelete={deleteExercise} onSetGoal={saveGoal} onNav={setPage} page={page} saving={saving}/>
            : <HomePage t={t} user={user} sessions={sessions} exercises={exercises} weeklyGoal={weeklyGoal} onSession={()=>setShowSession(true)} onNav={setPage} onOpenSettings={()=>setShowSettings(true)} page={page}/>
      }
    </>
  );
}
