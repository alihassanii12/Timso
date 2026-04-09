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
interface Task { id:number|string; title:string; assigned_to:number|string; assigned_to_name?:string; assigned_by:number|string; status:'todo'|'in_progress'|'done'; priority:'low'|'medium'|'high'; due_date?:string; }
interface Application { id:number|string; user_id:number|string; status:'pending'|'accepted'|'rejected'; full_name?:string; email?:string; username?:string; }
interface AssignableUser { id:number|string; full_name?:string; username?:string; }
interface AttendanceRecord { status:'office'|'remote'|'away'; note:string; since:string; }
interface Member { id:number|string; full_name?:string; username?:string; email?:string; role?:string; profile_picture?:string; is_active?:boolean; last_login?:string; }

const COLORS = ['#f97316','#a78bfa','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id:number|string) => COLORS[Number(id)%COLORS.length];
const getInit = (n?:string) => (n||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const tAgo = (d:string) => { try { const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return`${s}s`; if(s<3600)return`${Math.floor(s/60)}m`; if(s<86400)return`${Math.floor(s/3600)}h`; return`${Math.floor(s/86400)}d`; } catch{return'';} };
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
  {id:'manage',label:'Manage Team',icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'},
  {id:'analytics',label:'Analytics',icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'},
  {id:'settings',label:'Settings',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
];

const S = {
  sidebar: {width:260,height:'100vh',background:'#ffffff',borderRight:'2px solid #f0f0f0',display:'flex',flexDirection:'column' as const,flexShrink:0,overflow:'hidden'},
  navItem: (active:boolean)=>({display:'flex',alignItems:'center',gap:12,width:'100%',padding:'11px 14px',borderRadius:12,border:'none',background:active?'#111':'transparent',color:active?'#fff':'#444',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',transition:'all .15s',marginBottom:3,textAlign:'left' as const}),
  card: {background:'#fff',border:'1.5px solid #ebebeb',borderRadius:16,overflow:'hidden' as const,boxShadow:'0 1px 4px rgba(0,0,0,.04)'},
  btn: {background:'#111',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:8,transition:'all .2s'},
  btnGhost: {background:'#fff',color:'#111',border:'1.5px solid #ddd',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'inline-flex',alignItems:'center',gap:8,transition:'all .2s'},
  inp: {width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,background:'#fff',color:'#111'},
  lbl: {fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:6},
};

const STATUS_COLOR:{[k:string]:string} = {office:'#f97316',remote:'#7c3aed',away:'#9ca3af'};
const STATUS_BG:{[k:string]:string} = {office:'rgba(249,115,22,.1)',remote:'rgba(124,58,237,.1)',away:'rgba(0,0,0,.05)'};
const STATUS_LBL:{[k:string]:string} = {office:'In Office',remote:'Remote',away:'Away'};

export default function AdminDashboard() {
  const router = useRouter();
  const [nav, setNav] = useState('overview');
  const [user, setUser] = useState<User|null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignUsers, setAssignUsers] = useState<AssignableUser[]>([]);
  const [myAtt, setMyAtt] = useState<AttendanceRecord>({status:'office',note:'',since:'--'});
  const [time, setTime] = useState('');
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showAtt, setShowAtt] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [ldTeam, setLdTeam] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg:string, type:'success'|'error'='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  useEffect(() => { setupAxios(); }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`).then(async r => {
      const u = r.data?.user||r.data?.data?.user||r.data?.data||r.data;
      if (!u?.id||u.role!=='admin') { window.location.href='/login'; return; }
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
  const fetchApplications = useCallback(async () => { if(!user?.company_id) return; try { const r=await axios.get(`${API}/api/companies/applications`); if(r.data?.success) setApplications(r.data.applications||[]); } catch {} }, [user?.company_id]);
  const fetchAssignUsers = useCallback(async () => { try { const r=await axios.get(`${API}/api/tasks/users`); setAssignUsers(r.data?.data?.users||r.data?.users||[]); } catch {} }, []);

  useEffect(() => { fetchTeam(); fetchTasks(); fetchAssignUsers(); }, [fetchTeam, fetchTasks, fetchAssignUsers]);
  useEffect(() => { if(user?.company_id) fetchApplications(); }, [user?.company_id, fetchApplications]);

  useSSE({ tasks_updated: () => fetchTasks(), task_assigned: () => fetchTasks(), attendance_updated: () => fetchTeam(true) }, !!user?.id);

  const handleSaveAtt = async (status:'office'|'remote'|'away', note:string) => { const r=saveAtt(status,note); setMyAtt(r); try { await axios.post(`${API}/api/attendance`,{status,note}); fetchTeam(true); } catch {} showToast('Status updated!'); };
  const handleAssignTask = async (d:{title:string;description:string;assigned_to:string;priority:string;due_date:string}) => { setTaskLoading(true); try { await axios.post(`${API}/api/tasks`,d); showToast('Task assigned!'); setShowTask(false); fetchTasks(); } catch { showToast('Failed','error'); } finally { setTaskLoading(false); } };
  const handleApplication = async (id:number|string, status:'accepted'|'rejected') => { try { await axios.post(`${API}/api/companies/handle-application`,{applicationId:id,status}); showToast(`Application ${status}!`); fetchApplications(); fetchTeam(); } catch { showToast('Failed','error'); } };
  const logout = async () => { try{await axios.post(`${API}/api/auth/logout`,{});}catch{} clearTok(); router.push('/login'); };

  const name = user?.full_name||user?.username||'Admin';
  const greet = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#f8f8f8',fontFamily:'Outfit,sans-serif'}}>
      {toast&&<div style={{position:'fixed',bottom:24,right:24,zIndex:9999,padding:'13px 20px',borderRadius:14,fontSize:14,fontWeight:600,display:'flex',alignItems:'center',gap:10,background:toast.type==='success'?'#111':'#ef4444',color:'#fff',boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}
      {showAtt&&<AttModal current={myAtt} onSave={handleSaveAtt} onClose={()=>setShowAtt(false)}/>}
      {showTask&&<TModal users={assignUsers} onSubmit={handleAssignTask} onClose={()=>setShowTask(false)} loading={taskLoading}/>}

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={{padding:'22px 20px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'2px solid #f0f0f0'}}>
          <div style={{width:34,height:34,background:'#111',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:17,flexShrink:0}}>T</div>
          <span style={{fontSize:18,fontWeight:900,letterSpacing:'-.5px',color:'#111'}}>timso</span>
          <span style={{marginLeft:'auto',fontSize:11,fontWeight:800,padding:'3px 9px',borderRadius:100,background:'linear-gradient(135deg,#f97316,#ef4444)',color:'#fff',letterSpacing:'.04em'}}>ADMIN</span>
        </div>

        <nav style={{padding:'12px',flex:1,overflowY:'auto'}}>
          <div style={{fontSize:11,fontWeight:800,color:'#bbb',padding:'6px 14px 10px',letterSpacing:'.08em',textTransform:'uppercase'}}>Menu</div>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setNav(item.id)} style={S.navItem(nav===item.id)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
              {item.label}
            </button>
          ))}
          <div style={{height:1.5,background:'#f0f0f0',margin:'10px 4px'}}/>
          <button onClick={()=>router.push('/admin/jobs')} style={S.navItem(false)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Post Job
          </button>
          <button onClick={()=>router.push('/admin/applications')} style={S.navItem(false)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Applications
          </button>
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
              <div style={{fontSize:12,color:'#888'}}>{user?.company_name||'Admin'}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%',textAlign:'left',padding:'9px 12px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:10,background:'none',border:'none',color:'#888',cursor:'pointer',borderRadius:10,fontFamily:'Outfit,sans-serif'}}>
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
                <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,background:'#f97316',borderRadius:'50%',filter:'blur(70px)',opacity:.2}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <span style={{fontSize:12,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',background:'#f97316',color:'#fff',padding:'4px 12px',borderRadius:100}}>Welcome Back</span>
                    {user?.company_name&&<span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)',background:'rgba(255,255,255,.1)',padding:'4px 12px',borderRadius:100}}>{user.company_name}</span>}
                  </div>
                  <h2 style={{fontSize:32,fontWeight:900,margin:'0 0 8px',letterSpacing:'-1px'}}>{greet()}, {name}</h2>
                  <p style={{fontSize:15,opacity:.6,margin:'0 0 20px'}}>{team.filter(m=>m.status==='office').length} in office &middot; {tasks.filter(t=>t.status!=='done').length} active tasks</p>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <button onClick={()=>setShowAtt(true)} style={{...S.btn,background:'#fff',color:'#111',fontSize:14,padding:'10px 20px'}}>Update Status</button>
                    <button onClick={()=>setShowTask(true)} style={{...S.btn,background:'rgba(255,255,255,.15)',color:'#fff',fontSize:14,padding:'10px 20px'}}>+ Assign Task</button>
                  </div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
                {[
                  {label:'In Office',value:team.filter(m=>m.status==='office').length,color:'#f97316',bg:'#fff7ed',border:'#fed7aa'},
                  {label:'Remote',value:team.filter(m=>m.status==='remote').length,color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'},
                  {label:'Active Tasks',value:tasks.filter(t=>t.status!=='done').length,color:'#dc2626',bg:'#fef2f2',border:'#fecaca'},
                  {label:'Done Today',value:tasks.filter(t=>t.status==='done').length,color:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0'},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:'20px 22px'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#666',marginBottom:8}}>{s.label}</div>
                    <div style={{fontSize:36,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {applications.length>0&&(
                <div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:800,color:'#111'}}>Pending Applications</div>
                      <div style={{fontSize:13,color:'#888',marginTop:2}}>{applications.length} waiting</div>
                    </div>
                    <button onClick={()=>router.push('/admin/applications')} style={{...S.btnGhost,fontSize:13,padding:'9px 16px'}}>View All</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
                    {applications.slice(0,4).map(app=>(
                      <div key={app.id} style={{...S.card,padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
                        <Av name={app.full_name||app.username} size={44}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.full_name||app.username}</div>
                          <div style={{fontSize:13,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.email}</div>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>handleApplication(app.id,'accepted')} style={{width:36,height:36,borderRadius:10,border:'none',background:'#f0fdf4',color:'#16a34a',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✓</button>
                          <button onClick={()=>handleApplication(app.id,'rejected')} style={{width:36,height:36,borderRadius:10,border:'none',background:'#fef2f2',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✕</button>
                        </div>
                      </div>
                    ))}
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
              <div style={S.card}>
                {ldTeam?[1,2,3,4].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderBottom:'1.5px solid #f0f0f0'}}><div style={{width:44,height:44,borderRadius:'50%',background:'#f0f0f0',flexShrink:0}}/><div style={{flex:1}}><div style={{height:14,background:'#f0f0f0',borderRadius:6,width:'40%',marginBottom:8}}/><div style={{height:12,background:'#f0f0f0',borderRadius:6,width:'25%'}}/></div></div>):
                team.length===0?<div style={{textAlign:'center',padding:48,color:'#888',fontSize:15}}>No team members yet</div>:
                team.map(m=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderBottom:'1.5px solid #f5f5f5'}}>
                    <Av name={m.name||m.full_name||m.username} pic={m.profile_picture} size={44}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#111'}}>{m.name||m.full_name||m.username}</div>
                      <div style={{fontSize:13,color:'#888',marginTop:2}}>{m.job_role||m.role||'Member'}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,padding:'5px 14px',borderRadius:100,background:STATUS_BG[m.status||'away'],color:STATUS_COLOR[m.status||'away']}}>
                      {STATUS_LBL[m.status||'away']}
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
                  <div style={{fontSize:22,fontWeight:800,color:'#111'}}>Tasks</div>
                  <div style={{fontSize:14,color:'#888',marginTop:2}}>{tasks.filter(t=>t.status!=='done').length} open &middot; {tasks.filter(t=>t.status==='done').length} done</div>
                </div>
                <button onClick={()=>setShowTask(true)} style={{...S.btn,fontSize:13,padding:'10px 18px'}}>+ Assign Task</button>
              </div>
              {tasks.length===0?
                <div style={{textAlign:'center',padding:'56px 24px',background:'#fff',border:'2px dashed #e5e5e5',borderRadius:18}}>
                  <div style={{fontSize:48,marginBottom:14}}>📋</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#111',marginBottom:6}}>No tasks yet</div>
                  <div style={{fontSize:14,color:'#888'}}>Assign your first task to a team member</div>
                </div>:
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {tasks.map(t=>(
                  <div key={t.id} style={{...S.card,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,background:{high:'#ef4444',medium:'#f97316',low:'#22c55e'}[t.priority]||'#9ca3af'}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,textDecoration:t.status==='done'?'line-through':'none',color:t.status==='done'?'#aaa':'#111'}}>{t.title}</div>
                      <div style={{fontSize:13,color:'#888',marginTop:2}}>{t.assigned_to_name||'Team member'}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,padding:'5px 12px',borderRadius:100,background:{todo:'#f5f5f5',in_progress:'#fff7ed',done:'#f0fdf4'}[t.status],color:{todo:'#888',in_progress:'#f97316',done:'#16a34a'}[t.status]}}>
                      {t.status==='in_progress'?'In Progress':t.status==='todo'?'To Do':'Done'}
                    </span>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {nav==='manage'&&<ManageSection user={user} showToast={showToast}/>}
          {nav==='analytics'&&<AnalyticsSection/>}
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
          {opts.map(o=><button key={o.id} onClick={()=>setStatus(o.id)} style={{flex:1,padding:'14px 6px',borderRadius:12,border:`2px solid ${status===o.id?o.color:'#e5e5e5'}`,background:status===o.id?`${o.color}12`:'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><span style={{fontSize:24}}>{o.icon}</span><span style={{fontSize:13,fontWeight:700,color:status===o.id?o.color:'#888'}}>{o.label}</span></button>)}
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

// Task Modal
function TModal({users,onSubmit,onClose,loading}:{users:AssignableUser[];onSubmit:(d:{title:string;description:string;assigned_to:string;priority:string;due_date:string})=>void;onClose:()=>void;loading:boolean}) {
  const [title,setTitle] = useState('');
  const [assignedTo,setAssignedTo] = useState('');
  const [priority,setPriority] = useState('medium');
  const [dueDate,setDueDate] = useState('');
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:440,boxShadow:'0 20px 60px rgba(0,0,0,.15)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <span style={{fontSize:18,fontWeight:800,color:'#111'}}>Assign Task</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid #e0e0e0',background:'#f8f8f8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div><label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:6}}>Assign to *</label>
            <select style={{width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,color:'#111',background:'#fff'}} value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
              <option value="">Select member...</option>
              {users.map(u=><option key={u.id} value={String(u.id)}>{u.full_name||u.username}</option>)}
            </select>
          </div>
          <div><label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:6}}>Title *</label>
            <input style={{width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,color:'#111'}} placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)}/>
          </div>
          <div><label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:6}}>Priority</label>
            <div style={{display:'flex',gap:8}}>
              {(['low','medium','high'] as const).map(p=><button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:'9px',borderRadius:10,border:`1.5px solid ${priority===p?'#f97316':'#e0e0e0'}`,background:priority===p?'#fff7ed':'transparent',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'Outfit,sans-serif',color:priority===p?'#f97316':'#888',textTransform:'capitalize'}}>{p}</button>)}
            </div>
          </div>
          <div><label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:6}}>Due Date</label>
            <input type="date" style={{width:'100%',border:'1.5px solid #e0e0e0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',boxSizing:'border-box' as const,color:'#111'}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e0e0e0',background:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:14,color:'#444'}}>Cancel</button>
          <button disabled={!title.trim()||!assignedTo||loading} onClick={()=>onSubmit({title,description:'',assigned_to:assignedTo,priority,due_date:dueDate})} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:'#111',color:'#fff',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:14,opacity:(!title.trim()||!assignedTo)?0.4:1}}>
            {loading?'Assigning...':'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Manage Team Section
function ManageSection({user,showToast}:{user:User|null;showToast:(m:string,t?:'success'|'error')=>void}) {
  const [members,setMembers] = useState<Member[]>([]);
  const [loading,setLoading] = useState(true);
  const [removing,setRemoving] = useState<number|string|null>(null);
  const fetch = useCallback(async()=>{setLoading(true);try{const r=await axios.get(`${API}/api/admin/company/members`);setMembers(r.data?.users||[]);}catch{setMembers([]);}finally{setLoading(false);}}, []);
  useEffect(()=>{fetch();},[fetch]);
  const remove = async(id:number|string,name:string)=>{if(!confirm(`Remove ${name}?`))return;setRemoving(id);try{await axios.patch(`${API}/api/admin/company/members/${id}/remove`,{});showToast(`${name} removed`);fetch();}catch{showToast('Failed','error');}finally{setRemoving(null);};};
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:'#111'}}>Manage Team</div>
          <div style={{fontSize:14,color:'#888',marginTop:2}}>{members.length} members</div>
        </div>
        <button onClick={fetch} style={{background:'#fff',color:'#111',border:'1.5px solid #ddd',borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Refresh</button>
      </div>
      {loading?<div style={{textAlign:'center',padding:48,color:'#888',fontSize:15}}>Loading...</div>:members.length===0?
        <div style={{textAlign:'center',padding:'56px 24px',background:'#fff',border:'2px dashed #e5e5e5',borderRadius:18}}>
          <div style={{fontSize:48,marginBottom:14}}>👥</div>
          <div style={{fontSize:18,fontWeight:800,color:'#111',marginBottom:6}}>No members yet</div>
          <div style={{fontSize:14,color:'#888'}}>Accept applications to add members</div>
        </div>:
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {members.map(m=>(
          <div key={m.id} style={{background:'#fff',border:'1.5px solid #ebebeb',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
            <Av name={m.full_name||m.username} pic={m.profile_picture} size={44}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                <span style={{fontSize:15,fontWeight:700,color:'#111'}}>{m.full_name||m.username}</span>
                <span style={{fontSize:11,fontWeight:800,padding:'2px 8px',borderRadius:100,background:m.role==='admin'?'linear-gradient(135deg,#f97316,#ef4444)':'#f0f0f0',color:m.role==='admin'?'#fff':'#888'}}>{m.role}</span>
              </div>
              <div style={{fontSize:13,color:'#888'}}>{m.email}</div>
            </div>
            {String(m.id)!==String(user?.id)&&<button onClick={()=>remove(m.id,m.full_name||m.username||'User')} disabled={removing===m.id} style={{padding:'7px 14px',borderRadius:8,border:'none',background:'#fef2f2',color:'#ef4444',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>{removing===m.id?'...':'Remove'}</button>}
          </div>
        ))}
      </div>}
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  const [stats,setStats] = useState<{in_office:number;remote:number;away:number;total_active_users:number}|null>(null);
  const [weekly,setWeekly] = useState<{day:string;office:number;remote:number;away:number}[]>([]);
  const [taskStats,setTaskStats] = useState<{total:number;todo:number;in_progress:number;done:number}|null>(null);
  useEffect(()=>{
    axios.get(`${API}/api/attendance/analytics`).then(r=>{const d=r.data?.data;if(d){setStats(d.today);setWeekly(d.daily||[]);}}).catch(()=>{});
    axios.get(`${API}/api/tasks`).then(r=>{const tasks=r.data?.data?.tasks||r.data?.data||r.data||[];if(Array.isArray(tasks)){setTaskStats({total:tasks.length,todo:tasks.filter((t:{status:string})=>t.status==='todo').length,in_progress:tasks.filter((t:{status:string})=>t.status==='in_progress').length,done:tasks.filter((t:{status:string})=>t.status==='done').length});}}).catch(()=>{});
  },[]);
  const maxVal = Math.max(...weekly.map(d=>d.office+d.remote+d.away),1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{fontSize:22,fontWeight:800,color:'#111'}}>Analytics</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14}}>
        {[
          {label:'In Office',value:stats?.in_office||0,color:'#f97316',bg:'#fff7ed',border:'#fed7aa'},
          {label:'Remote',value:stats?.remote||0,color:'#2563eb',bg:'#eff6ff',border:'#bfdbfe'},
          {label:'Away',value:stats?.away||0,color:'#888',bg:'#f8f8f8',border:'#e5e5e5'},
          {label:'Total Active',value:stats?.total_active_users||0,color:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0'},
        ].map(s=><div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:'20px 22px'}}><div style={{fontSize:13,fontWeight:600,color:'#666',marginBottom:8}}>{s.label}</div><div style={{fontSize:32,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div></div>)}
      </div>
      {weekly.length>0&&<div style={{background:'#fff',border:'1.5px solid #ebebeb',borderRadius:16,padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
        <div style={{fontSize:16,fontWeight:800,color:'#111',marginBottom:18}}>This Week</div>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',height:120}}>
          {weekly.map(d=>{const total=d.office+d.remote+d.away||0;const h=total?Math.max((total/maxVal)*96,6):6;return(
            <div key={d.day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div style={{width:'100%',height:h,background:'linear-gradient(180deg,#f97316,#fb923c)',borderRadius:'6px 6px 0 0',transition:'height .4s'}}/>
              <span style={{fontSize:13,fontWeight:600,color:'#888'}}>{d.day}</span>
            </div>
          );})}
        </div>
      </div>}
      {taskStats&&<div style={{background:'#fff',border:'1.5px solid #ebebeb',borderRadius:16,padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
        <div style={{fontSize:16,fontWeight:800,color:'#111',marginBottom:16}}>Task Overview</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[{l:'Total',v:taskStats.total,c:'#111'},{l:'To Do',v:taskStats.todo,c:'#888'},{l:'In Progress',v:taskStats.in_progress,c:'#f97316'},{l:'Done',v:taskStats.done,c:'#16a34a'}].map(s=><div key={s.l} style={{textAlign:'center',padding:'16px 8px',background:'#f8f8f8',borderRadius:12}}><div style={{fontSize:28,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:12,fontWeight:600,color:'#888',marginTop:4}}>{s.l}</div></div>)}
        </div>
      </div>}
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
  const card = {background:'#fff',border:'1.5px solid #ebebeb',borderRadius:16,padding:'24px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.04)'};
  return (
    <div style={{maxWidth:580}}>
      <div style={{fontSize:22,fontWeight:800,color:'#111',marginBottom:20}}>Settings</div>
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
