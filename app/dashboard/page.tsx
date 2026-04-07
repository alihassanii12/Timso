'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { SocketProvider, useSocket } from '../SocketProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ══ AUTO TOKEN REFRESH INTERCEPTOR ══ */
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(null));
  failedQueue = [];
};

axios.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axios(original)).catch(e => Promise.reject(e));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await axios.post(`${API}/api/auth/refresh-token`, {}, { withCredentials: true });
        processQueue(null);
        return axios(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

/* ══ TYPES ══ */
interface User {
  id?: number | string;
  fullname?: string; full_name?: string;
  username?: string; email?: string;
  role?: string; avatar_color?: string; department?: string;
  profile_picture?: string;
  company_id?: number | string;
}
interface Company {
  id: number | string;
  name: string;
  description?: string;
  admin_id: number | string;
}
interface Application {
  id: number | string;
  user_id: number | string;
  company_id: number | string;
  status: 'pending' | 'accepted' | 'rejected';
  full_name?: string;
  email?: string;
  username?: string;
}
interface TeamMember {
  id: number | string;
  full_name?: string; fullname?: string; name?: string; username?: string;
  email?: string; job_role?: string; role?: string;
  status?: 'office'|'remote'|'away';
  note?: string; where?: string; location?: string;
  since?: string; checkin_time?: string;
  avatar_color?: string; bg?: string;
  profile_picture?: string;
}
interface ActivityItem {
  id: number | string;
  user_id?: number | string;
  name?: string; user_name?: string;
  action: string; icon?: string;
  created_at?: string; time?: string;
  bg?: string; avatar_color?: string;
  profile_picture?: string;
}
interface SwapRequest {
  id: number | string;
  requester_id?: number | string;
  requester_name?: string;
  from_date: string; to_date: string;
  reason?: string;
  status?: 'pending'|'approved'|'declined';
  created_at?: string;
  avatar_color?: string; isOwn?: boolean;
}
interface Task {
  id: number | string;
  title: string;
  description?: string;
  assigned_to: number | string;
  assigned_to_name?: string;
  assigned_to_username?: string;
  assigned_to_picture?: string;
  assigned_by: number | string;
  assigned_by_name?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at?: string;
}
interface TaskStats {
  total: number; todo: number; in_progress: number; done: number;
  high_priority_open: number; overdue: number;
}
interface AssignableUser {
  id: number | string; full_name?: string; username?: string; email?: string; role?: string;
}
interface AnalyticsData {
  avg_office_days?: number; peak_day?: string; utilization_rate?: number;
  daily?: {day:string;office:number;remote:number;away:number}[];
}
interface AttendanceRecord { status:'office'|'remote'|'away'; note:string; since:string; }

/* ══ NAV ══ */
const NAV_ALL = [
  { id:'overview',  label:'Overview',    adminOnly:false, icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id:'team',      label:'Team',        adminOnly:false, icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id:'tasks',     label:'Tasks',       adminOnly:false, icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id:'analytics', label:'Analytics',   adminOnly:true,  icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id:'manage',    label:'Manage Team', adminOnly:true,  icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id:'settings',  label:'Settings',    adminOnly:false, icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const STATUS_CFG: Record<string,{label:string;color:string;bg:string;dot:string;icon:string}> = {
  office: { label:'In Office', color:'#d45e00', bg:'rgba(249,115,22,.1)',  dot:'#f97316', icon:'🏢' },
  remote: { label:'Remote',    color:'#4228cf', bg:'rgba(92,59,255,.1)',   dot:'#a89fff', icon:'🏠' },
  away:   { label:'Away',      color:'#6b6860', bg:'rgba(0,0,0,.06)',      dot:'#c8c5be', icon:'🌴' },
};

const AVATAR_COLORS = ['#f97316','#a89fff','#fbbf24','#34d399','#fb7185','#60a5fa','#c084fc','#f43f5e','#38bdf8','#4ade80'];

/* ══ HELPERS ══ */
const getInitials = (name?:string) => (name||'U').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);
const getColor    = (id:number|string, fb?:string) => fb || AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
const fmtDate     = (d:string) => { try { return new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); } catch { return d; } };
const timeAgo     = (d:string) => { try { const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return`${s}s ago`; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; } catch { return d; } };

/* Avatar component - Updated to always be circular with better image fit */
const Avatar = ({
  name, picture, size=36, bg, fontSize=11, apiBase='',
}:{name?:string;picture?:string;size?:number;bg?:string;fontSize?:number;apiBase?:string}) => {
  const src = picture
  ? (picture.startsWith('data:') || picture.startsWith('http')
      ? picture
      : `${apiBase}${picture}`)
  : null;
  const fallbackBg = bg || AVATAR_COLORS[Math.abs(String(name||'U').charCodeAt(0)||0) % AVATAR_COLORS.length];
  return (
    <div style={{
      width:size, 
      height:size, 
      borderRadius:'50%', /* Always circular */
      flexShrink:0, 
      overflow:'hidden', 
      position:'relative',
      background: fallbackBg,
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center',
    }}>
      {src && (
        <img 
          src={src} 
          alt={name||'User'}
          style={{
            position:'absolute',
            inset:0,
            width:'100%',
            height:'100%',
            objectFit:'cover', /* Better image fit */
            objectPosition:'center',
          }}
          onError={e=>{(e.target as HTMLImageElement).style.display='none'}}
        />
      )}
      <span style={{
        fontSize, 
        fontWeight:900, 
        color:'#fff', 
        lineHeight:1, 
        position:'relative', 
        zIndex:src ? -1 : 0, /* Hide initials when image loads */
      }}>
        {getInitials(name)}
      </span>
    </div>
  );
};

const normaliseTeam = (raw:TeamMember[]):TeamMember[] => raw.map(m => ({
  ...m,
  name:            m.full_name || m.fullname || m.name || m.username || 'Unknown',
  where:           m.note || m.location || m.where || '—',
  since:           m.checkin_time || m.since || '—',
  bg:              getColor(m.id, m.avatar_color || m.bg),
  status:          (m.status as 'office'|'remote'|'away') || 'away',
  profile_picture: m.profile_picture || undefined,
}));

const normaliseActivity = (raw:ActivityItem[]):ActivityItem[] => raw.map((a,i) => ({
  ...a,
  name:            a.user_name || a.name || 'Someone',
  time:            a.time || (a.created_at ? timeAgo(a.created_at) : ''),
  bg:              getColor(i, a.avatar_color || a.bg),
  icon:            a.icon || '📋',
  profile_picture: a.profile_picture || undefined,
}));

/* ══ ATTENDANCE localStorage ══ */
const LS_KEY = 'timso_attendance';
const getAtt = ():AttendanceRecord|null => { try { const v=localStorage.getItem(LS_KEY); return v?JSON.parse(v):null; } catch { return null; } };
const saveAtt = (s:'office'|'remote'|'away', note:string):AttendanceRecord => {
  const r:AttendanceRecord = { status:s, note, since:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) };
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch {}
  return r;
};

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');

