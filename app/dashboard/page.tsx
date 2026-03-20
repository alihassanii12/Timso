'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

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
  const src = picture ? (picture.startsWith('http') ? picture : `${apiBase}${picture}`) : null;
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

/* ══ COMPLETE RESPONSIVE CSS WITH DARK MODE FIXES ══ */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');

*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;cursor:none;transition:background .3s,color .3s}

/* ── CSS VARIABLES ── */
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
  
  /* Fix all borders to be dark */
  border-color: rgba(255,255,255,.07) !important;
}

/* Dark mode border fixes */
body.dark .card {
  border-color: var(--card-border) !important;
}

body.dark .sidebar-wrap {
  border-right-color: var(--border) !important;
}

body.dark .header-pad {
  border-bottom-color: var(--border) !important;
}

body.dark .nav-item {
  border-color: transparent !important;
}

body.dark .quick-btn {
  border-color: var(--card-border) !important;
}

body.dark .inp {
  border-color: var(--border2) !important;
}

body.dark .btn-ghost {
  border-color: var(--border2) !important;
}

body.dark .status-badge {
  border: none !important;
}

body.dark [class*="border"] {
  border-color: rgba(255,255,255,.07) !important;
}

body.dark [style*="border: 1px solid rgba(0,0,0,"] {
  border-color: rgba(255,255,255,.07) !important;
}

body.dark [style*="border: 1.5px solid rgba(0,0,0,"] {
  border-color: rgba(255,255,255,.1) !important;
}

body.dark hr {
  border-color: rgba(255,255,255,.07) !important;
}

body.dark .tab-btn {
  border: none !important;
}

body.dark .tab-btn.active {
  border: none !important;
}

body.dark .st-pill {
  border-color: var(--border2) !important;
}

body.dark .ref-btn {
  border-color: var(--card-border) !important;
}

/* Avatar dot positioning */
.av-wrap{position:relative;flex-shrink:0}
.av-dot{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--card);z-index:2}

/* ── ANIMATIONS ── */
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

/* ── CUSTOM CURSOR ── */
#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .15s,height .15s,opacity .15s}
body.cm #cur{width:20px!important;height:20px!important}
body.ch #cur{width:17px!important;height:17px!important;opacity:.7}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}
body.cd #cur path{fill:#fff!important;stroke:#fff!important}

/* ── COMPONENT STYLES ── */
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

.bar-fill{transition:width 1s cubic-bezier(.16,1,.3,1)}
.tab-btn{border-radius:10px;font-size:12px;font-weight:600;padding:6px 14px;cursor:none;border:none;transition:all .18s;font-family:'Outfit',sans-serif}
.tab-btn.active{background:var(--text);color:var(--bg)}
.tab-btn:not(.active){background:transparent;color:var(--text2)}
.tab-btn:not(.active):hover{background:var(--hover);color:var(--text)}

.sk{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg2) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.spin{width:15px;height:15px;border:2px solid rgba(0,0,0,.1);border-top-color:#f97316;border-radius:50%;animation:spin .65s linear infinite;display:inline-block}

.toast{position:fixed;bottom:24px;right:24px;z-index:99998;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;animation:riseIn .35s cubic-bezier(.16,1,.3,1) forwards;box-shadow:0 8px 28px rgba(0,0,0,.14)}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease;padding:16px}
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

.av-wrap{position:relative;flex-shrink:0}
.av-dot{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;border:2px solid var(--card);z-index:2}

