'use client';
import { useState, useEffect, useCallback } from 'react';
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

interface User { id?:number|string; full_name?:string; username?:string; email?:string; role?:string; profile_picture?:string; company_id?:number|string; company_name?:string; }
interface TeamMember { id:number|string; full_name?:string; name?:string; username?:string; role?:string; job_role?:string; status?:'office'|'remote'|'away'; note?:string; since?:string; profile_picture?:string; bg?:string; }
interface Task { id:number|string; title:string; assigned_to:number|string; assigned_to_name?:string; assigned_by:number|string; assigned_by_name?:string; status:'todo'|'in_progress'|'done'; priority:'low'|'medium'|'high'; due_date?:string; }
interface Job { id:number|string; title:string; company_name:string; location:string; type:string; salary?:string; tags:string[]; created_at:string; }
interface JobApp { id:number|string; job_id:number|string; job_title?:string; company_name?:string; status:string; created_at:string; }
interface AttendanceRecord { status:'office'|'remote'|'away'; note:string; since:string; }

const COLORS = ['#f97316','#a78bfa','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id:number|string) => COLORS[Number(id)%COLORS.length];
const getInit = (n?:string) => (n||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const LS_KEY = 'timso_att';
const getAtt = ():AttendanceRecord => { try{const v=localStorage.getItem(LS_KEY);return v?JSON.parse(v):{status:'office',note:'',since:'--'};}catch{return{status:'office',note:'',since:'--'};} };
const saveAtt = (s:'office'|'remote'|'away',note:string):AttendanceRecord => { const r={status:s,note,since:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}; try{localStorage.setItem(LS_KEY,JSON.stringify(r));}catch{} return r; };

const Av = ({name,pic,size=40}:{name?:string;pic?:string;size?:number}) => {
  const src = pic&&(pic.startsWith('data:')||pic.startsWith('http'))?pic:null;
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,overflow:'hidden',position:'relative',background:getColor(name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
    {src&&<img src={src} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
    <span style={{fontSize:size*0.35,fontWeight:800,color:'#fff',lineHeight:1,position:'relative',zIndex:src?-1:0}}>{getInit(name)}</span>
  </div>;
};

const NAV = [
  {id:'overview',label:'Overview',icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
  {id:'team',label:'Team',icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'},
  {id:'tasks',label:'Tasks',icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'},
  {id:'jobs',label:'Find Job',icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'},
  {id:'settings',label:'Settings',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
];

const S = {
  sidebar: {width:260,height:'100vh',background:'#ffffff',borderRight:'2px solid #f0f0f0',display:'flex',flexDirection:'column' as const,flexShrink:0,overflow:'hidden'},
  navItem: (active:boolean)=>({display:'flex',alignItems:'center',gap:12,width:'100%',padding:'11px 14px',borderRadius:12,border:'none',background:active?'#111':'transparent',color:active?'#fff':'#444',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',transition:'all .15s',marginBottom:3,textAlign:'left' as const}),
  card: {background:'#fff',border:'1.5px solid #ebebeb',borderRadius:16,overflow:'hidden' as const,boxShadow:'0 1px 4px rgba(0,0,0,.04)'},
  btn: {background:'#111',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:8,transition:'all .2s'},
  btnGhost: {background:'#fff',color:'#111',border:'1.5px solid #ddd',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:8,transition:'all .2s'},
  inp: {width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,background:'#fff',color:'#111'},
};

const STATUS_COLOR:{[k:string]:string} = {office:'#f97316',remote:'#7c3aed',away:'#9ca3af'};
const STATUS_BG:{[k:string]:string} = {office:'rgba(249,115,22,.1)',remote:'rgba(124,58,237,.1)',away:'rgba(0,0,0,.05)'};
const STATUS_LBL:{[k:string]:string} = {office:'In Office',remote:'Remote',away:'Away'};

export default function UserDashboard() {
  const router = useRouter();
  const [nav, setNav] = useState('overview');
  const [user, setUser] = useState<User|null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<JobApp[]>([]);
  const [myAtt, setMyAtt] = useState<AttendanceRecord>({status:'office',note:'',since:'--'});
  const [time, setTime] = useState('');
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showAtt, setShowAtt] = useState(false);
  const [ldTeam, setLdTeam] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState<number|string|null>(null);
  const [jobSearch, setJobSearch] = useState('');

  const showToast = (msg:string, type:'success'|'error'='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  useEffect(() => { setupAxios(); }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`).then(async r => {
      const u = r.data?.user||r.data?.data?.user||r.data?.data||r.data;
      if (!u?.id) { window.location.href='/login'; return; }
      if (u.role==='admin') { window.location.href='/admin/admin-dashboard'; return; }
      if (!u.company_id) { window.location.href='/find-company'; return; }
      if (u.company_id) { try { const cr=await axios.get(`${API}/api/companies`); const c=(cr.data?.companies||[]).find((x:{id:number|string;name:string})=>String(x.id)===String(u.company_id)); if(c) u.company_name=c.name; } catch {} }
      setUser(u);
    }).catch(()=>{ window.location.href='/login'; });
  }, []);

  useEffect(() => { const t=setInterval(()=>setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})),1000); setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})); return()=>clearInterval(t); }, []);
  useEffect(() => { setMyAtt(getAtt()); }, []);

  const fetchTeam = useCallback(async (silent=false) => {
    if(!silent) setLdTeam(true); else setRefreshing(true);
    try { const r=await axios.get(`${API}/api/attendance/team`); const d=r.data?.data?.team||r.data?.team||r.data; if(Array.isArray(d)) setTeam(d.map((m:TeamMember)=>({...m,name:m.full_name||m.name||m.username||'Unknown',bg:getColor(m.id)}))); } catch { setTeam([]); }
    finally { setLdTeam(false); setRefreshing(false); }
  }, []);
  const fetchTasks = useCallback(async () => { try { const r=await axios.get(`${API}/api/tasks`); const d=r.data?.data?.tasks||r.data?.data||r.data; if(Array.isArray(d)) setTasks(d); } catch {} }, []);
  const fetchJobs = useCallback(async () => { try { const r=await axios.get(`${API}/api/jobs`); setJobs(r.data?.data?.jobs||r.data?.jobs||[]); } catch {} }, []);
  const fetchMyApps = useCallback(async () => { try { const r=await axios.get(`${API}/api/jobs/my-applications`); setMyApps(r.data?.data?.applications||r.data?.applications||[]); } catch {} }, []);

  useEffect(() => { fetchTeam(); fetchTasks(); fetchJobs(); fetchMyApps(); }, [fetchTeam, fetchTasks, fetchJobs, fetchMyApps]);

  useSSE({
    tasks_updated: () => fetchTasks(),
    task_assigned: () => { fetchTasks(); showToast('New task assigned to you!'); },
    attendance_updated: () => fetchTeam(true),
    removed_from_company: () => { showToast('You have been removed from the company','error'); setTimeout(()=>{ window.location.href='/find-company'; },2000); },
  }, !!user?.id);

  const handleSaveAtt = async (status:'office'|'remote'|'away', note:string) => {
    const r=saveAtt(status,note); setMyAtt(r);
    try { await axios.post(`${API}/api/attendance`,{status,note}); fetchTeam(true); } catch {}
    showToast('Status updated!');
  };
  const handleUpdateTaskStatus = async (taskId:number|string, status:'todo'|'in_progress'|'done') => {
    try { await axios.patch(`${API}/api/tasks/${taskId}/status`,{status}); fetchTasks(); showToast('Task updated!'); }
    catch { showToast('Failed','error'); }
  };
  const handleApplyJob = async (jobId:number|string, title:string) => {
    setApplying(jobId);
    try { await axios.post(`${API}/api/jobs/${jobId}/apply`,{}); showToast(`Applied to "${title}"!`); fetchMyApps(); }
    catch(e:unknown) { const ax=e as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); }
    finally { setApplying(null); }
  };
  const logout = async () => { try{await axios.post(`${API}/api/auth/logout`,{});}catch{} clearTok(); router.push('/login'); };

  const name = user?.full_name||user?.username||'User';
  const greet = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };
  const getAppStatus = (jobId:number|string) => myApps.find(a=>String(a.job_id)===String(jobId));
  const filteredJobs = jobs.filter(j=>!jobSearch||j.title.toLowerCase().includes(jobSearch.toLowerCase())||j.company_name.toLowerCase().includes(jobSearch.toLowerCase()));

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#f8f8f8',fontFamily:'Outfit,sans-serif'}}>
      {/* Toast */}
      {toast&&<div style={{position:'fixed',bottom:24,right:24,zIndex:9999,padding:'13px 20px',borderRadius:14,fontSize:14,fontWeight:600,display:'flex',alignItems:'center',gap:10,background:toast.type==='success'?'#111':'#ef4444',color:'#fff',boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
      {showAtt&&<AttModal current={myAtt} onSave={handleSaveAtt} onClose={()=>setShowAtt(false)}/>}

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={{padding:'22px 20px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'2px solid #f0f0f0'}}>
          <div style={{width:34,height:34,background:'#111',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:17,flexShrink:0}}>T</div>
          <span style={{fontSize:18,fontWeight:900,letterSpacing:'-.5px',color:'#111'}}>timso</span>
          {user?.company_name&&<span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:90}}>{user.company_name}</span>}
        </div>

        <nav style={{padding:'12px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:11,fontWeight:800,color:'#bbb',padding:'6px 14px 10px',letterSpacing:'.08em',textTransform:'uppercase'}}>Menu</div>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setNav(item.id)} style={S.navItem(nav===item.id)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{padding:'14px',borderTop:'2px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,background:STATUS_BG[myAtt.status],marginBottom:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:STATUS_COLOR[myAtt.status],flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:700,color:STATUS_COLOR[myAtt.status]}}>{STATUS_LBL[myAtt.status]}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:'#f8f8f8',marginBottom:10}}>
            <Av name={name} pic={user?.profile_picture} size={36}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#111'}}>{name}</div>
              <div style={{fontSize:12,color:'#888'}}>{user?.company_name||'Team Member'}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%',textAlign:'left',padding:'9px 12px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:10,background:'none',border:'none',color:'#888',cursor:'pointer',borderRadius:10,fontFamily:'Outfit,sans-serif',transition:'all .15s'}}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        <header style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',background:'#fff',borderBottom:'2px solid #f0f0f0',flexShrink:0}}>
          <h1 style={{fontSize:20,fontWeight:800,margin:0,color:'#111',letterSpacing:'-.3px'}}>{NAV.find(n=>n.id===nav)?.label||nav}</h1>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:14,fontWeight:600,color:'#888'}}>{time}</span>
            <button onClick={()=>setShowAtt(true)} style={{...S.btn,padding:'9px 18px',fontSize:13}}>Update Status</button>
          </div>
        </header>

        <div style={{flex:1,overflowY:'auto',padding:'28px 32px'}}>

          {/* OVERVIEW */}
          {nav==='overview'&&(
            <div style={{display:'flex',flexDirection:'column',gap:24}}>
              <div style={{background:'linear-gradient(135deg,#111 0%,#2d2d2d 100%)',color:'#fff',padding:'32px 36px',borderRadius:20,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,background:'#a78bfa',borderRadius:'50%',filter:'blur(70px)',opacity:.25}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <span style={{fontSize:12,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',background:'#a78bfa',color:'#fff',padding:'4px 12px',borderRadius:100}}>Welcome Back</span>
                    {user?.company_name&&<span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)',background:'rgba(255,255,255,.1)',padding:'4px 12px',borderRadius:100}}>{user.company_name}</span>}
                  </div>
                  <h2 style={{fontSize:32,fontWeight:900,margin:'0 0 8px',letterSpacing:'-1px'}}>{greet()}, {name}</h2>
                  <p style={{fontSize:15,opacity:.6,margin:'0 0 20px'}}>{tasks.filter(t=>t.status!=='done').length} active tasks &middot; {STATUS_LBL[myAtt.status]}</p>
                  <button onClick={()=>setShowAtt(true)} style={{...S.btn,background:'#fff',color:'#111',fontSize:14,padding:'10px 20px'}}>Update Status</button>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
                {[
                  {label:'My Tasks',value:tasks.length,color:'#f97316',bg:'#fff7ed',border:'#fed7aa'},
                  {label:'In Progress',value:tasks.filter(t=>t.status==='in_progress').length,color:'#7c3aed',bg:'#f5f3ff',border:'#ddd6fe'},
                  {label:'Completed',value:tasks.filter(t=>t.status==='done').length,color:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0'},
                  {label:'Team Online',value:team.filter(m=>m.status==='office'||m.status==='remote').length,color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:'20px 22px'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#666',marginBottom:8}}>{s.label}</div>
                    <div style={{fontSize:36,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {tasks.filter(t=>t.status!=='done').length>0&&(
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:'#111',marginBottom:14}}>My Open Tasks</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {tasks.filter(t=>t.status!=='done').slice(0,4).map(t=>(
                      <div key={t.id} style={{...S.card,padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,background:{high:'#ef4444',medium:'#f97316',low:'#22c55e'}[t.priority]||'#9ca3af'}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:'#111'}}>{t.title}</div>
                          <div style={{fontSize:13,color:'#888',marginTop:2}}>by {t.assigned_by_name||'Admin'}{t.due_date?` · Due ${new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:''}</div>
                        </div>
                        <select value={t.status} onChange={e=>handleUpdateTaskStatus(t.id,e.target.value as 'todo'|'in_progress'|'done')} style={{fontSize:13,fontWeight:600,padding:'6px 10px',borderRadius:8,border:'1.5px solid #e0e0e0',background:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',color:'#111'}}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    ))}
                    {tasks.filter(t=>t.status!=='done').length>4&&<button onClick={()=>setNav('tasks')} style={{...S.btnGhost,fontSize:13,padding:'9px 18px',alignSelf:'flex-start'}}>View all tasks</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TEAM */}
          {nav==='team'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:'#111'}}>Team</div>
                  <div style={{fontSize:14,color:'#888',marginTop:2}}>{team.length} members</div>
                </div>
                <button onClick={()=>fetchTeam(true)} style={{...S.btnGhost,fontSize:13,padding:'9px 16px'}}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{animation:refreshing?'spin .65s linear infinite':'none'}}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Refresh
                </button>
              </div>
              <div style={{...S.card}}>
                {ldTeam?[1,2,3,4].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderBottom:'1.5px solid #f0f0f0'}}><div style={{width:44,height:44,borderRadius:'50%',background:'#f0f0f0',flexShrink:0}}/><div style={{flex:1}}><div style={{height:14,background:'#f0f0f0',borderRadius:6,width:'40%',marginBottom:8}}/><div style={{height:12,background:'#f0f0f0',borderRadius:6,width:'25%'}}/></div></div>):
                team.length===0?<div style={{textAlign:'center',padding:48,color:'#888',fontSize:15}}>No team members yet</div>:
                team.map(m=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid #f5f5f5'}}>
                    <Av name={m.name||m.full_name||m.username} pic={m.profile_picture} size={36}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#111'}}>{m.name||m.full_name||m.username}</div>
                      <div style={{fontSize:13,color:'#888',marginTop:2}}>{m.job_role||m.role||'Member'}{m.note?` · ${m.note}`:''}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                      <div style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:STATUS_BG[m.status||'away'],color:STATUS_COLOR[m.status||'away']}}>
                        {STATUS_LBL[m.status||'away']}
                      </div>
                      {m.since&&<div style={{fontSize:12,color:'#bbb'}}>{m.since}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS */}
          {nav==='tasks'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:'#111'}}>My Tasks</div>
                  <div style={{fontSize:14,color:'#888',marginTop:2}}>{tasks.filter(t=>t.status!=='done').length} open &middot; {tasks.filter(t=>t.status==='done').length} done</div>
                </div>
              </div>
              {tasks.length===0?
                <div style={{textAlign:'center',padding:'56px 24px',background:'#fff',border:'2px dashed #e5e5e5',borderRadius:18}}>
                  <div style={{fontSize:48,marginBottom:14}}>📋</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#111',marginBottom:6}}>No tasks yet</div>
                  <div style={{fontSize:14,color:'#888'}}>Your admin will assign tasks to you</div>
                </div>:
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {tasks.map(t=>(
                  <div key={t.id} style={{...S.card,padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,background:{high:'#ef4444',medium:'#f97316',low:'#22c55e'}[t.priority]||'#9ca3af'}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,textDecoration:t.status==='done'?'line-through':'none',color:t.status==='done'?'#aaa':'#111'}}>{t.title}</div>
                      <div style={{fontSize:12,color:'#888',marginTop:1}}>by {t.assigned_by_name||'Admin'}{t.due_date?` · Due ${new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:''}</div>
                    </div>
                    <select value={t.status} onChange={e=>handleUpdateTaskStatus(t.id,e.target.value as 'todo'|'in_progress'|'done')} style={{fontSize:13,fontWeight:600,padding:'7px 12px',borderRadius:8,border:'1.5px solid #e0e0e0',background:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',color:'#111'}}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {/* JOBS */}
          {nav==='jobs'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:'#111'}}>Find a Job</div>
                  <div style={{fontSize:14,color:'#888',marginTop:2}}>{filteredJobs.length} openings</div>
                </div>
                <input style={{...S.inp,width:240,padding:'10px 14px',fontSize:14}} placeholder="Search jobs..." value={jobSearch} onChange={e=>setJobSearch(e.target.value)}/>
              </div>
              {filteredJobs.length===0?
                <div style={{textAlign:'center',padding:'56px 24px',background:'#fff',border:'2px dashed #e5e5e5',borderRadius:18}}>
                  <div style={{fontSize:48,marginBottom:14}}>🔍</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#111',marginBottom:6}}>No jobs found</div>
                  <div style={{fontSize:14,color:'#888'}}>Try a different search</div>
                </div>:
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
                {filteredJobs.map(j=>{
                  const app=getAppStatus(j.id);
                  return (
                    <div key={j.id} style={{...S.card,padding:'20px 22px',display:'flex',flexDirection:'column',gap:12}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:16,fontWeight:800,color:'#111',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.title}</div>
                          <div style={{fontSize:13,color:'#888'}}>{j.company_name}</div>
                        </div>
                        {app&&<span style={{fontSize:11,fontWeight:800,padding:'3px 10px',borderRadius:100,background:{applied:'#eff6ff',accepted:'#f0fdf4',rejected:'#fef2f2'}[app.status]||'#f5f5f5',color:{applied:'#2563eb',accepted:'#16a34a',rejected:'#ef4444'}[app.status]||'#888',flexShrink:0,textTransform:'uppercase',letterSpacing:'.05em'}}>{app.status}</span>}
                      </div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:8,background:'#f5f5f5',color:'#555'}}>{j.location}</span>
                        <span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:8,background:'#f5f5f5',color:'#555'}}>{j.type}</span>
                        {j.salary&&<span style={{fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:8,background:'#f0fdf4',color:'#16a34a'}}>{j.salary}</span>}
                      </div>
                      {j.tags&&j.tags.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{j.tags.slice(0,4).map((tag,i)=><span key={i} style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:6,background:'#f5f3ff',color:'#7c3aed'}}>{tag}</span>)}</div>}
                      <button disabled={!!app||applying===j.id} onClick={()=>!app&&handleApplyJob(j.id,j.title)} style={{...S.btn,width:'100%',justifyContent:'center',fontSize:14,padding:'10px',opacity:(!!app||applying===j.id)?0.5:1,cursor:app?'default':'pointer',background:app?'#f5f5f5':'#111',color:app?'#888':'#fff'}}>
                        {applying===j.id?'Applying...':app?'Applied':'Apply Now'}
                      </button>
                    </div>
                  );
                })}
              </div>}
              {myApps.length>0&&(
                <div style={{marginTop:32}}>
                  <div style={{fontSize:17,fontWeight:800,color:'#111',marginBottom:14}}>My Applications</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {myApps.map(a=>(
                      <div key={a.id} style={{...S.card,padding:'14px 20px',display:'flex',alignItems:'center',gap:14}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.job_title||'Job'}</div>
                          <div style={{fontSize:13,color:'#888',marginTop:2}}>{a.company_name||''} &middot; {new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100,background:{applied:'#eff6ff',accepted:'#f0fdf4',rejected:'#fef2f2'}[a.status]||'#f5f5f5',color:{applied:'#2563eb',accepted:'#16a34a',rejected:'#ef4444'}[a.status]||'#888',textTransform:'capitalize'}}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {nav==='settings'&&<SettingsSection user={user} setUser={setUser} showToast={showToast}/>}
        </div>
      </main>
    </div>
  );
}

// Attendance Modal
function AttModal({current,onSave,onClose}:{current:AttendanceRecord;onSave:(s:'office'|'remote'|'away',note:string)=>void;onClose:()=>void}) {
  const [status,setStatus] = useState<'office'|'remote'|'away'>(current.status);
  const [note,setNote] = useState(current.note);
  const opts = [{id:'office' as const,label:'In Office',icon:'🏢',color:'#f97316'},{id:'remote' as const,label:'Remote',icon:'🏠',color:'#7c3aed'},{id:'away' as const,label:'Away',icon:'💤',color:'#9ca3af'}];
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,.15)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <span style={{fontSize:18,fontWeight:800,color:'#111'}}>Update Status</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid #e0e0e0',background:'#f8f8f8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
        <div style={{display:'flex',gap:10,marginBottom:18}}>
          {opts.map(o=><button key={o.id} onClick={()=>setStatus(o.id)} style={{flex:1,padding:'14px 6px',borderRadius:12,border:`2px solid ${status===o.id?o.color:'#e5e5e5'}`,background:status===o.id?`${o.color}12`:'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all .15s'}}><span style={{fontSize:24}}>{o.icon}</span><span style={{fontSize:13,fontWeight:700,color:status===o.id?o.color:'#888'}}>{o.label}</span></button>)}
        </div>
        <input style={{width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box',marginBottom:18,color:'#111'}} placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e0e0e0',background:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:14,color:'#444'}}>Cancel</button>
          <button onClick={()=>{onSave(status,note);onClose();}} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:'#111',color:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:14}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Settings Section
function SettingsSection({user,setUser,showToast}:{user:User|null;setUser:(u:User)=>void;showToast:(m:string,t?:'success'|'error')=>void}) {
  const [form,setForm] = useState({fullName:user?.full_name||'',username:user?.username||''});
  const [pw,setPw] = useState({cur:'',new_:'',conf:''});
  const [saving,setSaving] = useState(false);
  const [savingPw,setSavingPw] = useState(false);
  const [uploading,setUploading] = useState(false);
  const save = async()=>{setSaving(true);try{const r=await axios.put(`${API}/api/auth/profile`,{fullName:form.fullName,username:form.username});if(r.data?.success){setUser({...user,full_name:form.fullName,username:form.username} as User);showToast('Profile updated!');}}catch(e:unknown){const ax=e as {response?:{data?:{message?:string}}};showToast(ax?.response?.data?.message||'Failed','error');}finally{setSaving(false);};};
  const changePw = async()=>{if(pw.new_!==pw.conf){showToast('Passwords do not match','error');return;}if(pw.new_.length<8){showToast('Min 8 characters','error');return;}setSavingPw(true);try{await axios.put(`${API}/api/auth/change-password`,{currentPassword:pw.cur,newPassword:pw.new_});showToast('Password changed!');setPw({cur:'',new_:'',conf:''});}catch(e:unknown){const ax=e as {response?:{data?:{message?:string}}};showToast(ax?.response?.data?.message||'Failed','error');}finally{setSavingPw(false);};};
  const uploadAvatar = async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setUploading(true);try{const fd=new FormData();fd.append('avatar',f);const r=await axios.post(`${API}/api/avatar/upload`,fd,{headers:{'Content-Type':'multipart/form-data'}});if(r.data?.success){setUser({...user,profile_picture:r.data.data.avatar_url} as User);showToast('Avatar updated!');}}catch{showToast('Upload failed','error');}finally{setUploading(false);};};
  const inp = {width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,background:'#fff',color:'#111'};
  const lbl = {fontSize:13,fontWeight:700 as const,color:'#555',display:'block' as const,marginBottom:6};
  const card = {background:'#fff',borderBottom:'1.5px solid #f0f0f0',padding:'24px 28px',marginBottom:0};
  return (
    <div style={{display:'flex',flexDirection:'column',gap:0,height:'100%'}}>
      <div style={{fontSize:20,fontWeight:800,color:'#111',padding:'24px 28px',borderBottom:'1.5px solid #f0f0f0',marginBottom:0}}>Settings</div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Profile Picture</div>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{width:68,height:68,borderRadius:'50%',overflow:'hidden',position:'relative',background:getColor(user?.full_name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.1)',flexShrink:0}}>
            {user?.profile_picture&&(user.profile_picture.startsWith('data:')||user.profile_picture.startsWith('http'))&&<img src={user.profile_picture} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
            <span style={{fontSize:24,fontWeight:800,color:'#fff'}}>{getInit(user?.full_name||user?.username)}</span>
          </div>
          <label style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:10,background:'#111',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
            {uploading?'Uploading...':'Upload Photo'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={uploadAvatar}/>
          </label>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Profile Info</div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><label style={lbl}>Full Name</label><input style={inp} value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} placeholder="Your name"/></div>
          <div><label style={lbl}>Username</label><input style={inp} value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="username"/></div>
          <div><label style={lbl}>Email</label><input style={{...inp,opacity:.5,cursor:'not-allowed'}} value={user?.email||''} disabled/></div>
          <button onClick={save} disabled={saving} style={{alignSelf:'flex-start',padding:'11px 22px',borderRadius:10,border:'none',background:'#111',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>{saving?'Saving...':'Save Changes'}</button>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Change Password</div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><label style={lbl}>Current Password</label><input type="password" style={inp} value={pw.cur} onChange={e=>setPw(p=>({...p,cur:e.target.value}))} placeholder="••••••••"/></div>
          <div><label style={lbl}>New Password</label><input type="password" style={inp} value={pw.new_} onChange={e=>setPw(p=>({...p,new_:e.target.value}))} placeholder="Min 8 chars"/></div>
          <div><label style={lbl}>Confirm Password</label><input type="password" style={inp} value={pw.conf} onChange={e=>setPw(p=>({...p,conf:e.target.value}))} placeholder="Repeat"/></div>
          <button onClick={changePw} disabled={savingPw||!pw.cur||!pw.new_} style={{alignSelf:'flex-start',padding:'11px 22px',borderRadius:10,border:'none',background:'#111',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',opacity:(!pw.cur||!pw.new_)?0.4:1}}>{savingPw?'Changing...':'Change Password'}</button>
        </div>
      </div>
    </div>
  );
}