*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;cursor:none;transition:background .3s,color .3s}

:root{
  --bg:#faf9f7;
  --bg2:#fff;
  --bg3:#f2f0eb;
  --sidebar:#fff;
  --header:#fff;
  --stat-size:36px;
  --card:#fff;
  --card-border:rgba(0,0,0,.07);
  --text:#0f0e0c;
  --text2:#6b6860;
  --text3:#9e9b94;
  --text4:#c8c5be;
  --border:rgba(0,0,0,.07);
  --border2:rgba(0,0,0,.1);
  --hover:rgba(0,0,0,.05);
  --hover2:rgba(0,0,0,.03);
  --input-bg:#fff;
  --pill-bg:#f8f7f4;
}
body.dark{
  --bg:#0f0e0c;
  --bg2:#1a1916;
  --bg3:#252320;
  --sidebar:#111009;
  --header:#111009;
  --card:#1a1916;
  --card-border:rgba(255,255,255,.07);
  --text:#f0ede8;
  --text2:#a09d97;
  --text3:#7a7770;
  --text4:#4a4744;
  --border:rgba(255,255,255,.07);
  --border2:rgba(255,255,255,.1);
  --hover:rgba(255,255,255,.06);
  --hover2:rgba(255,255,255,.04);
  --input-bg:#111009;
  --pill-bg:#1e1c19;
  border-color: rgba(255,255,255,.07) !important;
}

