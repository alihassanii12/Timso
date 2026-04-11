'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSSE } from '../../hooks/useSSE';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const setTok = (t: string) => { document.cookie = `accessToken=${encodeURIComponent(t)}; path=/; SameSite=None; Secure; max-age=${15*60}`; localStorage.setItem('timso_token', t); };
const clearTok = () => { document.cookie = 'accessToken=; path=/; max-age=0'; localStorage.removeItem('timso_token'); };

let _ax = false;
const setupAxios = () => {
  if (_ax) return; _ax = true;
  axios.interceptors.request.use(c => { const t = getToken(); if (t) c.headers['Authorization'] = `Bearer ${t}`; c.withCredentials = true; return c; });
  let ref = false; let q: {res:(v:unknown)=>void;rej:(e:unknown)=>void}[] = [];
  axios.interceptors.response.use(r => r, async err => {
    const o = err.config;
    if (err.response?.status === 401 && !o._retry) {
      if (ref) return new Promise((res,rej) => q.push({res,rej})).then(() => axios(o));
      o._retry = true; ref = true;
      try { const r = await axios.post(`${API}/api/auth/refresh-token`,{},{withCredentials:true}); if(r.data?.accessToken) setTok(r.data.accessToken); q.forEach(p=>p.res(null)); q=[]; return axios(o); }
      catch(e) { q.forEach(p=>p.rej(e)); q=[]; clearTok(); window.location.href='/login'; return Promise.reject(e); }
      finally { ref=false; }
    }
    return Promise.reject(err);
  });
};

interface User { id?:number|string; full_name?:string; username?:string; email?:string; role?:string; profile_picture?:string; company_id?:number|string; company_name?:string; bio?:string; skills?:string; experience?:string; location?:string; phone_number?:string; cv_url?:string; }
interface TeamMember { id:number|string; full_name?:string; name?:string; username?:string; role?:string; job_role?:string; status?:'office'|'remote'|'away'; note?:string; since?:string; profile_picture?:string; bg?:string; }
interface Task { id:number|string; title:string; assigned_to:number|string; assigned_to_name?:string; assigned_to_email?:string; assigned_to_username?:string; assigned_by:number|string; assigned_by_name?:string; assigned_to_picture?:string; status:'todo'|'in_progress'|'done'; priority:'low'|'medium'|'high'; due_date?:string; created_at?:string; }
interface Application { id:number|string; user_id:number|string; status:'pending'|'accepted'|'rejected'; full_name?:string; email?:string; username?:string; }
interface AssignableUser { id:number|string; full_name?:string; username?:string; }
interface AttendanceRecord { status:'office'|'remote'|'away'; note:string; since:string; }
interface Job { id:number|string; title:string; company_name:string; location:string; type:string; salary?:string; tags:string[]; created_at:string; }
interface JobApp { id:number|string; job_id:number|string; job_title?:string; company_name?:string; status:string; created_at:string; }
interface Member { id:number|string; full_name?:string; username?:string; email?:string; role?:string; profile_picture?:string; is_active?:boolean; }