.swap-badge{border-radius:100px;font-size:10px;font-weight:800;padding:2px 9px;text-transform:uppercase;letter-spacing:.06em}
.btn-primary{background:#0f0e0c;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:none;padding:11px 24px;transition:all .18s;font-family:'Outfit',sans-serif;display:inline-flex;align-items:center;gap:8px}
.btn-primary:hover{background:#2d2b28}
.btn-primary:disabled{opacity:.45}

.btn-ghost{background:transparent;color:var(--text2);border:1.5px solid var(--border2);border-radius:12px;font-size:13px;font-weight:700;cursor:none;padding:11px 24px;transition:all .18s;font-family:'Outfit',sans-serif}
.btn-ghost:hover{border-color:var(--text);color:var(--text)}

.btn-danger{background:rgba(239,68,68,.1);color:#ef4444;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:none;width:100%;padding:12px;transition:all .18s;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.18)}

/* ── DARK MODE OVERRIDES ── */
body.dark{color:#f0ede8}
body.dark *{border-color:inherit}
body.dark [style*="color:#0f0e0c"]{color:#f0ede8!important}
body.dark [style*="color:#6b6860"]{color:#a09d97!important}
body.dark [style*="color:#9e9b94"]{color:#7a7770!important}
body.dark [style*="color:#c8c5be"]{color:#5a5752!important}
body.dark .card:hover{box-shadow:0 8px 32px rgba(0,0,0,.4)}
body.dark .nav-item.active{background:#f97316;color:#fff!important}
body.dark .logout-btn:hover{background:rgba(239,68,68,.15)}

/* ══════════════════════════════════════════
   COMPLETE RESPONSIVE DESIGN
══════════════════════════════════════════ */

/* Mobile menu button - only visible on mobile */
.mob-menu-btn{
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card);
  cursor: none;
  flex-shrink: 0;
  transition: all 0.18s;
}
.mob-menu-btn:hover{border-color:#f97316}

/* Sidebar overlay */
.sidebar-overlay{
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 199;
  animation: overlayIn 0.2s ease;
}

/* Sidebar - desktop */
.sidebar-wrap{
  display: flex;
  flex-direction: column;
  width: 260px;
  flex-shrink: 0;
  height: 100vh;
  border-right: 1px solid var(--border);
  background: var(--sidebar);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 200;
}

/* Main content area */
.main-content-pad{
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: var(--bg);
}

/* Responsive grid layouts */
.grid-stats{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.grid-main{
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
}

.grid-team-cards{
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analytics-grid{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Hide on mobile */
.desktop-only{
  display: block;
}
.mobile-only{
  display: none;
}

/* Theme toggle */
.theme-toggle{
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  transition: all .18s;
}
.theme-toggle:hover{
  border-color: #f97316;
  color: #f97316;
}

/* Responsive task items */
.task-item{
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}
.task-actions{
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

/* Status badge group */
.status-group{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Hide labels on mobile */
.toggle-label{
  display: inline;
}

/* ── LAPTOP (1024px and below) ── */
@media(max-width: 1024px){
  .grid-stats{
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .grid-main{
    grid-template-columns: 1fr !important;
  }
  .grid-team-cards{
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .main-content-pad{
    padding: 24px;
  }
}

/* ── TABLET (768px and below) ── */
@media(max-width: 768px){
  /* Sidebar becomes drawer */
  .sidebar-wrap{
    position: fixed !important;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 200;
    box-shadow: none;
  }
  .sidebar-wrap.open{
    left: 0 !important;
    box-shadow: 12px 0 48px rgba(0,0,0,0.25) !important;
  }
  .sidebar-overlay{
    display: block;
  }
  .mob-menu-btn{
    display: flex !important;
  }
  
  /* Header adjustments - only notification icon visible */
  .header-pad{
    padding: 0 16px !important;
    height: 56px !important;
  }
  .header-title{
    font-size: 16px !important;
  }
  
  /* Hide all header elements except hamburger, title, and notification */
  .header-pad .ref-btn,
  .header-pad .theme-toggle,
  .header-pad > div:last-child > div:not(:last-child) {
    display: none !important;
  }
  
  /* Keep notification button visible */
  .header-pad > div:last-child > button:last-child {
    display: flex !important;
  }
  
  /* Content padding */
  .main-content-pad{
    padding: 16px !important;
  }
  
  /* Grids */
  .grid-stats{
    gap: 12px !important;
  }
  .grid-team-cards{
    gap: 12px !important;
  }
  .analytics-grid{
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }
  
  /* Task items stack */
  .task-item{
    flex-direction: column;
    align-items: stretch;
  }
  .task-actions{
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 12px;
  }
  
  /* Scrollable tabs */
  .tabs-scroll{
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  .tabs-scroll::-webkit-scrollbar{
    display: none;
  }
  .tabs-scroll .tab-group{
    display: flex;
    gap: 4px;
    width: max-content;
  }
  
  /* Hide where column on team rows */
  .team-row-where{
    display: none !important;
  }
  
  /* Modal adjustments */
  .sheet{
    padding: 24px;
    margin: 12px;
    max-height: 90vh;
    overflow-y: auto;
  }
}

/* ── MOBILE (480px and below) ── */
@media(max-width: 480px){
  /* Single column everything */
  .grid-stats{
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }
  .grid-team-cards{
    grid-template-columns: 1fr !important;
  }
  .analytics-grid{
    grid-template-columns: 1fr !important;
  }
  
  /* Font sizes */
  .stat-num{
    font-size: 28px !important;
    letter-spacing: -0.5px !important;
  }
  .header-title{
    font-size: 15px !important;
  }
  
  /* Content padding */
  .main-content-pad{
    padding: 12px !important;
  }
  
  /* Swap header */
  .swap-header{
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  .swap-header button{
    width: 100%;
  }
  
  /* Status pills */
  .status-group{
    flex-direction: column;
    align-items: stretch;
  }
  .status-group .status-badge{
    width: 100%;
    justify-content: center;
  }
  
  /* Hide theme toggle label */
  .toggle-label{
    display: none !important;
  }
  .theme-toggle{
    padding: 8px !important;
  }
  
  /* Task metadata stack */
  .task-meta{
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  /* Team cards */
  .team-card-content{
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .team-card-actions{
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  /* Quick actions */
  .quick-btn{
    padding: 10px 12px;
  }
  .quick-btn span:first-child{
    font-size: 20px;
  }
  
  /* Modal forms */
  .modal-grid{
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }
  .modal-actions{
    flex-direction: column;
  }
  .modal-actions button{
    width: 100%;
  }
  
  /* Avatar in settings */
  .settings-avatar{
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .settings-avatar-buttons{
    justify-content: center;
  }
  
  /* Hide some less important info */
  .hide-mobile{
    display: none !important;
  }
  .show-mobile{
    display: block !important;
  }
  
  /* Smaller cards */
  .card{
    border-radius: 16px;
  }
  .card-padding{
    padding: 16px !important;
  }
  
  /* Activity feed */
  .activity-item{
    flex-wrap: wrap;
  }
  .activity-time{
    margin-left: auto;
  }
}

/* ── VERY SMALL (360px and below) ── */
@media(max-width: 360px){
  .main-content-pad{
    padding: 8px !important;
  }
  .card{
    border-radius: 14px;
  }
  .card-padding{
    padding: 12px !important;
  }
  .nav-item{
    padding: 8px 10px;
    font-size: 12px;
  }
  .status-badge{
    font-size: 10px;
    padding: 2px 8px;
  }
  .btn-primary, .btn-ghost{
    padding: 8px 16px;
    font-size: 12px;
  }
}
`;

/* ══ SKELETON COMPONENTS ══ */
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

/* ══ TASK ASSIGNMENT MODAL ══ */
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
            <p style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>Create and assign a task to a team member</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(0,0,0,.08)',background:dark?'#1e1c19':'#f8f7f4',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{marginBottom:14}}>
          <label className="lbl">Assign to *</label>
          <select className="inp" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}
            style={{cursor:'none',appearance:'none'}}>
            <option value="">Select team member…</option>
            {users.map(u=>(
              <option key={u.id} value={String(u.id)}>
                {u.full_name||u.username} {u.role==='admin'?'(Admin)':''}
              </option>
            ))}
          </select>
        </div>

        <div style={{marginBottom:14}}>
          <label className="lbl">Task title *</label>
          <input className="inp" value={title} placeholder="e.g. Review Q3 report…"
            onChange={e=>setTitle(e.target.value)}/>
        </div>

        <div style={{marginBottom:14}}>
          <label className="lbl">Description <span style={{fontWeight:400,color:dark?'#4a4744':'#c8c5be'}}>(optional)</span></label>
          <textarea className="inp" value={desc} placeholder="Additional details…"
            rows={2} style={{resize:'none' as const,fontFamily:'Outfit,sans-serif'}}
            onChange={e=>setDesc(e.target.value)}/>
        </div>

        <div className="modal-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}}>
          <div>
            <label className="lbl">Priority</label>
            <div style={{display:'flex',gap:6}}>
              {(['low','medium','high'] as const).map(p=>{
                const colors:{[k:string]:{bg:string;color:string}} = {
                  low:{bg:'rgba(34,197,94,.1)',color:'#16a34a'},
                  medium:{bg:'rgba(249,115,22,.1)',color:'#f97316'},
                  high:{bg:'rgba(239,68,68,.1)',color:'#ef4444'},
                };
                const c = colors[p];
                return (
                  <button key={p} onClick={()=>setPriority(p)}
                    style={{flex:1,padding:'7px 4px',borderRadius:10,fontSize:11,fontWeight:700,cursor:'none',border:'1.5px solid',
                      borderColor:priority===p?c.color:'rgba(0,0,0,.08)',
                      background:priority===p?c.bg:'transparent',
                      color:priority===p?c.color:dark?'#7a7770':'#9e9b94',
                      textTransform:'capitalize' as const}}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="lbl">Due date <span style={{fontWeight:400,color:dark?'#4a4744':'#c8c5be'}}>(optional)</span></label>
            <input type="date" className="inp" value={dueDate} min={today}
              onChange={e=>setDueDate(e.target.value)}/>
          </div>
        </div>

        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" disabled={!valid||loading}
            onClick={()=>valid&&onSubmit({title:title.trim(),description:desc.trim(),assigned_to:assignedTo,priority,due_date:dueDate})}
            style={{flex:2,justifyContent:'center'}}>
            {loading&&<span className="spin" style={{borderTopColor:'#fff',width:13,height:13}}/>}
            Assign Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ ATTENDANCE MODAL ══ */
function AttendanceModal({current,onSave,onClose,dark}:{current:AttendanceRecord;onSave:(s:'office'|'remote'|'away',note:string)=>void;onClose:()=>void;dark:boolean}) {
  const [status,setStatus] = useState<'office'|'remote'|'away'>(current.status);
  const [note,setNote] = useState(current.note);
  const pills:[string,'office'|'remote'|'away',string,string][] = [
    ['🏢','office','In Office','#f97316'],['🏠','remote','Remote','#a89fff'],['🌴','away','Away','#fbbf24'],
  ];
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="sheet">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <h2 className="font-syne" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px',margin:0,color:dark?'#f0ede8':'#0f0e0c'}}>Update Status</h2>
            <p style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>Where are you working from today?</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(0,0,0,.08)',background:dark?'#1e1c19':'#f8f7f4',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="status-group" style={{display:'flex',gap:8,marginBottom:20}}>
          {pills.map(([icon,val,lbl,col])=>(
            <button key={val} onClick={()=>setStatus(val)} className="st-pill"
              style={{background:status===val?`${col}18`:'transparent',borderColor:status===val?col:'rgba(0,0,0,.08)',color:status===val?col:'#6b6860'}}>
              <span style={{fontSize:24}}>{icon}</span><span>{lbl}</span>
            </button>
          ))}
        </div>
        <div style={{marginBottom:22}}>
          <label className="lbl">{status==='office'?'Location / Floor':status==='remote'?'Working from where?':'Reason / Note'}</label>
          <input className="inp" value={note}
            placeholder={status==='office'?'e.g. 9th floor…':status==='remote'?'e.g. Home, Cafe…':'e.g. Day off, Sick leave…'}
            onChange={e=>setNote(e.target.value)}/>
        </div>
        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" onClick={()=>{onSave(status,note);onClose()}} style={{flex:2,justifyContent:'center'}}>Save Status</button>
        </div>
      </div>
    </div>
  );
}

/* ══ SWAP MODAL ══ */
function SwapModal({onSubmit,onClose,loading,dark}:{onSubmit:(f:string,t:string,r:string)=>void;onClose:()=>void;loading:boolean;dark:boolean}) {
  const today=new Date().toISOString().split('T')[0];
  const [from,setFrom]=useState('');const [to,setTo]=useState('');const [reason,setReason]=useState('');
  const valid=from&&to&&from!==to;
  return (
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="sheet">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <h2 className="font-syne" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px',margin:0,color:dark?'#f0ede8':'#0f0e0c'}}>Request Day Swap</h2>
            <p style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>Submit a request to swap your working day</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid rgba(0,0,0,.08)',background:dark?'#1e1c19':'#f8f7f4',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
          <div><label className="lbl">Leave this day</label><input type="date" className="inp" value={from} min={today} onChange={e=>setFrom(e.target.value)}/></div>
          <div><label className="lbl">Make up on</label><input type="date" className="inp" value={to} min={today} onChange={e=>setTo(e.target.value)}/></div>
        </div>
        {from&&to&&(
          <div style={{display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:12,background:dark?'#1e1c19':'#f8f7f4',marginBottom:16,width:'fit-content'}}>
            <div><div style={{fontSize:9,fontWeight:700,color:dark?'#7a7770':'#9e9b94',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Off</div><div style={{fontSize:13,fontWeight:800,color:dark?'#f0ede8':'#0f0e0c'}}>{fmtDate(from)}</div></div>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2.5"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            <div><div style={{fontSize:9,fontWeight:700,color:dark?'#7a7770':'#9e9b94',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Work</div><div style={{fontSize:13,fontWeight:800,color:dark?'#f0ede8':'#0f0e0c'}}>{fmtDate(to)}</div></div>
          </div>
        )}
        <div style={{marginBottom:22}}>
          <label className="lbl">Reason <span style={{fontWeight:400,color:dark?'#4a4744':'#c8c5be'}}>(optional)</span></label>
          <input className="inp" value={reason} placeholder="e.g. Family event…" onChange={e=>setReason(e.target.value)}/>
        </div>
        <div className="modal-actions" style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
          <button className="btn-primary" disabled={!valid||loading} onClick={()=>valid&&onSubmit(from,to,reason)} style={{flex:2,justifyContent:'center'}}>
            {loading&&<span className="spin" style={{borderTopColor:'#fff',width:13,height:13}}/>}Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN DASHBOARD ══ */
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav,setActiveNav] = useState('overview');
  const [statusTab,setStatusTab] = useState<'all'|'office'|'remote'|'away'>('all');
  const [time,setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark,setDark] = useState<boolean>(false); // Start with false for SSR
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

  const [ldUser,setLdUser] = useState(true);
  const [ldTeam,setLdTeam] = useState(true);
  const [ldAct,setLdAct] = useState(true);
  const [ldSwaps,setLdSwaps] = useState(false);
  const [ldAna,setLdAna] = useState(false);
  const [refreshing,setRefreshing] = useState(false);
  const [teamSrc,setTeamSrc] = useState<'live'|'error'>('live');

  const isAdmin = user?.role === 'admin';
  const NAV = NAV_ALL.filter(n => !n.adminOnly || isAdmin);

  const showToast = (msg:string,type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Clock - only run on client */
  useEffect(()=>{
    if (!mounted) return;
    const tick=()=>setTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
    tick(); const t=setInterval(tick,1000); return()=>clearInterval(t);
  },[mounted]);

  /* Dark mode - only run on client */
  useEffect(()=>{
    if (!mounted) return;
    const saved = localStorage.getItem('timso_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
  },[mounted]);

  useEffect(()=>{
    if (!mounted) return;
    document.body.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('dark-mode', dark);
    localStorage.setItem('timso_theme', dark ? 'dark' : 'light');
  },[dark, mounted]);

  const toggleDark = () => {
    setDark(!dark);
  };

  /* Cursor */
  useEffect(()=>{
    if (!mounted) return;
    const el=document.getElementById('cur') as HTMLElement;
    if(!el)return;
    let mt:ReturnType<typeof setTimeout>;
    const mv=(e:MouseEvent)=>{
      el.style.left=(e.clientX-2)+'px';el.style.top=(e.clientY-2)+'px';
      document.body.classList.add('cm');clearTimeout(mt);
      mt=setTimeout(()=>document.body.classList.remove('cm'),140);
      let n:Element|null=document.elementFromPoint(e.clientX,e.clientY);let dark=false;
      for(let i=0;i<5;i++){
        if(!n||n===document.body)break;
        const rgb=window.getComputedStyle(n).backgroundColor.match(/\d+/g);
        if(rgb){const[r,g,b,a]=rgb.map(Number);if((a===undefined||a>0.1)&&r<80&&g<80&&b<80){dark=true;break}}
        n=n.parentElement;
      }
      document.body.classList.toggle('cd',dark);
    };
    document.addEventListener('mousemove',mv);
    document.addEventListener('mousedown',()=>document.body.classList.add('ca'));
    document.addEventListener('mouseup',()=>document.body.classList.remove('ca'));
    return()=>document.removeEventListener('mousemove',mv);
  },[mounted]);

  /* Load saved attendance */
  useEffect(()=>{ 
    if (!mounted) return;
    const s=getAtt(); if(s)setMyAtt(s); 
  },[mounted]);

  /* Fetch user */
  useEffect(()=>{
    if (!mounted) return;
    setLdUser(true);
    axios.get(`${API}/api/auth/me`,{withCredentials:true})
      .then(r=>{
        const d=r.data;
        const u=d?.user||d?.data?.user||d?.data||d||null;
        if(u&&(u.id||u.email))setUser(u);
        else setUser(null);
      })
      .catch(()=>setUser(null))
      .finally(()=>setLdUser(false));
  },[mounted]);

  /* Fetch team */
  const fetchTeam = useCallback(async(silent=false)=>{
    if (!mounted) return;
    if(!silent)setLdTeam(true); else setRefreshing(true);
    try {
      const r = await axios.get(`${API}/api/attendance/team`,{withCredentials:true,timeout:8000});
      const d = r.data?.data?.team || r.data?.data?.members || r.data?.team || r.data?.members || r.data;
      if(Array.isArray(d)){
        setTeam(normaliseTeam(d));
        setTeamSrc('live');
      }
    } catch {
      try {
        const r2 = await axios.get(`${API}/api/team`,{withCredentials:true,timeout:8000});
        const d2 = r2.data?.data?.members || r2.data?.members || r2.data?.data || r2.data;
        if(Array.isArray(d2)){
          setTeam(normaliseTeam(d2));
          setTeamSrc('live');
        }
      } catch {
        setTeam([]);
        setTeamSrc('error');
      }
    } finally { setLdTeam(false); setRefreshing(false); }
  },[mounted]);

  /* Fetch activity */
  const fetchActivity = useCallback(async()=>{
    if (!mounted) return;
    setLdAct(true);
    try {
      const r = await axios.get(`${API}/api/activity`,{withCredentials:true,timeout:8000});
      const d = r.data?.data?.activity || r.data?.activity || r.data?.data || r.data;
      if(Array.isArray(d)) setActivity(normaliseActivity(d.slice(0,15)));
      else setActivity([]);
    } catch { setActivity([]); }
    finally { setLdAct(false); }
  },[mounted]);

  /* Fetch swaps */
  const fetchSwaps = useCallback(async()=>{
    if (!mounted) return;
    setLdSwaps(true);
    try {
      const r = await axios.get(`${API}/api/swaps`,{withCredentials:true,timeout:8000});
      const d = r.data?.data?.swaps || r.data?.swaps || r.data?.data || r.data;
      const items:SwapRequest[] = Array.isArray(d) ? d : [];
      setSwaps(items.map(s=>({...s, isOwn:String(s.requester_id)===String(user?.id)})));
    } catch { setSwaps([]); }
    finally { setLdSwaps(false); }
  },[user?.id, mounted]);

  /* Fetch tasks */
  const fetchTasks = useCallback(async()=>{
    if (!mounted) return;
    setLdTasks(true);
    try {
      const r = await axios.get(`${API}/api/tasks`,{withCredentials:true,timeout:8000});
      const d = r.data?.data;
      if(d?.tasks) setTasks(d.tasks);
      if(d?.stats) setTaskStats(d.stats);
    } catch { setTasks([]); }
    finally { setLdTasks(false); }
  },[mounted]);

  /* Fetch assign users */
  const fetchAssignUsers = useCallback(async()=>{
    if (!mounted || !isAdmin) return;
    try {
      const r = await axios.get(`${API}/api/tasks/users`,{withCredentials:true});
      const d = r.data?.data?.users;
      if(Array.isArray(d)) setAssignUsers(d);
    } catch {}
  },[isAdmin, mounted]);

  /* Fetch analytics */
  const fetchAnalytics = useCallback(async()=>{
    if (!mounted) return;
    setLdAna(true);
    try {
      const r = await axios.get(`${API}/api/team/analytics`,{withCredentials:true,timeout:8000});
      const d = r.data?.data || r.data;
      if(d&&typeof d==='object') setAnalytics(d);
    } catch { setAnalytics(null); }
    finally { setLdAna(false); }
  },[mounted]);

  useEffect(()=>{ 
    if (!mounted) return;
    fetchTeam(); fetchActivity(); 
  },[fetchTeam,fetchActivity, mounted]);
  
  useEffect(()=>{
    if (!mounted) return;
    if(activeNav==='swaps') fetchSwaps();
    if(activeNav==='tasks') { fetchTasks(); if(isAdmin) fetchAssignUsers(); }
    if(activeNav==='analytics'&&!analytics) fetchAnalytics();
  },[activeNav,analytics,isAdmin,fetchSwaps,fetchTasks,fetchAssignUsers,fetchAnalytics, mounted]);

  /* Save attendance */
  const handleSaveAtt = async(status:'office'|'remote'|'away', note:string) => {
    const r = saveAtt(status,note);
    setMyAtt(r);
    try {
      await axios.post(`${API}/api/attendance`,{status,note},{withCredentials:true});
      fetchTeam(true); fetchActivity();
    } catch {}
    showToast(`Status: ${STATUS_CFG[status].label}${note?` · ${note}`:''}`);
  };

  /* Submit swap */
  const handleSubmitSwap = async(from:string,to:string,reason:string)=>{
    setSwapLoading(true);
    try {
      await axios.post(`${API}/api/swaps`,{from_date:from,to_date:to,reason},{withCredentials:true});
      showToast('Day swap request submitted!');
      fetchSwaps();
    } catch { showToast('Failed to submit swap','error'); }
    setSwapLoading(false); setShowSwapModal(false);
  };

  /* Admin swap action */
  const handleSwapAction = async(id:number|string,action:'approve'|'decline')=>{
    try {
      await axios.post(`${API}/api/swaps/${id}/${action}`,{},{withCredentials:true});
      setSwaps(prev=>prev.map(s=>s.id===id?{...s,status:action==='approve'?'approved':'declined'}:s));
      showToast(`Swap ${action}d ✓`);
    } catch(err: unknown) {
      const e = err as {response?:{data?:{message?:string};status?:number}};
      const msg = e?.response?.data?.message || `Failed to ${action} swap`;
      const status = e?.response?.status;
      if(status === 403) showToast('Admin access required','error');
      else if(status === 401) showToast('Session expired — please login again','error');
      else showToast(msg,'error');
    }
  };

  /* Create task */
  const handleCreateTask = async(data:{title:string;description:string;assigned_to:string;priority:string;due_date:string})=>{
    try {
      await axios.post(`${API}/api/tasks`,data,{withCredentials:true});
      showToast('Task assigned successfully!');
      fetchTasks();
      setShowTaskModal(false);
    } catch(err:unknown) {
      const e=err as {response?:{data?:{message?:string}}};
      showToast(e?.response?.data?.message||'Failed to create task','error');
    }
  };

  /* Update task status */
  const handleUpdateTaskStatus = async(id:number|string, status:string)=>{
    try {
      await axios.patch(`${API}/api/tasks/${id}/status`,{status},{withCredentials:true});
      setTasks(prev=>prev.map(t=>t.id===id?{...t,status:status as Task['status']}:t));
      showToast(`Task marked as ${status.replace('_',' ')}`);
    } catch(err:unknown) {
      const e=err as {response?:{data?:{message?:string}}};
      showToast(e?.response?.data?.message||'Failed to update','error');
    }
  };

  /* Delete task */
  const handleDeleteTask = async(id:number|string)=>{
    try {
      await axios.delete(`${API}/api/tasks/${id}`,{withCredentials:true});
      setTasks(prev=>prev.filter(t=>t.id!==id));
      showToast('Task deleted');
    } catch { showToast('Failed to delete','error'); }
  };

  /* Avatar upload */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await axios.post(`${API}/api/avatar/upload`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = r.data?.data?.avatar_url;
      if (url) setUser(prev => prev ? { ...prev, profile_picture: url } : prev);
      showToast('Profile picture updated!');
    } catch (err: unknown) {
      const e = err as {response?:{data?:{message?:string}}};
      showToast(e?.response?.data?.message || 'Upload failed', 'error');
    }
    setAvatarUploading(false);
    e.target.value = '';
  };

  const handleAvatarRemove = async () => {
    try {
      await axios.delete(`${API}/api/avatar`, { withCredentials: true });
      setUser(prev => prev ? { ...prev, profile_picture: undefined } : prev);
      showToast('Profile picture removed');
    } catch { showToast('Remove failed', 'error'); }
  };

  /* Logout */
  const logout = async()=>{
    try{await axios.post(`${API}/api/auth/logout`,{},{withCredentials:true});}catch{}
    document.cookie='auth_token=; path=/; max-age=0';
    router.push('/login');
  };

  /* Derived data */
  const inOffice = team.filter(t=>t.status==='office').length;
  const inRemote = team.filter(t=>t.status==='remote').length;
  const inAway = team.filter(t=>t.status==='away').length;
  const filtered = statusTab==='all'?team:team.filter(t=>t.status===statusTab);
  const pendingSwaps = swaps.filter(s=>s.status==='pending').length;
  const myPendingTasks = tasks.filter(t=>t.status!=='done'&&String(t.assigned_to)===String(user?.id)).length;
  const displayName = user?.full_name||user?.fullname||user?.username||'Team';
  const initials = getInitials(displayName);
  const userColor = user?.avatar_color||'#f97316';
  const greet = ()=>{const h=new Date().getHours();return h<12?'morning':h<17?'afternoon':'evening';};

  const anaData = {
    avg_office_days: analytics?.avg_office_days ?? +(inOffice/Math.max(team.length,1)*5).toFixed(1),
    peak_day: analytics?.peak_day ?? '—',
    utilization_rate: analytics?.utilization_rate ?? Math.round(inOffice/Math.max(team.length,1)*100),
    daily: analytics?.daily ?? [],
  };

  // Show nothing during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background: '#faf9f7'}}>
        <div className="spin" style={{width:30,height:30}}/>
      </div>
    );
  }

  /* ══ RENDER ══ */
  return (
    <>
      <style>{G}</style>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {showTaskModal && isAdmin && <TaskModal users={assignUsers} onSubmit={handleCreateTask} onClose={()=>setShowTaskModal(false)} loading={false} dark={dark}/>}
      {showAttModal && <AttendanceModal current={myAtt} onSave={handleSaveAtt} onClose={()=>setShowAttModal(false)} dark={dark}/>}
      {showSwapModal && <SwapModal onSubmit={handleSubmitSwap} onClose={()=>setShowSwapModal(false)} loading={swapLoading} dark={dark}/>}

      <svg id="cur" viewBox="0 0 24 24" fill="none" style={{position:'fixed',pointerEvents:'none',zIndex:99999}}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill={dark?'#f0ede8':'#0f0e0c'} stroke={dark?'#f0ede8':'#0f0e0c'} strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      <div style={{display:'flex',height:'100vh',overflow:'hidden',position:'relative'}}>

        {/* Mobile overlay */}
        {mobileOpen && <div className="sidebar-overlay" onClick={()=>setMobileOpen(false)}/>}

        {/* Sidebar */}
        <aside className={`sidebar-wrap${mobileOpen ? ' open' : ''}`}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',height:64,borderBottom:`1px solid ${dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)'}`,flexShrink:0}}>
            <a href="/" className="font-syne" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px',display:'flex',alignItems:'center',textDecoration:'none',color:dark?'#f0ede8':'#0f0e0c',cursor:'none'}}>
              timso
            </a>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          
          <nav style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:2}}>
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>{setActiveNav(item.id);setMobileOpen(false);}}
                className={`nav-item ${activeNav===item.id ? 'active' : ''}`}
                style={{color:activeNav===item.id?'#fff':'#6b6860',background:'none'}}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={activeNav===item.id?'#fff':'#9e9b94'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon}/>
                </svg>
                <span style={{flex:1}}>{item.label}</span>
                {item.id==='swaps' && pendingSwaps>0 && (
                  <span style={{fontSize:10,fontWeight:900,padding:'2px 6px',borderRadius:'50%',background:'#f97316',color:'#fff'}}>{pendingSwaps}</span>
                )}
                {item.id==='tasks' && myPendingTasks>0 && (
                  <span style={{fontSize:10,fontWeight:900,padding:'2px 6px',borderRadius:'50%',background:'#5c3bff',color:'#fff'}}>{myPendingTasks}</span>
                )}
                {item.adminOnly && activeNav!==item.id && (
                  <span style={{fontSize:8,fontWeight:900,padding:'1px 5px',borderRadius:4,background:'rgba(249,115,22,.12)',color:'#f97316'}}>ADMIN</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{padding:'8px 12px',borderTop:'1px solid rgba(0,0,0,.05)'}}>
            <button onClick={()=>setShowAttModal(true)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:14,border:`1.5px solid ${dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)'}`,background:dark?'#1a1916':'#faf9f7',cursor:'none',transition:'all .18s',textAlign:'left'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#f97316'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='rgba(0,0,0,.07)'}>
              <span style={{fontSize:18}}>{STATUS_CFG[myAtt.status].icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>{STATUS_CFG[myAtt.status].label}</div>
                <div style={{fontSize:10,color:dark?'#7a7770':'#9e9b94',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{myAtt.note||'Tap to update'}</div>
              </div>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
          </div>

          <div style={{flexShrink:0,padding:12,borderTop:'1px solid rgba(0,0,0,.07)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:14,background:dark?'#1a1916':'#faf9f7'}}>
              {ldUser ? (
                <div className="sk" style={{width:32,height:32,borderRadius:'50%',flexShrink:0}}/>
              ) : (
                <Avatar 
                  name={displayName} 
                  picture={user?.profile_picture} 
                  size={32} 
                  bg={userColor} 
                  fontSize={11} 
                  apiBase={API}
                />
              )}
              <div style={{flex:1,minWidth:0}}>
                {ldUser ? (
                  <>
                    <div className="sk" style={{height:10,width:'70%',marginBottom:6}}/>
                    <div className="sk" style={{height:8,width:'50%'}}/>
                  </>
                ) : (
                  <>
                    <div style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</div>
                    <div style={{fontSize:10,color:dark?'#7a7770':'#9e9b94',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email||'—'}</div>
                  </>
                )}
              </div>
            </div>
            
            <button onClick={logout} className="logout-btn" style={{marginTop:4,width:'100%',display:'flex',alignItems:'center',gap:8,padding:'10px 12px',fontSize:12,fontWeight:600,color:dark?'#7a7770':'#9e9b94',border:'none',background:'transparent'}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <header className="header-pad" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',height:64,flexShrink:0,borderBottom:`1px solid ${dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)'}`,background:dark?'#111009':'#fff'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button className="mob-menu-btn" onClick={()=>setMobileOpen(o=>!o)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={dark?'#f0ede8':'#0f0e0c'} strokeWidth="2.5">
                  {mobileOpen ? (
                    <path d="M6 18L18 6M6 6l12 12"/>
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16"/>
                  )}
                </svg>
              </button>
              <div>
                <h1 className="font-syne header-title" style={{fontWeight:900,fontSize:18,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',lineHeight:1,margin:0}}>
                  {NAV.find(n=>n.id===activeNav)?.label}
                </h1>
                <p style={{fontSize:11,color:dark?'#6b6860':'#9e9b94',marginTop:2,marginBottom:0}}>
                  {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                </p>
              </div>
            </div>
            
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {(activeNav==='overview'||activeNav==='team') && (
                <button className="ref-btn" onClick={()=>{fetchTeam(true);fetchActivity();}}>
                  {refreshing ? (
                    <span className="spin"/>
                  ) : (
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  )}
                  <span className="hide-mobile">Refresh</span>
                </button>
              )}
              
              <button className="theme-toggle" onClick={toggleDark} title={dark?'Light mode':'Dark mode'}>
                {dark ? (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
                <span className="toggle-label">{dark ? 'Light' : 'Dark'}</span>
              </button>
              
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:100,border:`1px solid ${dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)'}`,background:dark?'#1a1916':'#faf9f7'}}>
                <div className="live-dot" style={{width:6,height:6,borderRadius:'50%',background:'#22c55e'}}/>
                <span className="font-syne" style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>{time}</span>
              </div>
              
              <button style={{position:'relative',width:36,height:36,borderRadius:'50%',border:`1px solid ${dark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)'}`,background:dark?'#1a1916':'#faf9f7',display:'flex',alignItems:'center',justifyContent:'center',cursor:'none'}}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                {pendingSwaps>0 && (
                  <span style={{position:'absolute',top:6,right:6,width:8,height:8,borderRadius:'50%',background:'#f97316',border:'2px solid white'}}/>
                )}
              </button>
            </div>
          </header>

          <div className="main-content-pad">
            {/* OVERVIEW */}
            {activeNav==='overview' && (
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div className="a-rise" style={{animationDelay:'.05s'}}>
                  <h2 className="font-syne" style={{fontWeight:900,fontSize:28,letterSpacing:'-1.5px',color:dark?'#f0ede8':'#0f0e0c',lineHeight:1,margin:0}}>
                    Good {greet()}, <span style={{color:'#f97316'}}>{displayName.split(' ')[0]}</span> 👋
                  </h2>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,flexWrap:'wrap'}}>
                    <p style={{fontSize:14,color:dark?'#7a7770':'#9e9b94',margin:0}}>Here&apos;s what&apos;s happening with your team today.</p>
                    {teamSrc==='live' && <span className="src live">Live</span>}
                    {teamSrc==='error' && <span className="src mock">Backend Error</span>}
                    {isAdmin && <span className="admin-badge">Admin View</span>}
                  </div>
                </div>

                {/* My status */}
                <div className="card a-rise" style={{animationDelay:'.08s',padding:'16px 20px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:STATUS_CFG[myAtt.status].bg}}>
                        {STATUS_CFG[myAtt.status].icon}
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:dark?'#7a7770':'#9e9b94',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Your status today</div>
                        <div className="font-syne" style={{fontWeight:800,fontSize:17,color:dark?'#f0ede8':'#0f0e0c'}}>
                          {STATUS_CFG[myAtt.status].label}
                          {myAtt.note && <span style={{fontSize:13,fontWeight:400,color:dark?'#7a7770':'#9e9b94',marginLeft:8}}>· {myAtt.note}</span>}
                        </div>
                        {myAtt.since!=='—' && <div style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',marginTop:2}}>Since {myAtt.since}</div>}
                      </div>
                    </div>
                    <button className="btn-primary" onClick={()=>setShowAttModal(true)} style={{fontSize:12,padding:'8px 16px'}}>Update</button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid-stats">
                  {ldTeam ? Array(4).fill(0).map((_,i)=><SkCard key={i}/>) : (
                    [
                      {label:'Total Team',value:team.length,sub:'members',color:dark?'#f0ede8':'#0f0e0c',icon:'👥',delay:'.1s'},
                      {label:'In Office',value:inOffice,sub:'today',color:'#f97316',icon:'🏢',delay:'.15s'},
                      {label:'Remote',value:inRemote,sub:'working from home',color:'#5c3bff',icon:'🏠',delay:'.2s'},
                      {label:'Away',value:inAway,sub:'on leave',color:dark?'#7a7770':'#9e9b94',icon:'🌴',delay:'.25s'},
                    ].map(s=>(
                      <div key={s.label} className="card a-rise" style={{padding:'20px 24px',animationDelay:s.delay}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                          <span style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase' as const,color:dark?'#7a7770':'#9e9b94'}}>{s.label}</span>
                          <span style={{fontSize:20}}>{s.icon}</span>
                        </div>
                        <div className="font-syne stat-num" style={{fontWeight:900,fontSize:36,letterSpacing:'-2px',lineHeight:1,color:s.color}}>{s.value}</div>
                        <div style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',marginTop:4}}>{s.sub}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid-main">
                  {/* Team Board */}
                  <div className="card a-rise" style={{padding:24,animationDelay:'.3s'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                      <div>
                        <h3 className="font-syne" style={{fontWeight:700,fontSize:16,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Team Board</h3>
                        <p style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',marginTop:2,marginBottom:0}}>{team.length} members <span className="src live" style={{marginLeft:4}}>Live</span></p>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:100,background:'rgba(34,197,94,.1)'}}>
                        <div className="live-dot" style={{width:5,height:5,borderRadius:'50%',background:'#22c55e'}}/>
                        <span style={{fontSize:11,fontWeight:700,color:'#16a34a'}}>Live</span>
                      </div>
                    </div>
                    
                    <div className="tabs-scroll" style={{marginBottom:16}}>
                      <div className="tab-group" style={{display:'flex',gap:4,padding:4,borderRadius:12,background:dark?'#1e1c19':'#f8f7f4',width:'fit-content'}}>
                        {(['all','office','remote','away'] as const).map(t=>(
                          <button key={t} onClick={()=>setStatusTab(t)} className={`tab-btn ${statusTab===t?'active':''}`}>
                            {t==='all'?`All (${team.length})`:t==='office'?`Office (${inOffice})`:t==='remote'?`Remote (${inRemote})`:`Away (${inAway})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ldTeam ? Array(4).fill(0).map((_,i)=><SkRow key={i}/>) : (
                      team.length===0 ? (
                        <div style={{padding:32,textAlign:'center',color:dark?'#7a7770':'#9e9b94'}}>
                          <div style={{fontSize:28,marginBottom:8}}>👥</div>
                          <div style={{fontSize:13,fontWeight:600}}>No team members yet</div>
                          <div style={{fontSize:11,marginTop:4}}>Team members will appear here once they check in</div>
                        </div>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {filtered.map((m,i)=>{
                            const cfg=STATUS_CFG[m.status||'away'];
                            return(
                              <div key={m.id} className="team-row a-slide" style={{display:'flex',alignItems:'center',gap:12,padding:12,animationDelay:`${i*.04}s`,flexWrap:'wrap'}}>
                                <div className="av-wrap">
                                  <Avatar name={m.name} picture={m.profile_picture} size={36} bg={m.bg} fontSize={11} apiBase={API}/>
                                  <div className="av-dot" style={{background:cfg.dot}}/>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:600,color:dark?'#f0ede8':'#0f0e0c'}}>{m.name}</div>
                                  <div style={{fontSize:11,color:dark?'#7a7770':'#9e9b94'}}>{m.job_role||m.role||'—'}</div>
                                </div>
                                <div className="team-row-where" style={{textAlign:'right',marginRight:8}}>
                                  <div style={{fontSize:11,color:dark?'#7a7770':'#9e9b94'}}>{m.where}</div>
                                  <div style={{fontSize:10,color:dark?'#4a4744':'#c8c5be'}}>{m.since}</div>
                                </div>
                                <span className="status-badge" style={{background:cfg.bg,color:cfg.color}}>
                                  <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot,flexShrink:0}}/>{cfg.label}
                                </span>
                              </div>
                            );
                          })}
                          {filtered.length===0 && (
                            <div style={{padding:24,textAlign:'center',color:dark?'#7a7770':'#9e9b94',fontSize:13}}>No members in this category</div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Right column */}
                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    <div className="card a-rise" style={{padding:20,animationDelay:'.35s'}}>
                      <h3 className="font-syne" style={{fontWeight:700,fontSize:14,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',marginBottom:14,marginTop:0}}>Quick Actions</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <button className="quick-btn" style={{textAlign:'left'}} onClick={()=>setShowAttModal(true)}>
                          <span style={{fontSize:18}}>{STATUS_CFG[myAtt.status].icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>Update My Status</div>
                            <div style={{fontSize:10,color:dark?'#7a7770':'#9e9b94'}}>Now: {STATUS_CFG[myAtt.status].label}{myAtt.note?` · ${myAtt.note}`:''}</div>
                          </div>
                          <svg style={{marginLeft:'auto'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                        
                        <button className="quick-btn" style={{textAlign:'left'}} onClick={()=>setShowSwapModal(true)}>
                          <span style={{fontSize:18}}>🔄</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>Request Day Swap</div>
                            <div style={{fontSize:10,color:dark?'#7a7770':'#9e9b94'}}>Submit a swap request</div>
                          </div>
                          <svg style={{marginLeft:'auto'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                        
                        {isAdmin && (
                          <>
                            <div style={{height:1,background:'rgba(0,0,0,.05)',margin:'4px 0'}}/>
                            <button className="quick-btn" style={{textAlign:'left',borderColor:'rgba(249,115,22,.2)',background:'rgba(249,115,22,.03)'}} onClick={()=>setActiveNav('analytics')}>
                              <span style={{fontSize:18}}>📊</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>View Analytics</div>
                                <div style={{fontSize:10,color:dark?'#7a7770':'#9e9b94'}}>Team insights & reports</div>
                              </div>
                              <svg style={{marginLeft:'auto'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                            
                            <button className="quick-btn" style={{textAlign:'left',borderColor:'rgba(249,115,22,.2)',background:'rgba(249,115,22,.03)'}} onClick={()=>setActiveNav('swaps')}>
                              <span style={{fontSize:18}}>✅</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>Approve Swaps</div>
                                <div style={{fontSize:10,color:pendingSwaps>0?'#f97316':'#9e9b94',fontWeight:pendingSwaps>0?700:400}}>
                                  {pendingSwaps>0 ? `${pendingSwaps} pending!` : 'No pending requests'}
                                </div>
                              </div>
                              <svg style={{marginLeft:'auto'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card a-rise" style={{padding:20,animationDelay:'.4s'}}>
                      <h3 className="font-syne" style={{fontWeight:700,fontSize:14,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Office Utilization</h3>
                      <p style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',marginTop:2,marginBottom:16}}>Today&apos;s breakdown</p>
                      {team.length===0 ? (
                        <div style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',textAlign:'center',padding:'12px 0'}}>No attendance data yet</div>
                      ) : (
                        [
                          {label:'In Office',val:Math.round(inOffice/team.length*100),color:'#f97316'},
                          {label:'Remote',val:Math.round(inRemote/team.length*100),color:'#a89fff'},
                          {label:'Away',val:Math.round(inAway/team.length*100),color:'#e5e3dd'},
                        ].map(b=>(
                          <div key={b.label} style={{marginBottom:12}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:600,color:dark?'#a09d97':'#6b6860'}}>{b.label}</span>
                              <span style={{fontSize:11,fontWeight:700,color:dark?'#f0ede8':'#0f0e0c'}}>{b.val}%</span>
                            </div>
                            <div style={{height:6,borderRadius:100,background:dark?'#1a1916':'#f2f0eb',overflow:'hidden'}}>
                              <div className="bar-fill" style={{height:'100%',borderRadius:100,background:b.color,width:`${b.val}%`}}/>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="card a-rise" style={{padding:24,animationDelay:'.45s'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                    <div>
                      <h3 className="font-syne" style={{fontWeight:700,fontSize:16,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Recent Activity</h3>
                      <p style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',marginTop:2,marginBottom:0}}>Status changes today</p>
                    </div>
                  </div>
                  {ldAct ? Array(4).fill(0).map((_,i)=><SkRow key={i}/>) : (
                    activity.length===0 ? (
                      <div style={{padding:24,textAlign:'center',color:dark?'#7a7770':'#9e9b94',fontSize:13}}>
                        <div style={{fontSize:24,marginBottom:8}}>📋</div>No activity yet today
                      </div>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        {activity.map((a,i)=>(
                          <div key={a.id} className="act-item a-slide" style={{display:'flex',alignItems:'center',gap:12,padding:12,animationDelay:`${i*.05}s`,flexWrap:'wrap'}}>
                            <Avatar name={a.name} picture={a.profile_picture} size={32} bg={a.bg} fontSize={10} apiBase={API}/>
                            <div style={{flex:1,minWidth:200}}>
                              <span style={{fontSize:13,fontWeight:600,color:dark?'#f0ede8':'#0f0e0c'}}>{a.name}</span>
                              <span style={{fontSize:13,color:dark?'#a09d97':'#6b6860'}}> {a.action}</span>
                            </div>
                            <div className="activity-time" style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:18}}>{a.icon}</span>
                              <span style={{fontSize:11,color:dark?'#4a4744':'#c8c5be',whiteSpace:'nowrap'}}>{a.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TEAM */}
            {activeNav==='team' && (
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div className="a-rise" style={{animationDelay:'.05s'}}>
                  <h2 className="font-syne" style={{fontWeight:900,fontSize:24,letterSpacing:'-1px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Team Members</h2>
                  <p style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>
                    {team.length} members <span className="src live" style={{marginLeft:4}}>Live</span>
                    {!isAdmin && <span style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',marginLeft:8}}>· Admin contacts hidden</span>}
                  </p>
                </div>
                
                {ldTeam ? (
                  <div className="grid-team-cards">
                    {Array(6).fill(0).map((_,i)=><SkCard key={i}/>)}
                  </div>
                ) : team.length===0 ? (
                  <div className="card" style={{padding:40,textAlign:'center'}}>
                    <div style={{fontSize:32,marginBottom:12}}>👥</div>
                    <div className="font-syne" style={{fontWeight:700,fontSize:16,color:dark?'#f0ede8':'#0f0e0c'}}>No team members yet</div>
                    <div style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4}}>Members will appear once they register and check in</div>
                  </div>
                ) : (
                  <div className="grid-team-cards">
                    {team
                      .filter(m => isAdmin || m.role !== 'admin')
                      .map((m,i)=>{
                        const cfg=STATUS_CFG[m.status||'away'];
                        return(
                          <div key={m.id} className="card a-rise" style={{padding:20,animationDelay:`${i*.06}s`}}>
                            <div className="team-card-content" style={{display:'flex',alignItems:'start',gap:16}}>
                              <div className="av-wrap">
                                <Avatar name={m.name} picture={m.profile_picture} size={48} bg={m.bg} fontSize={14} apiBase={API}/>
                                <div className="av-dot" style={{background:cfg.dot,width:12,height:12}}/>
                              </div>
                              <div style={{flex:1}}>
                                <div className="font-syne" style={{fontWeight:700,fontSize:15,color:dark?'#f0ede8':'#0f0e0c'}}>{m.name}</div>
                                <div style={{fontSize:12,color:dark?'#7a7770':'#9e9b94'}}>{m.job_role||m.role||'—'}</div>
                                {isAdmin && m.email && (
                                  <div style={{fontSize:11,color:dark?'#4a4744':'#c8c5be',marginTop:2}}>{m.email}</div>
                                )}
                                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,flexWrap:'wrap'}}>
                                  <span className="status-badge" style={{background:cfg.bg,color:cfg.color}}>
                                    <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot}}/>{cfg.label}
                                  </span>
                                  <span style={{fontSize:11,color:dark?'#7a7770':'#9e9b94'}}>{m.where}</span>
                                </div>
                                {m.since && m.since!=='—' && (
                                  <div style={{fontSize:10,color:dark?'#4a4744':'#c8c5be',marginTop:4}}>Since {m.since}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TASKS */}
            {activeNav==='tasks' && (
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div className="a-rise" style={{display:'flex',alignItems:'start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
                  <div>
                    <h2 className="font-syne" style={{fontWeight:900,fontSize:24,letterSpacing:'-1px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Tasks</h2>
                    <p style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>
                      {isAdmin ? 'Assign and manage team tasks' : 'Your assigned tasks'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button className="btn-primary" onClick={()=>setShowTaskModal(true)} style={{fontSize:12,padding:'9px 18px',flexShrink:0}}>
                      + Assign Task
                    </button>
                  )}
                </div>

                {/* Stats */}
                {taskStats && (
                  <div className="grid-stats" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                    {[
                      {label:'Total', value:taskStats.total, color:dark?'#f0ede8':'#0f0e0c', icon:'📋'},
                      {label:'To Do', value:taskStats.todo, color:dark?'#a09d97':'#6b6860', icon:'⭕'},
                      {label:'In Progress', value:taskStats.in_progress, color:'#5c3bff', icon:'🔄'},
                      {label:'Done', value:taskStats.done, color:'#16a34a', icon:'✅'},
                    ].map(s=>(
                      <div key={s.label} className="card a-rise" style={{padding:'16px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                          <span style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase' as const,color:dark?'#7a7770':'#9e9b94'}}>{s.label}</span>
                          <span style={{fontSize:16}}>{s.icon}</span>
                        </div>
                        <div className="font-syne" style={{fontWeight:900,fontSize:28,letterSpacing:'-1.5px',color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overdue warning */}
                {taskStats && taskStats.overdue > 0 && (
                  <div style={{padding:'12px 16px',borderRadius:14,background:'rgba(239,68,68,.08)',border:'1.5px solid rgba(239,68,68,.2)',display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:18}}>⚠️</span>
                    <span style={{fontSize:13,fontWeight:600,color:'#ef4444'}}>{taskStats.overdue} overdue task{taskStats.overdue>1?'s':''}</span>
                  </div>
                )}

                {/* Task list */}
                {ldTasks ? Array(3).fill(0).map((_,i)=><SkCard key={i}/>) : (
                  tasks.length===0 ? (
                    <div className="card" style={{padding:40,textAlign:'center'}}>
                      <div style={{fontSize:32,marginBottom:12}}>📋</div>
                      <div className="font-syne" style={{fontWeight:700,fontSize:16,color:dark?'#f0ede8':'#0f0e0c'}}>
                        {isAdmin ? 'No tasks yet' : 'No tasks assigned to you'}
                      </div>
                      <div style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:isAdmin?20:0}}>
                        {isAdmin ? 'Create a task and assign it to a team member' : 'Check back later'}
                      </div>
                      {isAdmin && (
                        <button className="btn-primary" style={{margin:'0 auto',display:'flex'}} onClick={()=>setShowTaskModal(true)}>
                          Assign First Task
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {tasks.map((task,i)=>{
                        const PCFG:Record<string,{bg:string;color:string;dot:string;label:string}> = {
                          high:   {bg:'rgba(239,68,68,.1)',  color:'#ef4444', dot:'#ef4444', label:'High'},
                          medium: {bg:'rgba(249,115,22,.1)', color:'#f97316', dot:'#f97316', label:'Medium'},
                          low:    {bg:'rgba(34,197,94,.1)',  color:'#16a34a', dot:'#22c55e', label:'Low'},
                        };
                        const SCFG:Record<string,{bg:string;color:string;label:string;icon:string}> = {
                          todo:        {bg:'rgba(0,0,0,.05)',     color:dark?'#a09d97':'#6b6860', label:'To Do',       icon:'⭕'},
                          in_progress: {bg:'rgba(92,59,255,.1)',  color:'#5c3bff', label:'In Progress', icon:'🔄'},
                          done:        {bg:'rgba(34,197,94,.1)',  color:'#16a34a', label:'Done',        icon:'✅'},
                        };
                        const pc = PCFG[task.priority] || PCFG.medium;
                        const sc = SCFG[task.status] || SCFG.todo;
                        const ov = task.due_date && task.status!=='done' && new Date(task.due_date) < new Date();
                        const isMyTask = String(task.assigned_to)===String(user?.id);
                        
                        return (
                          <div key={task.id} className="card a-rise" style={{
                            padding:20,
                            animationDelay:`${i*.05}s`,
                            border:ov ? '1.5px solid rgba(239,68,68,.3)' : '1px solid rgba(0,0,0,.07)'
                          }}>
                            <div className="task-item">
                              <div style={{width:4,borderRadius:4,background:pc.dot,alignSelf:'stretch',flexShrink:0,minHeight:40}}/>
                              
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                                  <div className="font-syne" style={{fontWeight:700,fontSize:15,color:dark?'#f0ede8':'#0f0e0c'}}>{task.title}</div>
                                  {ov && (
                                    <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:100,background:'rgba(239,68,68,.1)',color:'#ef4444',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Overdue</span>
                                  )}
                                </div>
                                
                                {task.description && (
                                  <div style={{fontSize:12,color:dark?'#a09d97':'#6b6860',marginBottom:8,lineHeight:1.5}}>{task.description}</div>
                                )}
                                
                                <div className="task-meta" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:sc.bg,color:sc.color,display:'flex',alignItems:'center',gap:5}}>
                                    {sc.icon} {sc.label}
                                  </span>
                                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:100,background:pc.bg,color:pc.color}}>
                                    {pc.label}
                                  </span>
                                  {isAdmin && (
                                    <span style={{fontSize:11,color:dark?'#7a7770':'#9e9b94'}}>
                                      👤 {task.assigned_to_name||task.assigned_to_username||'—'}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span style={{fontSize:11,color:ov?'#ef4444':'#9e9b94'}}>
                                      📅 {new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="task-actions">
                                {(isAdmin||isMyTask) && task.status!=='done' && (
                                  <div style={{display:'flex',gap:6}}>
                                    {task.status==='todo' && (
                                      <button onClick={()=>handleUpdateTaskStatus(task.id,'in_progress')}
                                        style={{padding:'6px 12px',borderRadius:10,fontSize:11,fontWeight:700,border:'none',cursor:'none',background:'rgba(92,59,255,.1)',color:'#5c3bff'}}>
                                        Start →
                                      </button>
                                    )}
                                    {task.status==='in_progress' && (
                                      <button onClick={()=>handleUpdateTaskStatus(task.id,'done')}
                                        style={{padding:'6px 12px',borderRadius:10,fontSize:11,fontWeight:700,border:'none',cursor:'none',background:'rgba(34,197,94,.1)',color:'#16a34a'}}>
                                        ✓ Done
                                      </button>
                                    )}
                                    {task.status!=='todo' && (
                                      <button onClick={()=>handleUpdateTaskStatus(task.id,'todo')}
                                        style={{padding:'6px 12px',borderRadius:10,fontSize:11,fontWeight:700,cursor:'none',background:'transparent',color:dark?'#7a7770':'#9e9b94',border:`1px solid ${dark?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)'}`}}>
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                )}
                                {isAdmin && (
                                  <button onClick={()=>handleDeleteTask(task.id)}
                                    style={{padding:'5px 10px',borderRadius:8,fontSize:10,fontWeight:700,cursor:'none',background:'rgba(239,68,68,.07)',color:'#ef4444',border:'none',alignSelf:'flex-end'}}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* ANALYTICS (admin) */}
            {activeNav==='analytics' && isAdmin && (
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div className="a-rise">
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <h2 className="font-syne" style={{fontWeight:900,fontSize:24,letterSpacing:'-1px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Analytics</h2>
                    <span className="admin-badge">Admin Only</span>
                  </div>
                  <p style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>
                    Office utilization {analytics && <span className="src live" style={{marginLeft:4}}>Live</span>}
                  </p>
                </div>
                
                {ldAna ? (
                  <div className="analytics-grid">
                    {Array(3).fill(0).map((_,i)=><SkCard key={i}/>)}
                  </div>
                ) : (
                  <>
                    <div className="analytics-grid">
                      {[
                        {label:'Avg Office Days/Week', value:`${anaData.avg_office_days}`, unit:'days', color:'#f97316'},
                        {label:'Peak Day', value:anaData.peak_day, unit:'most in-office', color:'#5c3bff'},
                        {label:'Utilization Rate', value:`${anaData.utilization_rate}%`, unit:'this week', color:'#22c55e'},
                      ].map((s,i)=>(
                        <div key={s.label} className="card a-rise" style={{padding:24,animationDelay:`${i*.08}s`}}>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:dark?'#7a7770':'#9e9b94',marginBottom:12}}>{s.label}</div>
                          <div className="font-syne" style={{fontWeight:900,fontSize:40,letterSpacing:'-2px',lineHeight:1,color:s.color}}>{s.value}</div>
                          <div style={{fontSize:12,color:dark?'#7a7770':'#9e9b94',marginTop:4}}>{s.unit}</div>
                        </div>
                      ))}
                    </div>
                    
                    {anaData.daily.length>0 && (
                      <div className="card a-rise" style={{padding:24,animationDelay:'.3s'}}>
                        <h3 className="font-syne" style={{fontWeight:700,fontSize:15,letterSpacing:'-0.5px',color:dark?'#f0ede8':'#0f0e0c',marginBottom:24,marginTop:0}}>Daily Attendance This Week</h3>
                        <div style={{display:'flex',alignItems:'end',gap:16,height:160,overflowX:'auto',paddingBottom:8}}>
                          {anaData.daily.map((d,i)=>{
                            const tot=d.office+d.remote+d.away||1;
                            return(
                              <div key={d.day} className="a-rise" style={{flex:'1 0 60px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,animationDelay:`${.35+i*.07}s`}}>
                                <div style={{width:'100%',display:'flex',flexDirection:'column',gap:2,height:140}}>
                                  {[
                                    {val:d.office,color:'#f97316'},
                                    {val:d.remote,color:'#a89fff'},
                                    {val:d.away,color:'#e5e3dd'}
                                  ].map((b,j)=>(
                                    <div key={j} style={{width:'100%',borderRadius:4,background:b.color,height:`${(b.val/tot)*100}%`,minHeight:4}}/>
                                  ))}
                                </div>
                                <span style={{fontSize:11,fontWeight:700,color:dark?'#7a7770':'#9e9b94'}}>{d.day}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div style={{display:'flex',alignItems:'center',gap:20,marginTop:20,flexWrap:'wrap'}}>
                          {[
                            ['#f97316','In Office'],
                            ['#a89fff','Remote'],
                            ['#e5e3dd','Away']
                          ].map(([c,l])=>(
                            <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:10,height:10,borderRadius:3,background:c}}/>
                              <span style={{fontSize:11,color:dark?'#7a7770':'#9e9b94',fontWeight:500}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* MANAGE (admin) */}
            {activeNav==='manage' && isAdmin && (
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div className="a-rise">
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <h2 className="font-syne" style={{fontWeight:900,fontSize:24,letterSpacing:'-1px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Manage Team</h2>
                    <span className="admin-badge">Admin Only</span>
                  </div>
                  <p style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>Full roster — all users including admins</p>
                </div>
                
                {ldTeam ? (
                  Array(5).fill(0).map((_,i)=><SkCard key={i}/>)
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {team.map((m,i)=>{
                      const cfg=STATUS_CFG[m.status||'away'];
                      return(
                        <div key={m.id} className="card a-rise" style={{padding:'16px 20px',animationDelay:`${i*.04}s`}}>
                          <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                            <div className="av-wrap">
                              <Avatar name={m.name} picture={m.profile_picture} size={42} bg={m.bg} fontSize={13} apiBase={API}/>
                              <div className="av-dot" style={{background:cfg.dot,width:11,height:11}}/>
                            </div>
                            <div style={{flex:1,minWidth:200}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                                <div style={{fontWeight:700,fontSize:14,color:dark?'#f0ede8':'#0f0e0c'}}>{m.name}</div>
                                {m.role==='admin' && <span className="admin-badge">Admin</span>}
                              </div>
                              <div style={{fontSize:12,color:dark?'#7a7770':'#9e9b94'}}>
                                {m.job_role||'—'}{m.email && <> · {m.email}</>}
                              </div>
                            </div>
                            <div style={{textAlign:'right',marginRight:12}}>
                              <div style={{fontSize:12,color:dark?'#a09d97':'#6b6860',fontWeight:500}}>{m.where}</div>
                              <div style={{fontSize:10,color:dark?'#4a4744':'#c8c5be'}}>Since {m.since}</div>
                            </div>
                            <span className="status-badge" style={{background:cfg.bg,color:cfg.color}}>
                              <span style={{width:5,height:5,borderRadius:'50%',background:cfg.dot}}/>{cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS */}
            {activeNav==='settings' && (
              <div style={{display:'flex',flexDirection:'column',gap:24,maxWidth:560,margin:'0 auto'}}>
                <div className="a-rise">
                  <h2 className="font-syne" style={{fontWeight:900,fontSize:24,letterSpacing:'-1px',color:dark?'#f0ede8':'#0f0e0c',margin:0}}>Settings</h2>
                  <p style={{fontSize:13,color:dark?'#7a7770':'#9e9b94',marginTop:4,marginBottom:0}}>Manage your account</p>
                </div>
                
                <div className="card a-rise" style={{padding:24,animationDelay:'.1s'}}>
                  <h3 className="font-syne" style={{fontWeight:700,fontSize:14,color:dark?'#f0ede8':'#0f0e0c',marginBottom:16,marginTop:0}}>Profile</h3>
                  
                  {ldUser ? (
                    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'}`}}>
                      <div className="sk" style={{width:56,height:56,borderRadius:'50%',flexShrink:0}}/>
                      <div style={{flex:1}}><div className="sk" style={{height:14,width:'50%',marginBottom:8}}/><div className="sk" style={{height:10,width:'70%'}}/></div>
                    </div>
                  ) : (
                    <div className="settings-avatar" style={{display:'flex',alignItems:'center',gap:16,marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'}`,flexWrap:'wrap'}}>
                      <div style={{position:'relative',flexShrink:0}}>
                        <Avatar 
                          name={displayName} 
                          picture={user?.profile_picture} 
                          size={72} 
                          bg={userColor} 
                          fontSize={22} 
                          apiBase={API}
                        />
                        
                        <label style={{
                          position:'absolute',inset:0,borderRadius:'50%',
                          background:avatarUploading?'rgba(0,0,0,.5)':'rgba(0,0,0,0)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          cursor:'pointer',transition:'background .2s',
                        }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,.45)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0)'}>
                          <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload}/>
                          {avatarUploading ? (
                            <span className="spin" style={{borderTopColor:'#fff',width:18,height:18}}/>
                          ) : (
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" style={{opacity:0,transition:'opacity .2s'}}
                              onMouseEnter={e=>(e.currentTarget as SVGElement).style.opacity='1'}
                              onMouseLeave={e=>(e.currentTarget as SVGElement).style.opacity='0'}>
                              <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                              <circle cx="12" cy="13" r="3"/>
                            </svg>
                          )}
                        </label>
                      </div>
                      
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <div className="font-syne" style={{fontWeight:700,fontSize:16,color:dark?'#f0ede8':'#0f0e0c'}}>{displayName}</div>
                          {isAdmin && <span className="admin-badge">Admin</span>}
                        </div>
                        <div style={{fontSize:13,color:dark?'#7a7770':'#9e9b94'}}>{user?.email||'—'}</div>
                        <div style={{fontSize:11,color:dark?'#5a5754':'#c8c5be',marginTop:2}}>
                          {STATUS_CFG[myAtt.status].icon} {STATUS_CFG[myAtt.status].label}{myAtt.note&&` · ${myAtt.note}`}
                        </div>
                        
                        <div className="settings-avatar-buttons" style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                          <label style={{fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:8,background:dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)',color:dark?'#f0ede8':'#0f0e0c',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload}/>
                            {avatarUploading?<span className="spin" style={{width:10,height:10}}/>:<>📷 {user?.profile_picture?'Change':'Upload'}</>}
                          </label>
                          {user?.profile_picture && (
                            <button onClick={handleAvatarRemove}
                              style={{fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:8,background:'rgba(239,68,68,.1)',color:'#ef4444',border:'none',cursor:'none'}}>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {[
                    {label:'Full Name', value:user?.full_name||user?.fullname||displayName},
                    {label:'Username', value:user?.username?`@${user.username}`:'—'},
                    {label:'Email', value:user?.email||'—'},
                    {label:'Role', value:user?.role||'—'},
                    {label:"Today's Status", value:`${STATUS_CFG[myAtt.status].icon} ${STATUS_CFG[myAtt.status].label}${myAtt.note?` · ${myAtt.note}`:''}`, highlight:true},
                  ].map(f=>(
                    <div key={f.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:`1px solid ${dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)'}`,flexWrap:'wrap',gap:8}}>
                      <span style={{fontSize:13,fontWeight:600,color:dark?'#a09d97':'#6b6860'}}>{f.label}</span>
                      {ldUser ? (
                        <div className="sk" style={{height:12,width:130}}/>
                      ) : (
                        <span style={{fontSize:13,fontWeight:600,color:(f as {highlight?:boolean}).highlight?'#f97316':dark?'#f0ede8':'#0f0e0c'}}>{f.value}</span>
                      )}
                    </div>
                  ))}
                  
                  <div style={{marginTop:16}}>
                    <button className="btn-primary" style={{width:'100%',padding:12,fontSize:13,justifyContent:'center'}} onClick={()=>setShowAttModal(true)}>
                      Update Today&apos;s Status
                    </button>
                  </div>
                </div>
                
                <div className="card a-rise" style={{padding:24,animationDelay:'.2s'}}>
                  <h3 className="font-syne" style={{fontWeight:700,fontSize:14,color:dark?'#f0ede8':'#0f0e0c',marginBottom:16,marginTop:0}}>Danger Zone</h3>
                  <button onClick={logout} className="btn-danger">Sign out of Timso</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}