body.dark .card { border-color: var(--card-border) !important; }
body.dark .sidebar-wrap { border-right-color: var(--border) !important; }
body.dark .header-pad { border-bottom-color: var(--border) !important; }
body.dark .nav-item { border-color: transparent !important; }
body.dark .quick-btn { border-color: var(--card-border) !important; }
body.dark .inp { border-color: var(--border2) !important; }
body.dark .btn-ghost { border-color: var(--border2) !important; }
body.dark .status-badge { border: none !important; }
body.dark [class*="border"] { border-color: rgba(255,255,255,.07) !important; }
body.dark hr { border-color: rgba(255,255,255,.07) !important; }
body.dark .tab-btn { border: none !important; }
body.dark .st-pill { border-color: var(--border2) !important; }
body.dark .ref-btn { border-color: var(--card-border) !important; }

.av-wrap{position:relative;flex-shrink:0}
.av-dot{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--card);z-index:2}

@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes sheetIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

.a-rise{opacity:0;animation:riseIn .55s cubic-bezier(.16,1,.3,1) forwards}
.a-slide{opacity:0;animation:slideIn .45s cubic-bezier(.16,1,.3,1) forwards}
.live-dot{animation:pulse 2s ease-in-out infinite}

#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .15s,height .15s,opacity .15s}
body.cm #cur{width:20px!important;height:20px!important}
body.ch #cur{width:17px!important;height:17px!important;opacity:.7}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}
body.cd #cur path{fill:#fff!important;stroke:#fff!important}