const COLORS = ['#f97316','#a78bfa','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id:number|string) => COLORS[Number(id)%COLORS.length];
const getInit = (n?:string) => (n||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const tAgo = (d?:string) => { if(!d) return ''; try { const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return `${s}s ago`; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; } catch { return ''; } };
const LS_KEY = 'timso_att';
const getAtt = ():AttendanceRecord => { try{const v=localStorage.getItem(LS_KEY);return v?JSON.parse(v):{status:'office',note:'',since:'--'};}catch{return{status:'office',note:'',since:'--'};} };
const saveAtt = (s:'office'|'remote'|'away',note:string):AttendanceRecord => { const r={status:s,note,since:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}; try{localStorage.setItem(LS_KEY,JSON.stringify(r));}catch{} return r; };

const Av = ({name,pic,size=36,dark=false}:{name?:string;pic?:string;size?:number;dark?:boolean}) => {
  const src = pic&&(pic.startsWith('data:')||pic.startsWith('http'))?pic:null;
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',position:'relative',background:getColor(name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',boxShadow:dark?'0 0 0 2px #333':'0 0 0 2px #f0f0f0'}}>
    {src&&<img src={src} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
    <span style={{fontSize:size*0.35,fontWeight:800,color:'#fff',lineHeight:1,position:'relative',zIndex:src?-1:0}}>{getInit(name)}</span>
  </div>;
};

const NAV = [
  {id:'overview',label:'Overview',icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
  {id:'team',label:'Team',icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'},
  {id:'tasks',label:'Tasks',icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'},
  {id:'jobs',label:'Find Job',icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'},
  {id:'profile',label:'My Profile',icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'},
  {id:'settings',label:'Settings',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
];

const mkS = (dk:boolean) => ({
  bg: dk?'#0f0f0f':'#f5f5f5',
  sidebar: dk?'#161616':'#ffffff',
  sidebarBorder: dk?'#2a2a2a':'#ebebeb',
  header: dk?'#161616':'#ffffff',
  headerBorder: dk?'#2a2a2a':'#ebebeb',
  card: dk?'#1e1e1e':'#ffffff',
  cardBorder: dk?'#2a2a2a':'#ebebeb',
  text: dk?'#f0f0f0':'#111111',
  textSub: dk?'#888':'#777',
  textMuted: dk?'#555':'#aaa',
  navActive: dk?'#f0f0f0':'#111111',
  navActiveTxt: dk?'#111':'#ffffff',
  navHover: dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)',
  input: dk?'#252525':'#ffffff',
  inputBorder: dk?'#333':'#e0e0e0',
  skeletonBg: dk?'#2a2a2a':'#f0f0f0',
  btnPrimary: dk?'#f0f0f0':'#111111',
  btnPrimaryTxt: dk?'#111':'#ffffff',
  btnGhost: dk?'#252525':'#ffffff',
  btnGhostBorder: dk?'#333':'#ddd',
  btnGhostTxt: dk?'#ccc':'#333',
  statusBadgeBg: (s:string) => s==='office'?(dk?'rgba(249,115,22,.2)':'#fff7ed'):s==='remote'?(dk?'rgba(124,58,237,.2)':'#f5f3ff'):(dk?'rgba(255,255,255,.06)':'#f5f5f5'),
  statusBadgeTxt: (s:string) => s==='office'?'#f97316':s==='remote'?'#a78bfa':'#888',
});

const SC:{[k:string]:string} = {office:'#f97316',remote:'#a78bfa',away:'#888'};
const SL:{[k:string]:string} = {office:'In Office',remote:'Remote',away:'Away'};

export default function UserDashboard() {
  const router = useRouter();
  const [nav, setNav] = useState('overview');
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User|null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myAtt, setMyAtt] = useState<AttendanceRecord>({status:'office',note:'',since:'--'});
  const [time, setTime] = useState('');
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showAtt, setShowAtt] = useState(false);
  const [ldTeam, setLdTeam] = useState(true);
  const [deletingTask, setDeletingTask] = useState<number|string|null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<JobApp[]>([]);
  const [applying, setApplying] = useState<number|string|null>(null);
  const [resigning, setResigning] = useState(false);
  const [resignPending, setResignPending] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const T = mkS(dark);
  const showToast = (msg:string, type:'success'|'error'='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  useEffect(() => { setupAxios(); }, []);
  useEffect(() => { try { setDark(localStorage.getItem('timso_dark')==='1'); } catch {} }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`).then(async r => {
      const u = r.data?.user||r.data?.data?.user||r.data?.data||r.data;
      if (!u?.id) { window.location.href='/login'; return; } if (u.role==='admin') { window.location.href='/admin/admin-dashboard'; return; } if (!u.company_id) { window.location.href='/find-company'; return; }
      if (u.company_id) { try { const cr=await axios.get(`${API}/api/companies`); const c=(cr.data?.companies||[]).find((x:{id:number|string;name:string})=>String(x.id)===String(u.company_id)); if(c) u.company_name=c.name; } catch {} }
      setUser(u);
    }).catch(()=>{ window.location.href='/login'; });
  }, []);

  useEffect(() => { const t=setInterval(()=>setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})),1000); setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})); return()=>clearInterval(t); }, []);
  useEffect(() => { setMyAtt(getAtt()); }, []);

  // Auto presence: set online when tab opens, away when tab closes
  useEffect(() => {
    if (!user?.id) return;
    const setPresence = async (status: 'office'|'remote'|'away') => {
      const saved = getAtt();
      const s = status === 'away' ? 'away' : (saved.status === 'away' ? 'office' : saved.status);
      try { await axios.post(`${API}/api/attendance`, { status: s, note: saved.note }); } catch {}
    };
    setPresence('office');
    const onHide = () => { if (document.visibilityState === 'hidden') setPresence('away'); };
    const onShow = () => { if (document.visibilityState === 'visible') setPresence('office'); };
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' ? onHide() : onShow());
    return () => document.removeEventListener('visibilitychange', () => {});
  }, [user?.id]);

  const fetchTeam = useCallback(async (silent=false) => {
    if(!silent) setLdTeam(true);
    try { const r=await axios.get(`${API}/api/attendance/team`); const d=r.data?.data?.team||r.data?.team||r.data; if(Array.isArray(d)) setTeam(d.map((m:TeamMember)=>({...m,name:m.full_name||m.name||m.username||'Unknown',bg:getColor(m.id)}))); } catch { setTeam([]); }
    finally { setLdTeam(false); }
  }, []);
  const fetchTasks = useCallback(async () => { try { const r=await axios.get(`${API}/api/tasks`); const d=r.data?.data?.tasks||r.data?.data||r.data; if(Array.isArray(d)) setTasks(d); } catch {} }, []);
  const fetchJobs = useCallback(async () => { try { const r=await axios.get(`${API}/api/jobs`); setJobs(r.data?.data?.jobs||r.data?.jobs||[]); } catch {} }, []);
  const fetchMyApps = useCallback(async () => { try { const r=await axios.get(`${API}/api/jobs/my-applications`); setMyApps(r.data?.data?.applications||r.data?.applications||[]); } catch {} }, []);

  useEffect(() => { fetchTeam(); fetchTasks(); fetchJobs(); fetchMyApps(); }, [fetchTeam, fetchTasks, fetchJobs, fetchMyApps]);

  // 30s polling for team attendance
  useEffect(() => {
    pollRef.current = setInterval(() => fetchTeam(true), 30000);
    return () => { if(pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTeam]);

  useSSE({ tasks_updated: ()=>fetchTasks(), task_assigned: ()=>{ fetchTasks(); showToast('New task assigned!'); }, attendance_updated: ()=>fetchTeam(true), removed_from_company: ()=>{ showToast('Removed from company','error'); setTimeout(()=>{ window.location.href='/find-company'; },2000); }, resign_approved: ()=>{ showToast('Resign approved! Redirecting...'); setTimeout(()=>{ window.location.href='/find-company'; },2000); }, resign_rejected: ()=>{ setResignPending(false); showToast('Resign request rejected','error'); } }, !!user?.id);

  const handleSaveAtt = async (status:'office'|'remote'|'away', note:string) => { const r=saveAtt(status,note); setMyAtt(r); try { await axios.post(`${API}/api/attendance`,{status,note}); fetchTeam(true); } catch {} showToast('Status updated!'); };
  const handleDeleteTask = async (id:number|string) => { setDeletingTask(id); try { await axios.delete(`${API}/api/tasks/${id}`); fetchTasks(); showToast('Task deleted!'); } catch { showToast('Failed','error'); } finally { setDeletingTask(null); } };
  const handleUpdateTaskStatus = async (id:number|string, status:'todo'|'in_progress'|'done') => { try { await axios.patch(`${API}/api/tasks/${id}/status`,{status}); fetchTasks(); } catch { showToast('Failed','error'); } };
  const handleApplyJob = async (jobId:number|string, title:string) => { setApplying(jobId); try { await axios.post(`${API}/api/jobs/${jobId}/apply`,{}); showToast('Applied to '+title+'!'); fetchMyApps(); } catch(e:unknown) { const ax=e as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); } finally { setApplying(null); } };
  const handleResign = async () => { if (!confirm('Submit resign request to admin?')) return; setResigning(true); try { await axios.post(`${API}/api/companies/resign`,{}); setResignPending(true); showToast('Resign request sent to admin!'); } catch(e:unknown) { const ax=e as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); } finally { setResigning(false); } };
  const logout = async () => { try{await axios.post(`${API}/api/auth/logout`,{});}catch{} clearTok(); router.push('/login'); };

  const name = user?.full_name||user?.username||'User';
  const greet = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };
  const onlineTeam = team.filter(m=>m.status==='office'||m.status==='remote');
  const getAppStatus = (jobId:number|string) => myApps.find(a=>String(a.job_id)===String(jobId));
  const filteredJobs = jobs.filter(j=>!jobSearch||j.title.toLowerCase().includes(jobSearch.toLowerCase())||j.company_name.toLowerCase().includes(jobSearch.toLowerCase()));

  const navItemStyle = (a:boolean) => ({display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 12px',borderRadius:10,border:'none',background:a?T.navActive:T.navHover,color:a?T.navActiveTxt:T.textSub,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',transition:'all .12s',marginBottom:2,textAlign:'left' as const});
  const cardStyle = {background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:14,overflow:'hidden' as const};
  const btnStyle = {background:T.btnPrimary,color:T.btnPrimaryTxt,border:'none',borderRadius:9,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:7,transition:'all .2s'};
  const btnGhostStyle = {background:T.btnGhost,color:T.btnGhostTxt,border:`1px solid ${T.btnGhostBorder}`,borderRadius:9,padding:'8px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:7,transition:'all .2s'};

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:T.bg,fontFamily:'Outfit,sans-serif',transition:'background .2s'}}>
      {toast&&<div style={{position:'fixed',bottom:20,right:20,zIndex:9999,padding:'11px 18px',borderRadius:12,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,background:toast.type==='success'?T.btnPrimary:'#ef4444',color:toast.type==='success'?T.btnPrimaryTxt:'#fff',boxShadow:'0 6px 24px rgba(0,0,0,.2)'}}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
      {showAtt&&<AttModal current={myAtt} onSave={handleSaveAtt} onClose={()=>setShowAtt(false)} dark={dark}/>}

      {/* SIDEBAR */}
      <aside style={{width:236,height:'100vh',background:T.sidebar,borderRight:`1.5px solid ${T.sidebarBorder}`,display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden',transition:'background .2s'}}>
        <div style={{padding:'16px 14px 12px',display:'flex',alignItems:'center',gap:9,borderBottom:`1.5px solid ${T.sidebarBorder}`}}>
          <div style={{width:30,height:30,background:T.btnPrimary,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:T.btnPrimaryTxt,fontWeight:900,fontSize:15,flexShrink:0}}>T</div>
          <span style={{fontSize:16,fontWeight:900,letterSpacing:'-.4px',color:T.text}}>timso</span>
          
        </div>
        <nav style={{padding:'10px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:10,fontWeight:800,color:T.textMuted,padding:'5px 12px 8px',letterSpacing:'.08em',textTransform:'uppercase'}}>Menu</div>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setNav(item.id)} style={navItemStyle(nav===item.id)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
              {item.label}
            </button>
          ))}

        </nav>
        <div style={{padding:'12px',borderTop:`1.5px solid ${T.sidebarBorder}`}}>
          <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',borderRadius:8,background:T.statusBadgeBg(myAtt.status),marginBottom:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:SC[myAtt.status],flexShrink:0}}/>
            <span style={{fontSize:12,fontWeight:700,color:SC[myAtt.status]}}>{SL[myAtt.status]}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:10,background:dark?'#252525':'#f7f7f7',marginBottom:8}}>
            <Av name={name} pic={user?.profile_picture} size={30} dark={dark}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:T.text}}>{name}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{user?.company_name||'Member'}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%',textAlign:'left',padding:'7px 10px',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:T.textMuted,cursor:'pointer',borderRadius:8,fontFamily:'Outfit,sans-serif'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        <header style={{height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:T.header,borderBottom:`1.5px solid ${T.headerBorder}`,flexShrink:0,transition:'background .2s'}}>
          <h1 style={{fontSize:17,fontWeight:800,margin:0,color:T.text,letterSpacing:'-.3px'}}>{NAV.find(n=>n.id===nav)?.label||nav}</h1>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,fontWeight:600,color:T.textMuted}}>{time}</span>
            {/* Dark mode toggle */}
            <button onClick={()=>setDark(d=>{ const nd=!d; try{localStorage.setItem('timso_dark',nd?'1':'0');}catch{} return nd; })} style={{width:40,height:22,borderRadius:100,border:'none',background:dark?'#f97316':'#ddd',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}} title={dark?'Light mode':'Dark mode'}>
              <div style={{position:'absolute',top:3,left:dark?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
            </button>
            <button onClick={()=>setShowAtt(true)} style={{...btnStyle,padding:'7px 14px',fontSize:12}}>Update Status</button>
          </div>
        </header>

        <div style={{flex:1,overflowY:'auto',padding:'22px 24px'}}>

          {/* OVERVIEW */}
          {nav==='overview'&&(
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              {/* Hero */}
              <div style={{background:dark?'linear-gradient(135deg,#1a1a1a,#2d2d2d)':'linear-gradient(135deg,#111,#2a2a2a)',color:'#fff',padding:'26px 28px',borderRadius:18,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,background:'#f97316',borderRadius:'50%',filter:'blur(60px)',opacity:.15}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <span style={{fontSize:11,fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',background:'#f97316',color:'#fff',padding:'3px 10px',borderRadius:100}}>Admin</span>
                    {user?.company_name&&<span style={{fontSize:11,color:'rgba(255,255,255,.5)',background:'rgba(255,255,255,.08)',padding:'3px 10px',borderRadius:100}}>{user.company_name}</span>}
                  </div>
                  <h2 style={{fontSize:24,fontWeight:900,margin:'0 0 6px',letterSpacing:'-.8px'}}>{greet()}, {name}</h2>
                  <p style={{fontSize:13,opacity:.5,margin:'0 0 16px'}}>{tasks.filter(t=>t.status!=='done').length} active tasks &middot; {onlineTeam.length} online now</p>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowAtt(true)} style={{...btnStyle,background:'rgba(255,255,255,.15)',color:'#fff',fontSize:12}}>Update Status</button>
                  </div>
                </div>
              </div>

              {/* Online Now */}
              <div style={cardStyle}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e'}}/>
                    <span style={{fontSize:14,fontWeight:800,color:T.text}}>Online Now</span>
                    <span style={{fontSize:12,color:T.textMuted,background:dark?'#2a2a2a':'#f5f5f5',padding:'1px 8px',borderRadius:100}}>{onlineTeam.length}/{team.length}</span>
                  </div>
                </div>
                {ldTeam?
                  <div style={{padding:'14px 16px',display:'flex',gap:8}}>{[1,2,3].map(i=><div key={i} style={{width:34,height:34,borderRadius:'50%',background:T.skeletonBg}}/>)}</div>:
                  onlineTeam.length===0?
                  <div style={{padding:'20px',textAlign:'center',color:T.textMuted,fontSize:13}}>No one online right now</div>:
                  <div style={{padding:'8px 16px',display:'flex',flexDirection:'column'}}>
                    {onlineTeam.map((m,i)=>(
                      <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<onlineTeam.length-1?`1px solid ${T.cardBorder}`:'none'}}>
                        <div style={{position:'relative',flexShrink:0}}>
                          <Av name={m.name||m.full_name||m.username} pic={m.profile_picture} size={32} dark={dark}/>
                          <div style={{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:SC[m.status||'away'],border:`2px solid ${T.card}`}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name||m.full_name||m.username}</div>
                          <div style={{fontSize:11,color:T.textMuted}}>{m.job_role||m.role||'Member'}{m.note?` · ${m.note}`:''}</div>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:T.statusBadgeBg(m.status||'away'),color:T.statusBadgeTxt(m.status||'away')}}>{SL[m.status||'away']}</span>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>
          )}

          {/* TEAM */}
          {nav==='team'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:T.text}}>Team</div>
                  <div style={{fontSize:13,color:T.textMuted,marginTop:2}}>{team.length} members &middot; {onlineTeam.length} online</div>
                </div>
              </div>
              <div style={cardStyle}>
                {ldTeam?[1,2,3,4].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:`1px solid ${T.cardBorder}`}}><div style={{width:34,height:34,borderRadius:'50%',background:T.skeletonBg,flexShrink:0}}/><div style={{flex:1}}><div style={{height:11,background:T.skeletonBg,borderRadius:4,width:'40%',marginBottom:6}}/><div style={{height:9,background:T.skeletonBg,borderRadius:4,width:'25%'}}/></div></div>):
                team.length===0?<div style={{textAlign:'center',padding:40,color:T.textMuted,fontSize:13}}>No team members yet</div>:
                team.map((m,i)=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:i<team.length-1?`1px solid ${T.cardBorder}`:'none'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Av name={m.name||m.full_name||m.username} pic={m.profile_picture} size={34} dark={dark}/>
                      <div style={{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:SC[m.status||'away'],border:`2px solid ${T.card}`}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{m.name||m.full_name||m.username}</div>
                      <div style={{fontSize:11,color:T.textMuted}}>{m.job_role||m.role||'Member'}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:T.statusBadgeBg(m.status||'away'),color:T.statusBadgeTxt(m.status||'away')}}>{SL[m.status||'away']}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS */}
          {nav==='tasks'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800,color:T.text}}>Tasks</div>
                  <div style={{fontSize:13,color:T.textMuted,marginTop:2}}>{tasks.filter(t=>t.status!=='done').length} open &middot; {tasks.filter(t=>t.status==='done').length} done</div>
                </div>
              </div>
              {tasks.length===0?
                <div style={{textAlign:'center',padding:'44px 24px',background:T.card,border:`1.5px dashed ${T.cardBorder}`,borderRadius:14}}>
                  <div style={{fontSize:36,marginBottom:10}}>📋</div>
                  <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>No tasks yet</div>
                  <div style={{fontSize:13,color:T.textMuted}}>Assign your first task to a team member</div>
                </div>:
              <div style={{...cardStyle,display:'flex',flexDirection:'column'}}>
                {tasks.map((t,i)=>{
                  const SBTN=(st:'todo'|'in_progress'|'done',label:string,col:string)=>(
                    <button onClick={()=>handleUpdateTaskStatus(t.id,st)} style={{padding:'3px 9px',borderRadius:100,border:'none',background:t.status===st?col+'22':'transparent',color:t.status===st?col:T.textMuted,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',transition:'all .12s'}}>{label}</button>
                  );
                  return (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderBottom:i<tasks.length-1?`1px solid ${T.cardBorder}`:'none'}}>
                      <Av name={t.assigned_to_name||t.assigned_to_username} pic={t.assigned_to_picture} size={34} dark={dark}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:700,color:T.text,textDecoration:t.status==='done'?'line-through':'none'}}>{t.assigned_to_name||t.assigned_to_username||'Team member'}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:{high:dark?'rgba(239,68,68,.2)':'#fef2f2',medium:dark?'rgba(249,115,22,.2)':'#fff7ed',low:dark?'rgba(34,197,94,.2)':'#f0fdf4'}[t.priority],color:{high:'#ef4444',medium:'#f97316',low:'#22c55e'}[t.priority]}}>{t.priority}</span>
                        </div>
                        <div style={{fontSize:12,color:T.textSub,fontWeight:600,marginBottom:1}}>{t.title}</div>
                        <div style={{fontSize:11,color:T.textMuted}}>{t.assigned_to_email||''}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:2,flexShrink:0}}>
                        <span style={{fontSize:11,color:T.textMuted,marginRight:4}}>{tAgo(t.created_at)}</span>
                        {SBTN('todo','To Do','#888')}
                        {SBTN('in_progress','In Progress','#f97316')}
                        {SBTN('done','Done','#22c55e')}
                        <button onClick={()=>handleDeleteTask(t.id)} disabled={deletingTask===t.id} style={{width:26,height:26,borderRadius:6,border:'none',background:dark?'rgba(239,68,68,.15)':'#fef2f2',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginLeft:4,flexShrink:0}}>
                          {deletingTask===t.id?'…':<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>}
            </div>
          )}

          {nav==='jobs'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
                <div><div style={{fontSize:18,fontWeight:800,color:T.text}}>Find a Job</div><div style={{fontSize:13,color:T.textMuted,marginTop:2}}>{jobs.length} openings</div></div>
                <button onClick={handleResign} disabled={resigning||resignPending} style={{padding:'8px 16px',borderRadius:9,border:'none',background:resignPending?(dark?'rgba(239,68,68,.2)':'#fef2f2'):(dark?'rgba(239,68,68,.15)':'#fef2f2'),color:'#ef4444',fontSize:13,fontWeight:700,cursor:resignPending?'default':'pointer',fontFamily:'Outfit,sans-serif',opacity:(resigning||resignPending)?0.7:1}}>
                  {resigning?'Sending...':(resignPending?'Resign Pending':'Resign from Company')}
                </button>
              </div>
              {jobs.length===0?
                <div style={{textAlign:'center',padding:'44px 24px',background:T.card,border:'1.5px dashed '+T.cardBorder,borderRadius:14}}>
                  <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                  <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>No jobs found</div>
                  <div style={{fontSize:13,color:T.textMuted}}>Try a different search</div>
                </div>:
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                {jobs.map(j=>{
                  const app=getAppStatus(j.id);
                  return (
                    <div key={j.id} style={{background:T.card,border:'1px solid '+T.cardBorder,borderRadius:14,padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.title}</div>
                          <div style={{fontSize:12,color:T.textMuted}}>{j.company_name}</div>
                        </div>
                        {app&&<span style={{fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:100,background:app.status==='accepted'?(dark?'rgba(34,197,94,.2)':'#f0fdf4'):app.status==='rejected'?(dark?'rgba(239,68,68,.2)':'#fef2f2'):(dark?'rgba(96,165,250,.2)':'#eff6ff'),color:app.status==='accepted'?'#22c55e':app.status==='rejected'?'#ef4444':'#3b82f6',flexShrink:0,textTransform:'uppercase'}}>{app.status}</span>}
                      </div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:dark?'#2a2a2a':'#f5f5f5',color:T.textSub}}>{j.location}</span>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:dark?'#2a2a2a':'#f5f5f5',color:T.textSub}}>{j.type}</span>
                        {j.salary&&<span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:dark?'rgba(34,197,94,.15)':'#f0fdf4',color:'#22c55e'}}>{j.salary}</span>}
                      </div>
                      {j.tags&&j.tags.length>0&&<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{j.tags.slice(0,4).map((tag,i)=><span key={i} style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6,background:dark?'rgba(167,139,250,.15)':'#f5f3ff',color:'#a78bfa'}}>{tag}</span>)}</div>}
                      <button disabled={!!app||applying===j.id} onClick={()=>!app&&handleApplyJob(j.id,j.title)} style={{padding:'8px',borderRadius:8,border:'none',background:app?(dark?'#2a2a2a':'#f5f5f5'):T.btnPrimary,color:app?T.textMuted:T.btnPrimaryTxt,fontSize:12,fontWeight:700,cursor:app?'default':'pointer',fontFamily:'Outfit,sans-serif',opacity:(!!app||applying===j.id)?0.6:1}}>
                        {applying===j.id?'Applying...':app?'Applied':'Apply Now'}
                      </button>
                    </div>
                  );
                })}
              </div>}
              {myApps.length>0&&(
                <div style={{marginTop:20}}>
                  <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:10}}>My Applications</div>
                  <div style={{background:T.card,border:'1px solid '+T.cardBorder,borderRadius:14,overflow:'hidden'}}>
                    {myApps.map((a,i)=>(
                      <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<myApps.length-1?'1px solid '+T.cardBorder:'none'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.job_title||'Job'}</div>
                          <div style={{fontSize:11,color:T.textMuted}}>{a.company_name||''}</div>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:a.status==='accepted'?(dark?'rgba(34,197,94,.2)':'#f0fdf4'):a.status==='rejected'?(dark?'rgba(239,68,68,.2)':'#fef2f2'):(dark?'rgba(96,165,250,.2)':'#eff6ff'),color:a.status==='accepted'?'#22c55e':a.status==='rejected'?'#ef4444':'#3b82f6',textTransform:'capitalize'}}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {nav==='profile'&&<ProfileSection user={user} setUser={setUser} showToast={showToast} dark={dark} T={T}/>}
          {nav==='settings'&&<SettingsSection user={user} setUser={setUser} showToast={showToast} dark={dark} T={T}/>}
        </div>
      </main>
    </div>
  );
}
type ThemeType = ReturnType<typeof mkS>;

function AttModal({current,onSave,onClose,dark}:{current:AttendanceRecord;onSave:(s:'office'|'remote'|'away',note:string)=>void;onClose:()=>void;dark:boolean}) {
  const [status,setStatus] = useState<'office'|'remote'|'away'>(current.status);
  const [note,setNote] = useState(current.note);
  const T = mkS(dark);
  const opts = [{id:'office' as const,label:'In Office',icon:'🏢',color:'#f97316'},{id:'remote' as const,label:'Remote',icon:'🏠',color:'#a78bfa'},{id:'away' as const,label:'Away',icon:'💤',color:'#888'}];
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.card,borderRadius:18,padding:22,width:'100%',maxWidth:340,boxShadow:'0 20px 60px rgba(0,0,0,.25)',border:'1px solid '+T.cardBorder}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <span style={{fontSize:15,fontWeight:800,color:T.text}}>Update Status</span>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:'50%',border:'1px solid '+T.cardBorder,background:T.btnGhost,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',color:T.text}}>x</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {opts.map(o=><button key={o.id} onClick={()=>setStatus(o.id)} style={{flex:1,padding:'11px 4px',borderRadius:10,border:'1.5px solid '+(status===o.id?o.color:T.cardBorder),background:status===o.id?o.color+'18':T.btnGhost,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}><span style={{fontSize:20}}>{o.icon}</span><span style={{fontSize:11,fontWeight:700,color:status===o.id?o.color:T.textMuted}}>{o.label}</span></button>)}
        </div>
        <input style={{width:'100%',border:'1px solid '+T.inputBorder,borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box',marginBottom:12,color:T.text,background:T.input}} placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid '+T.cardBorder,background:T.btnGhost,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:13,color:T.text}}>Cancel</button>
          <button onClick={()=>{onSave(status,note);onClose();}} style={{flex:2,padding:'8px',borderRadius:8,border:'none',background:T.btnPrimary,color:T.btnPrimaryTxt,cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:13}}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({user,setUser,showToast,dark,T}:{user:User|null;setUser:(u:User)=>void;showToast:(m:string,t?:'success'|'error')=>void;dark:boolean;T:ReturnType<typeof mkS>}) {
  const [form,setForm] = useState({
    fullName:user?.full_name||'', username:user?.username||'',
    phone:user?.phone_number||'', location:user?.location||'',
    bio:user?.bio||'', skills:user?.skills||'',
    experience:user?.experience||'', cvUrl:user?.cv_url||''
  });
  const [saving,setSaving] = useState(false);
  const [uploading,setUploading] = useState(false);

  // Sync form when user data loads (user starts as null)
  useEffect(() => {
    if (!user) return;
    setForm({
      fullName:user.full_name||'', username:user.username||'',
      phone:user.phone_number||'', location:user.location||'',
      bio:user.bio||'', skills:user.skills||'',
      experience:user.experience||'', cvUrl:user.cv_url||''
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await axios.put(`${API}/api/auth/profile`, {
        fullName:form.fullName, username:form.username,
        phoneNumber:form.phone, location:form.location,
        bio:form.bio, skills:form.skills,
        experience:form.experience, cvUrl:form.cvUrl
      });
      if (r.data?.success) {
        setUser({...user, full_name:form.fullName, username:form.username,
          phone_number:form.phone, location:form.location,
          bio:form.bio, skills:form.skills, experience:form.experience, cv_url:form.cvUrl} as User);
        showToast('Profile updated!');
      }
    } catch(e:unknown) { const ax=e as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const uploadAvatar = async(e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f) return; setUploading(true);
    try {
      const fd=new FormData(); fd.append('avatar',f);
      const r=await axios.post(`${API}/api/avatar/upload`,fd,{headers:{'Content-Type':'multipart/form-data'}});
      if(r.data?.success) { setUser({...user,profile_picture:r.data.data.avatar_url} as User); showToast('Photo updated!'); }
    } catch { showToast('Upload failed','error'); } finally { setUploading(false); }
  };

  const inp = {border:'1px solid '+T.inputBorder,borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'Outfit,sans-serif',outline:'none',background:T.input,color:T.text,width:'100%',boxSizing:'border-box' as const};
  const ta = {...inp,resize:'vertical' as const,minHeight:80};
  const lbl = {fontSize:12,fontWeight:700 as const,color:T.textSub,display:'block' as const,marginBottom:5};
  const sec = {background:T.card,border:'1px solid '+T.cardBorder,borderRadius:14,padding:'18px',marginBottom:10};

  return (
    <div style={{maxWidth:560,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:14}}>My Profile</div>

      {/* Avatar */}
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Profile Photo</div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:64,height:64,borderRadius:'50%',overflow:'hidden',position:'relative',background:getColor(user?.full_name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {user?.profile_picture&&(user.profile_picture.startsWith('data:')||user.profile_picture.startsWith('http'))&&<img src={user.profile_picture} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
            <span style={{fontSize:22,fontWeight:800,color:'#fff'}}>{getInit(user?.full_name||user?.username)}</span>
          </div>
          <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,background:T.btnPrimary,color:T.btnPrimaryTxt,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {uploading?'Uploading...':'Upload Photo'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={uploadAvatar}/>
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Basic Info</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={lbl}>Full Name</label><input style={inp} value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} placeholder="Your name"/></div>
          <div><label style={lbl}>Username</label><input style={inp} value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="username"/></div>
          <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+92 300 0000000"/></div>
          <div><label style={lbl}>Location</label><input style={inp} value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="City, Country"/></div>
        </div>
        <div style={{marginTop:10}}><label style={lbl}>Email</label><input style={{...inp,opacity:.5,cursor:'not-allowed'}} value={user?.email||''} disabled/></div>
      </div>

      {/* Professional */}
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Professional Details</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><label style={lbl}>Bio / About</label><textarea style={ta} value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Tell employers about yourself..."/></div>
          <div><label style={lbl}>Skills <span style={{fontWeight:400,color:T.textMuted}}>(comma separated)</span></label><input style={inp} value={form.skills} onChange={e=>setForm(p=>({...p,skills:e.target.value}))} placeholder="React, Node.js, TypeScript..."/></div>
          <div><label style={lbl}>Experience</label><textarea style={ta} value={form.experience} onChange={e=>setForm(p=>({...p,experience:e.target.value}))} placeholder="Work history, projects, achievements..."/></div>
          <div><label style={lbl}>CV / Portfolio URL</label><input style={inp} value={form.cvUrl} onChange={e=>setForm(p=>({...p,cvUrl:e.target.value}))} placeholder="https://drive.google.com/..."/></div>
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{padding:'9px 22px',borderRadius:9,border:'none',background:T.btnPrimary,color:T.btnPrimaryTxt,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
        {saving?'Saving...':'Save Profile'}
      </button>
    </div>
  );
}

function SettingsSection({user,setUser,showToast,dark,T}:{user:User|null;setUser:(u:User)=>void;showToast:(m:string,t?:'success'|'error')=>void;dark:boolean;T:ThemeType}) {
  const [form,setForm] = useState({fullName:user?.full_name||'',username:user?.username||''});
  const [pw,setPw] = useState({cur:'',new_:'',conf:''});
  const [saving,setSaving] = useState(false);
  const [savingPw,setSavingPw] = useState(false);
  const [uploading,setUploading] = useState(false);
  // Sync when user loads
  useEffect(() => { if(user?.id) setForm({fullName:user.full_name||'',username:user.username||''}); }, [user?.id]);
  const save = async()=>{setSaving(true);try{const r=await axios.put(API+'/api/auth/profile',{fullName:form.fullName,username:form.username});if(r.data?.success){setUser({...user,full_name:form.fullName,username:form.username} as User);showToast('Profile updated!');}}catch(e:unknown){const ax=e as {response?:{data?:{message?:string}}};showToast(ax?.response?.data?.message||'Failed','error');}finally{setSaving(false);};};
  const changePw = async()=>{if(pw.new_!==pw.conf){showToast('Passwords do not match','error');return;}if(pw.new_.length<8){showToast('Min 8 characters','error');return;}setSavingPw(true);try{await axios.put(API+'/api/auth/change-password',{currentPassword:pw.cur,newPassword:pw.new_});showToast('Password changed!');setPw({cur:'',new_:'',conf:''});}catch(e:unknown){const ax=e as {response?:{data?:{message?:string}}};showToast(ax?.response?.data?.message||'Failed','error');}finally{setSavingPw(false);};};
  const uploadAvatar = async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setUploading(true);try{const fd=new FormData();fd.append('avatar',f);const r=await axios.post(API+'/api/avatar/upload',fd,{headers:{'Content-Type':'multipart/form-data'}});if(r.data?.success){setUser({...user,profile_picture:r.data.data.avatar_url} as User);showToast('Avatar updated!');}}catch{showToast('Upload failed','error');}finally{setUploading(false);};};
  const inp = {border:'1px solid '+T.inputBorder,borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'Outfit,sans-serif',outline:'none',background:T.input,color:T.text,width:'100%',boxSizing:'border-box' as const};
  const lbl = {fontSize:12,fontWeight:700 as const,color:T.textSub,display:'block' as const,marginBottom:5};
  const sec = {background:T.card,border:'1px solid '+T.cardBorder,borderRadius:14,padding:'18px',marginBottom:10};
  return (
    <div style={{maxWidth:440,margin:'0 auto'}}>
      <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:14}}>Settings</div>
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Profile Picture</div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',position:'relative',background:getColor(user?.full_name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {user?.profile_picture&&(user.profile_picture.startsWith('data:')||user.profile_picture.startsWith('http'))&&<img src={user.profile_picture} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
            <span style={{fontSize:17,fontWeight:800,color:'#fff'}}>{getInit(user?.full_name||user?.username)}</span>
          </div>
          <label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,background:T.btnPrimary,color:T.btnPrimaryTxt,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {uploading?'Uploading...':'Upload Photo'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={uploadAvatar}/>
          </label>
        </div>
      </div>
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Profile Info</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><label style={lbl}>Full Name</label><input style={inp} value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} placeholder="Your name"/></div>
          <div><label style={lbl}>Username</label><input style={inp} value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="username"/></div>
          <div><label style={lbl}>Email</label><input style={{...inp,opacity:.5,cursor:'not-allowed'}} value={user?.email||''} disabled/></div>
          <button onClick={save} disabled={saving} style={{alignSelf:'flex-start',padding:'7px 16px',borderRadius:8,border:'none',background:T.btnPrimary,color:T.btnPrimaryTxt,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>{saving?'Saving...':'Save Changes'}</button>
        </div>
      </div>
      <div style={sec}>
        <div style={{fontSize:11,fontWeight:800,color:T.textMuted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Change Password</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><label style={lbl}>Current Password</label><input type="password" style={inp} value={pw.cur} onChange={e=>setPw(p=>({...p,cur:e.target.value}))} placeholder="••••••••"/></div>
          <div><label style={lbl}>New Password</label><input type="password" style={inp} value={pw.new_} onChange={e=>setPw(p=>({...p,new_:e.target.value}))} placeholder="Min 8 chars"/></div>
          <div><label style={lbl}>Confirm Password</label><input type="password" style={inp} value={pw.conf} onChange={e=>setPw(p=>({...p,conf:e.target.value}))} placeholder="Repeat"/></div>
          <button onClick={changePw} disabled={savingPw||!pw.cur||!pw.new_} style={{alignSelf:'flex-start',padding:'7px 16px',borderRadius:8,border:'none',background:T.btnPrimary,color:T.btnPrimaryTxt,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',opacity:(!pw.cur||!pw.new_)?0.4:1}}>{savingPw?'Changing...':'Change Password'}</button>
        </div>
      </div>
    </div>
  );
}