.nav-item{transition:all .18s;border-radius:12px;cursor:none;display:flex;align-items:center;gap:12px;width:100%;text-align:left;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;padding:10px 12px;border:none}
.nav-item:hover{background:var(--hover)}
.nav-item.active{background:var(--text);color:var(--bg)!important}
.nav-item.active svg{stroke:#fff!important}

.card{background:var(--card);border:1px solid var(--card-border);border-radius:20px;transition:box-shadow .28s,transform .28s,background .3s,border-color .3s}
.card:hover{box-shadow:0 8px 32px rgba(0,0,0,.08);transform:translateY(-2px)}

.team-row{transition:background .18s;border-radius:14px;cursor:none}
.team-row:hover{background:var(--hover2)}

.status-badge{border-radius:100px;font-size:11px;font-weight:700;padding:3px 10px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.act-item{transition:background .18s;border-radius:12px;cursor:none}
.act-item:hover{background:var(--hover2)}

.quick-btn{border:1.5px solid var(--card-border);border-radius:14px;background:var(--card);cursor:none;transition:all .18s;display:flex;align-items:center;gap:10px;padding:13px 15px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:var(--text);width:100%}
.quick-btn:hover{border-color:#f97316;background:rgba(249,115,22,.05);transform:translateY(-2px)}

.logout-btn{transition:all .18s;border-radius:12px;cursor:none}
.logout-btn:hover{background:rgba(239,68,68,.08);color:#ef4444}

.tab-btn{border-radius:10px;font-size:12px;font-weight:600;padding:6px 14px;cursor:none;border:none;transition:all .18s;font-family:'Outfit',sans-serif}
.tab-btn.active{background:var(--text);color:var(--bg)}
.tab-btn:not(.active):hover{background:var(--hover);color:var(--text)}

.sk{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg2) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.spin{width:15px;height:15px;border:2px solid rgba(0,0,0,.1);border-top-color:#f97316;border-radius:50%;animation:spin .65s linear infinite;display:inline-block}

.toast{position:fixed;bottom:24px;right:24px;z-index:99998;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;animation:riseIn .35s cubic-bezier(.16,1,.3,1) forwards;box-shadow:0 8px 28px rgba(0,0,0,.14)}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justifyContent:'center';animation:overlayIn .2s ease;padding:16px}
.sheet{background:var(--card);border-radius:24px;padding:32px;width:100%;max-width:480px;box-shadow:0 24px 80px rgba(0,0,0,.18);animation:sheetIn .3s cubic-bezier(.16,1,.3,1) forwards;margin:16px}

.inp{width:100%;border:1.5px solid var(--border2);border-radius:12px;padding:10px 14px;font-size:13px;font-family:'Outfit',sans-serif;color:var(--text);outline:none;transition:border-color .18s,background .3s;background:var(--input-bg);box-sizing:border-box}
.inp:focus{border-color:#f97316}

.lbl{font-size:12px;font-weight:700;color:var(--text2);display:block;margin-bottom:6px}
.st-pill{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border-radius:12px;border:1.5px solid var(--border2);cursor:none;font-size:11px;font-weight:700;font-family:'Outfit',sans-serif;transition:all .18s;background:transparent;flex:1;justify-content:center}

.admin-badge{font-size:9px;font-weight:900;padding:2px 8px;border-radius:100px;letter-spacing:.1em;text-transform:uppercase;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;white-space:nowrap}
.ref-btn{border:1px solid var(--card-border);border-radius:10px;background:var(--card);cursor:none;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:6px;transition:all .18s}
.ref-btn:hover{border-color:#f97316;color:#f97316}

.src{font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase}
.src.live{background:rgba(34,197,94,.12);color:#16a34a}
.src.mock{background:rgba(249,115,22,.12);color:#d45e00}

.btn-primary{background:#0f0e0c;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:none;padding:11px 24px;transition:all .18s;font-family:'Outfit',sans-serif;display:inline-flex;align-items:center;gap:8px}
.btn-primary:hover{background:#2d2b28}
.btn-primary:disabled{opacity:.45}

.btn-ghost{background:transparent;color:var(--text2);border:1.5px solid var(--border2);border-radius:12px;font-size:13px;font-weight:700;cursor:none;padding:11px 24px;transition:all .18s;font-family:'Outfit',sans-serif}
.btn-ghost:hover{border-color:var(--text);color:var(--text)}

.btn-danger{background:rgba(239,68,68,.1);color:#ef4444;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:none;width:100%;padding:12px;transition:all .18s;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.18)}

@media(max-width: 1024px){
  .grid-stats{ grid-template-columns: repeat(2, 1fr) !important; }
  .grid-main{ grid-template-columns: 1fr !important; }
  .grid-team-cards{ grid-template-columns: repeat(2, 1fr) !important; }
}
@media(max-width: 768px){
  .sidebar-wrap{ position: fixed !important; left: -260px; top: 0; bottom: 0; z-index: 200; }
  .sidebar-wrap.open{ left: 0; }
  .mob-menu-btn{ display: flex; }
  .grid-stats{ grid-template-columns: 1fr !important; }
}
`;

const SkCard = () => (
  <div className="card" style={{padding:'20px 24px'}}>
    <div className="sk" style={{height:11,width:'55%',marginBottom:14}}/>
    <div className="sk" style={{height:34,width:'38%',marginBottom:8}}/>
    <div className="sk" style={{height:9,width:'28%'}}/>
  </div>
);

const SkRow = () => (
  <div style={{display:'flex',alignItems:'center',gap:12,padding:12}}>
    <div className="sk" style={{width:36,height:36,borderRadius:'50%',flexShrink:0}}/>
    <div style={{flex:1}}>
      <div className="sk" style={{height:11,width:'48%',marginBottom:7}}/>
      <div className="sk" style={{height:9,width:'32%'}}/>
    </div>
    <div className="sk" style={{height:22,width:68,borderRadius:100}}/>
  </div>
);

const Toast = ({msg,type}:{msg:string;type:'success'|'error'}) => (
  <div className="toast" style={{background:type==='success'?'#0f0e0c':'#ef4444',color:'#fff'}}>
    <span>{type==='success'?'✓':'✕'}</span> {msg}
  </div>
);

function TaskModal({ users, onSubmit, onClose, loading, dark }: {
  users: AssignableUser[];
  onSubmit: (d:{title:string;description:string;assigned_to:string;priority:string;due_date:string}) => void;
  onClose: () => void;
  loading: boolean;
  dark: boolean;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const valid = title.trim() && assignedTo;

  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="sheet" style={{maxWidth:520}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <h2 className="font-syne" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px',margin:0,color:dark?'#f0ede8':'#0f0e0c'}}>Assign Task</h2>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(0,0,0,.08)',background:dark?'#1e1c19':'#f8f7f4',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{marginBottom:14}}>
          <label className="lbl">Assign to *</label>
          <select className="inp" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
            <option value="">Select team member…</option>
            {users.map(u=>(
              <option key={u.id} value={String(u.id)}>{u.full_name||u.username}</option>
            ))}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <label className="lbl">Task title *</label>
          <input className="inp" value={title} onChange={e=>setTitle(e.target.value)}/>
        </div>
        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" disabled={!valid||loading} onClick={()=>onSubmit({title,description:desc,assigned_to:assignedTo,priority,due_date:dueDate})} style={{flex:2,justifyContent:'center'}}>Assign Task</button>
        </div>
      </div>
    </div>
  );
}

function AttendanceModal({current,onSave,onClose,dark}:{current:AttendanceRecord;onSave:(s:'office'|'remote'|'away',note:string)=>void;onClose:()=>void;dark:boolean}) {
  const [status,setStatus] = useState<'office'|'remote'|'away'>(current.status);
  const [note,setNote] = useState(current.note);
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="sheet">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <h2 className="font-syne" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px',margin:0,color:dark?'#f0ede8':'#0f0e0c'}}>Update Status</h2>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(0,0,0,.08)',background:dark?'#1e1c19':'#f8f7f4',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" onClick={()=>{onSave(status,note);onClose()}} style={{flex:2,justifyContent:'center'}}>Save Status</button>
        </div>
      </div>
    </div>
  );
}

function SwapModal({onSubmit,onClose,loading,dark}:{onSubmit:(f:string,t:string,r:string)=>void;onClose:()=>void;loading:boolean;dark:boolean}) {
  const today=new Date().toISOString().split('T')[0];
  const [from,setFrom]=useState('');const [to,setTo]=useState('');const [reason,setReason]=useState('');
  const valid=from&&to&&from!==to;
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="sheet">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <h2 className="font-syne" style={{fontWeight:900,fontSize:20,margin:0}}>Request Swap</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" disabled={!valid||loading} onClick={()=>onSubmit(from,to,reason)} style={{flex:2,justifyContent:'center'}}>Submit</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav,setActiveNav] = useState('overview');
  const [statusTab,setStatusTab] = useState<'all'|'office'|'remote'|'away'>('all');
  const [time,setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark,setDark] = useState<boolean>(false);
  const [toast,setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showAttModal,setShowAttModal] = useState(false);
  const [showSwapModal,setShowSwapModal] = useState(false);
  const [swapLoading,setSwapLoading] = useState(false);

  const [user,setUser] = useState<User|null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [team,setTeam] = useState<TeamMember[]>([]);
  const [activity,setActivity] = useState<ActivityItem[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats|null>(null);
  const [assignUsers, setAssignUsers] = useState<AssignableUser[]>([]);
  const [ldTasks, setLdTasks] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData|null>(null);
  const [myAtt,setMyAtt] = useState<AttendanceRecord>({status:'office',note:'',since:'—'});

  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');

  const [ldUser,setLdUser] = useState(true);
  const [ldTeam,setLdTeam] = useState(true);
  const [ldAct,setLdAct] = useState(true);
  const [ldSwaps,setLdSwaps] = useState(false);
  const [ldAna,setLdAna] = useState(false);
  const [refreshing,setRefreshing] = useState(false);
  const [teamSrc,setTeamSrc] = useState<'live'|'error'>('live');

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('new-application', (data) => {
      showToast(`New application from ${data.user.full_name || data.user.username}`);
      fetchApplications();
    });
    socket.on('application-update', (data) => {
      showToast(`Your application to ${data.companyName} was ${data.status}!`);
      axios.get(`${API}/api/auth/me`, { withCredentials: true }).then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (u) setUser(u);
      });
    });
    return () => { socket.off('new-application'); socket.off('application-update'); };
  }, [socket]);

  const isAdmin = user?.role === 'admin';
  const NAV = NAV_ALL.filter(n => !n.adminOnly || isAdmin);

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(()=>{
    if (!mounted) return;
    const tick=()=>setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
    tick(); const t=setInterval(tick,1000); return()=>clearInterval(t);
  },[mounted]);

  useEffect(()=>{
    if (!mounted) return;
    const saved = localStorage.getItem('timso_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
  },[mounted]);

  useEffect(()=>{
    if (!mounted) return;
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('timso_theme', dark ? 'dark' : 'light');
  },[dark, mounted]);

  useEffect(()=>{
    if (!mounted) return;
    setLdUser(true);
    axios.get(`${API}/api/auth/me`,{withCredentials:true})
      .then(r=>{
        const d=r.data;
        const u=d?.user||d?.data?.user||d?.data||d||null;
        if(u)setUser(u);
      })
      .finally(()=>setLdUser(false));
  },[mounted]);

  const fetchTeam = useCallback(async(silent=false)=>{
    if (!mounted) return;
    if(!silent)setLdTeam(true); else setRefreshing(true);
    try {
      const r = await axios.get(`${API}/api/attendance/team`,{withCredentials:true});
      const d = r.data?.data?.team || r.data?.team || r.data;
      if(Array.isArray(d)) setTeam(normaliseTeam(d));
    } catch { setTeam([]); }
    finally { setLdTeam(false); setRefreshing(false); }
  },[mounted]);

  const fetchActivity = useCallback(async()=>{
    if (!mounted) return;
    setLdAct(true);
    try {
      const r = await axios.get(`${API}/api/activity`,{withCredentials:true});
      const d = r.data?.data || r.data;
      if(Array.isArray(d)) setActivity(normaliseActivity(d.slice(0,15)));
    } catch { setActivity([]); }
    finally { setLdAct(false); }
  },[mounted]);

  const fetchCompanies = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/companies`, { withCredentials: true });
      if (r.data?.success) setCompanies(r.data.companies);
    } catch {}
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/companies/applications`, { withCredentials: true });
      if (r.data?.success) setApplications(r.data.applications);
    } catch {}
  }, []);

  const handleRegisterCompany = async () => {
    if (!companyName.trim()) return;
    setIsRegistering(true);
    try {
      const r = await axios.post(`${API}/api/companies/register`, { name: companyName, description: companyDesc }, { withCredentials: true });
      if (r.data?.success) { showToast('Company registered!'); setUser(prev => prev ? { ...prev, company_id: r.data.company.id } : prev); }
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setIsRegistering(false);
  };

  const handleApplyCompany = async (companyId: string | number) => {
    setIsApplying(true);
    try {
      const r = await axios.post(`${API}/api/companies/apply`, { companyId }, { withCredentials: true });
      if (r.data?.success) showToast('Applied!');
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setIsApplying(false);
  };

  const handleApplication = async (applicationId: string | number, status: 'accepted' | 'rejected') => {
    try {
      const r = await axios.post(`${API}/api/companies/handle-application`, { applicationId, status }, { withCredentials: true });
      if (r.data?.success) { showToast(`Application ${status}!`); fetchApplications(); fetchTeam(); }
    } catch (err: any) { showToast('Failed', 'error'); }
  };

  useEffect(()=>{
    if (!mounted) return;
    fetchTeam(); fetchActivity();
  },[fetchTeam,fetchActivity, mounted]);

  useEffect(()=>{
    if (!mounted) return;
    if (user && !user.company_id) {
      if (user.role === 'user') fetchCompanies();
    } else if (user && user.company_id && isAdmin) {
      fetchApplications();
    }
  }, [user, mounted, fetchCompanies, fetchApplications, isAdmin]);

  const handleSaveAtt = async(status:'office'|'remote'|'away', note:string) => {
    const r = saveAtt(status,note);
    setMyAtt(r);
    try { await axios.post(`${API}/api/attendance`,{status,note},{withCredentials:true}); fetchTeam(true); } catch {}
  };

  const logout = async()=>{
    try{await axios.post(`${API}/api/auth/logout`,{},{withCredentials:true});}catch{}
    router.push('/login');
  };

  const displayName = user?.full_name||user?.username||'Team';
  const greet = () => { const h=new Date().getHours(); if(h<12)return'morning'; if(h<17)return'afternoon'; return'evening'; };

  return (
    <>
      <style>{G}</style>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:dark?'#0f0e0c':'#faf9f7'}}>
        <aside className={`sidebar-wrap ${mobileOpen?'open':''}`}>
          <div style={{padding:24,fontSize:20,fontWeight:900}}>timso</div>
          <nav style={{padding:12,flex:1}}>
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>setActiveNav(item.id)} className={`nav-item ${activeNav===item.id?'active':''}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{padding:12}}><button onClick={logout} className="logout-btn">Logout</button></div>
        </aside>

        <main style={{flex:1,display:'flex',flexDirection:'column'}}>
          <header className="header-pad" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',background:dark?'#111009':'#fff'}}>
            <h1 style={{fontSize:18,fontWeight:900}}>{NAV.find(n=>n.id===activeNav)?.label}</h1>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button onClick={()=>setDark(!dark)}>{dark?'Light':'Dark'}</button>
              <div style={{fontWeight:700}}>{time}</div>
            </div>
          </header>

          <div className="main-content-pad" style={{padding:32,flex:1,overflowY:'auto'}}>
            {user && !user.company_id ? (
              <div style={{maxWidth:600,margin:'40px auto'}}>
                {user.role==='admin' ? (
                  <div className="card" style={{padding:32,textAlign:'center'}}>
                    <h2>Register Company</h2>
                    <input className="inp" placeholder="Name" value={companyName} onChange={e=>setCompanyName(e.target.value)} style={{marginBottom:12}}/>
                    <button className="btn-primary" onClick={handleRegisterCompany} disabled={isRegistering}>Register</button>
                  </div>
                ) : (
                  <div className="card" style={{padding:32}}>
                    <h2>Find Company</h2>
                    {companies.map(c=>(
                      <div key={c.id} style={{padding:12,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
                        <span>{c.name}</span>
                        <button onClick={()=>handleApplyCompany(c.id)}>Apply</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {activeNav==='overview' && (
                  <div>
                    {isAdmin && applications.length>0 && (
                      <div className="card" style={{padding:20,marginBottom:20}}>
                        <h3>Pending Applications</h3>
                        {applications.map(app=>(
                          <div key={app.id} style={{display:'flex',justifyContent:'space-between',padding:10}}>
                            <span>{app.full_name||app.username}</span>
                            <div>
                              <button onClick={()=>handleApplication(app.id,'accepted')}>Accept</button>
                              <button onClick={()=>handleApplication(app.id,'rejected')}>Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <h2>Good {greet()}, {displayName} 👋</h2>
                    <button onClick={()=>setShowAttModal(true)}>Update Status</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    axios.get(`${API}/api/auth/me`, { withCredentials: true }).then(r => {
      const u = r.data?.user || r.data?.data?.user || r.data;
      if (u) setUser(u);
    });
  }, []);
  if (!mounted) return null;
  return (
    <SocketProvider userId={user?.id}>
      <Dashboard />
    </SocketProvider>
  );
}
