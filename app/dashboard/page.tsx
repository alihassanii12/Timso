'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { SocketProvider, useSocket } from '../SocketProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

/* ══ TOKEN HELPERS ══ */
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const getToken = (): string | null => {
  // Try localStorage first (more reliable cross-origin), fallback to cookie
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('timso_token') || getTokenFromCookie();
};

const setTokenCookie = (token: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `accessToken=${encodeURIComponent(token)}; path=/; SameSite=None; Secure; max-age=${15 * 60}`;
  localStorage.setItem('timso_token', token);
};

const clearToken = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0';
  localStorage.removeItem('timso_token');
};

/* ══ AXIOS INTERCEPTORS ══ */
// Request: attach token as Bearer header
axios.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  config.withCredentials = true;
  return config;
});

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
        const r = await axios.post(`${API}/api/auth/refresh-token`, {}, { withCredentials: true });
        // Store new access token from response body
        const newToken = r.data?.accessToken;
        if (newToken) setTokenCookie(newToken);
        processQueue(null);
        return axios(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        clearToken();
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
  company_name?: string;
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
  status?: 'office' | 'remote' | 'away';
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
interface AssignableUser {
  id: number | string; full_name?: string; username?: string; email?: string; role?: string;
}
interface AttendanceRecord { status: 'office' | 'remote' | 'away'; note: string; since: string; }
interface Job {
  id: number | string;
  title: string;
  description?: string;
  company_name: string;
  location: string;
  type: string;
  salary?: string;
  tags: string[];
  posted_by_name?: string;
  applicant_count?: number;
  is_active: boolean;
  created_at: string;
}
interface JobApplication {
  id: number | string;
  job_id: number | string;
  job_title?: string;
  company_name?: string;
  location?: string;
  type?: string;
  salary?: string;
  status: 'applied' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
}
interface PostJobForm { title: string; description: string; location: string; type: string; salary: string; tags: string; }

/* ══ NAV ══ */
const NAV_ALL = [
  { id: 'overview',     label: 'Overview',      adminOnly: false, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'team',         label: 'Team',           adminOnly: false, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'tasks',        label: 'Tasks',          adminOnly: false, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'findjob',      label: 'Find Job',       adminOnly: false, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', userOnly: true },
  { id: 'postjob',      label: 'Post Job',       adminOnly: true,  icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', externalLink: '/admin/jobs' },
  { id: 'applications', label: 'Applications',   adminOnly: true,  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', externalLink: '/admin/applications' },
  { id: 'analytics',    label: 'Analytics',      adminOnly: true,  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'manage',       label: 'Manage Team',    adminOnly: true,  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'settings',     label: 'Settings',       adminOnly: false, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const AVATAR_COLORS = ['#f97316', '#a89fff', '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#c084fc', '#f43f5e', '#38bdf8', '#4ade80'];

/* ══ HELPERS ══ */
const getInitials = (name?: string) => (name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
const getColor = (id: number | string, fb?: string) => fb || AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
const timeAgo = (d: string) => { try { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; } catch { return d; } };

const Avatar = ({ name, picture, size = 36, bg, fontSize = 11, apiBase = '' }: { name?: string; picture?: string; size?: number; bg?: string; fontSize?: number; apiBase?: string }) => {
  const src = picture ? (picture.startsWith('data:') || picture.startsWith('http') ? picture : `${apiBase}${picture}`) : null;
  const fallbackBg = bg || AVATAR_COLORS[Math.abs(String(name || 'U').charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', position: 'relative', background: fallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src && <img src={src} alt={name || 'User'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
      <span style={{ fontSize, fontWeight: 900, color: '#fff', lineHeight: 1, position: 'relative', zIndex: src ? -1 : 0 }}>{getInitials(name)}</span>
    </div>
  );
};

const normaliseTeam = (raw: TeamMember[]): TeamMember[] => raw.map(m => ({
  ...m,
  name: m.full_name || m.fullname || m.name || m.username || 'Unknown',
  where: m.note || m.location || m.where || '—',
  since: m.checkin_time || m.since || '—',
  bg: getColor(m.id, m.avatar_color || m.bg),
  status: (m.status as 'office' | 'remote' | 'away') || 'away',
  profile_picture: m.profile_picture || undefined,
}));

const normaliseActivity = (raw: ActivityItem[]): ActivityItem[] => raw.map((a, i) => ({
  ...a,
  name: a.user_name || a.name || 'Someone',
  time: a.time || (a.created_at ? timeAgo(a.created_at) : ''),
  bg: getColor(i, a.avatar_color || a.bg),
  icon: a.icon || '📋',
  profile_picture: a.profile_picture || undefined,
}));

/* ══ ATTENDANCE localStorage ══ */
const LS_KEY = 'timso_attendance';
const getAtt = (): AttendanceRecord | null => { try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch { return null; } };
const saveAtt = (s: 'office' | 'remote' | 'away', note: string): AttendanceRecord => {
  const r: AttendanceRecord = { status: s, note, since: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch { }
  return r;
};

/* ══ MOCK JOB DATA — removed, now using real API ══ */
const JOB_FILTERS = ['All', 'Remote', 'Full-time', 'Contract'];

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;margin:0;padding:0}

:root{
  --bg:#faf9f7;--bg2:#fff;--bg3:#f2f0eb;--sidebar:#fff;--header:rgba(250,249,247,.8);
  --card:#fff;--card-border:rgba(0,0,0,.06);--text:#0f0e0c;--text2:#6b6860;--text3:#9e9b94;--text4:#c8c5be;
  --border:rgba(0,0,0,.06);--border2:rgba(0,0,0,.08);--hover:rgba(0,0,0,.04);--hover2:rgba(0,0,0,.02);
  --input-bg:#fff;--accent:#f97316;--accent-soft:rgba(249,115,22,.1);
}
body.dark{
  --bg:#090908;--bg2:#111110;--bg3:#1a1a18;--sidebar:#0c0c0b;--header:rgba(9,9,8,.8);
  --card:#111110;--card-border:rgba(255,255,255,.05);--text:#f0ede8;--text2:#a09d97;--text3:#7a7770;--text4:#4a4744;
  --border:rgba(255,255,255,.05);--border2:rgba(255,255,255,.08);--hover:rgba(255,255,255,.05);--hover2:rgba(255,255,255,.03);
  --input-bg:#0c0c0b;--accent:#fb923c;--accent-soft:rgba(251,146,60,.15);
}

body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;cursor:none;transition:background .4s,color .4s}

.sidebar-wrap{width:260px;height:100vh;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;transition:all .4s cubic-bezier(.16,1,.3,1);z-index:100;flex-shrink:0}
.header-pad{backdrop-filter:blur(12px);border-bottom:1px solid var(--border);z-index:90}

.nav-item{transition:all .2s cubic-bezier(.16,1,.3,1);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:12px;width:100%;text-align:left;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;padding:12px 16px;border:none;color:var(--text2);background:transparent;margin-bottom:4px}
.nav-item:hover{background:var(--hover);color:var(--text);transform:translateX(4px)}
.nav-item.active{background:var(--text);color:var(--bg)!important;box-shadow:0 8px 20px rgba(0,0,0,.12)}
.nav-item svg{width:18px;height:18px;stroke-width:2.2;transition:all .2s}
.nav-item.active svg{stroke:var(--bg)!important}

.card{background:var(--card);border:1px solid var(--card-border);border-radius:24px;transition:all .4s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.card:hover{box-shadow:0 12px 40px rgba(0,0,0,.06);transform:translateY(-4px);border-color:var(--border2)}

.stat-card{padding:24px;display:flex;flex-direction:column;gap:12px}
.stat-icon{width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--hover)}

.greet-card{background:linear-gradient(135deg, var(--text) 0%, #2d2b28 100%);color:var(--bg);padding:40px;border-radius:32px;position:relative;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.15)}
.greet-card::after{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:var(--accent);border-radius:50%;filter:blur(80px);opacity:.2}

.btn-primary{background:var(--text);color:var(--bg);border:none;border-radius:16px;font-size:14px;font-weight:700;cursor:pointer;padding:14px 28px;transition:all .3s cubic-bezier(.16,1,.3,1);display:inline-flex;align-items:center;gap:10px;box-shadow:0 8px 20px rgba(0,0,0,.1)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.15);background:var(--accent)}
.btn-ghost{background:var(--bg2);color:var(--text);border:1px solid var(--border2);border-radius:16px;font-size:14px;font-weight:700;cursor:pointer;padding:14px 28px;transition:all .3s cubic-bezier(.16,1,.3,1);font-family:'Outfit',sans-serif}
.btn-ghost:hover{background:var(--hover);border-color:var(--text)}

.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px}
.status-online{background:#22c55e;box-shadow:0 0 12px rgba(34,197,94,.4)}

@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.float{animation:float 4s ease-in-out infinite}
@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes sheetIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

.a-rise{opacity:0;animation:riseIn .55s cubic-bezier(.16,1,.3,1) forwards}
.live-dot{animation:pulse 2s ease-in-out infinite}

#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .15s,height .15s,opacity .15s}
body.cm #cur{width:20px!important;height:20px!important}
body.ch #cur{width:17px!important;height:17px!important;opacity:.7}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}
body.cd #cur path{fill:#fff!important;stroke:#fff!important}

.team-row{transition:background .18s;border-radius:14px;cursor:none}
.team-row:hover{background:var(--hover2)}
.status-badge{border-radius:100px;font-size:11px;font-weight:700;padding:3px 10px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.act-item{transition:background .18s;border-radius:12px;cursor:none}
.act-item:hover{background:var(--hover2)}

.logout-btn{transition:all .18s;border-radius:12px;cursor:pointer}
.logout-btn:hover{background:rgba(239,68,68,.08);color:#ef4444}

.sk{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg2) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.spin{width:15px;height:15px;border:2px solid rgba(0,0,0,.1);border-top-color:#f97316;border-radius:50%;animation:spin .65s linear infinite;display:inline-block}

.toast{position:fixed;bottom:24px;right:24px;z-index:99998;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;animation:riseIn .35s cubic-bezier(.16,1,.3,1) forwards;box-shadow:0 8px 28px rgba(0,0,0,.14)}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease;padding:16px}
.sheet{background:var(--card);border-radius:24px;padding:32px;width:100%;max-width:480px;box-shadow:0 24px 80px rgba(0,0,0,.18);animation:sheetIn .3s cubic-bezier(.16,1,.3,1) forwards;margin:16px}

.inp{width:100%;border:1.5px solid var(--border2);border-radius:12px;padding:10px 14px;font-size:13px;font-family:'Outfit',sans-serif;color:var(--text);outline:none;transition:border-color .18s,background .3s;background:var(--input-bg);box-sizing:border-box}
.inp:focus{border-color:#f97316}
.lbl{font-size:12px;font-weight:700;color:var(--text2);display:block;margin-bottom:6px}

.admin-badge{font-size:9px;font-weight:900;padding:2px 8px;border-radius:100px;letter-spacing:.1em;text-transform:uppercase;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;white-space:nowrap}

/* ══ JOB BOARD STYLES ══ */
.job-search-bar{display:flex;gap:12px;align-items:center;background:var(--card);border:1.5px solid var(--border2);border-radius:18px;padding:8px 8px 8px 20px;box-shadow:0 4px 20px rgba(0,0,0,.04);transition:border-color .2s,box-shadow .2s;margin-bottom:24px}
.job-search-bar:focus-within{border-color:#f97316;box-shadow:0 4px 20px rgba(249,115,22,.1)}
.job-search-inp{flex:1;border:none;outline:none;font-size:14px;font-family:'Outfit',sans-serif;color:var(--text);background:transparent}
.job-search-inp::placeholder{color:var(--text4)}

.job-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.filter-chip{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid var(--border2);background:var(--card);color:var(--text2);font-family:'Outfit',sans-serif;transition:all .2s}
.filter-chip:hover{border-color:var(--accent);color:var(--accent)}
.filter-chip.active{background:var(--text);color:var(--bg);border-color:var(--text)}

.jobs-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:20px}

.job-card{background:var(--card);border:1.5px solid var(--card-border);border-radius:24px;padding:28px;transition:all .3s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;cursor:none}
.job-card.featured{border-color:rgba(249,115,22,.25);background:linear-gradient(135deg, var(--card), rgba(249,115,22,.02))}
.job-card:hover{border-color:rgba(249,115,22,.35);box-shadow:0 16px 48px rgba(249,115,22,.08);transform:translateY(-4px)}
.job-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(249,115,22,.04),transparent);opacity:0;transition:opacity .3s}
.job-card:hover::before{opacity:1}

.job-logo{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--hover);margin-bottom:16px;flex-shrink:0;border:1.5px solid var(--border)}
.featured-badge{position:absolute;top:20px;right:20px;font-size:9px;font-weight:900;padding:4px 10px;border-radius:100px;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;letter-spacing:.06em;text-transform:uppercase}

.job-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:900;margin:0 0 4px;color:var(--text);letter-spacing:-.3px}
.job-company{font-size:13px;font-weight:700;color:var(--text3);margin:0 0 16px;display:flex;align-items:center;gap:8px}
.job-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.job-tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;background:var(--bg3);color:var(--text2)}
.job-salary{font-size:13px;font-weight:800;color:var(--text);margin-bottom:20px;display:flex;align-items:center;gap:6px}
.job-salary-val{color:#16a34a}

.job-apply-btn{width:100%;background:var(--text);color:var(--bg);border:none;border-radius:14px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.job-apply-btn:hover{background:var(--accent);transform:translateY(-1px)}

.job-stats-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.job-stat{background:var(--card);border:1px solid var(--card-border);border-radius:18px;padding:20px;text-align:center}
.job-stat-num{font-family:'Syne',sans-serif;font-size:28px;font-weight:900;color:var(--text);display:block}
.job-stat-lbl{font-size:12px;font-weight:600;color:var(--text3);margin-top:4px}

@media(max-width:1024px){.jobs-grid{grid-template-columns:1fr}}
@media(max-width:768px){.sidebar-wrap{position:fixed!important;left:-260px;top:0;bottom:0;z-index:200}.sidebar-wrap.open{left:0}}
`;

const SkCard = () => (
  <div className="card" style={{ padding: '20px 24px' }}>
    <div className="sk" style={{ height: 11, width: '55%', marginBottom: 14 }} />
    <div className="sk" style={{ height: 34, width: '38%', marginBottom: 8 }} />
    <div className="sk" style={{ height: 9, width: '28%' }} />
  </div>
);

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div className="toast" style={{ background: type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff' }}>
    <span>{type === 'success' ? '✓' : '✕'}</span> {msg}
  </div>
);

function AttendanceModal({ current, onSave, onClose, dark }: { current: AttendanceRecord; onSave: (s: 'office' | 'remote' | 'away', note: string) => void; onClose: () => void; dark: boolean }) {
  const [status, setStatus] = useState<'office' | 'remote' | 'away'>(current.status);
  const [note, setNote] = useState(current.note);
  const STATUS_OPTIONS = [
    { id: 'office', label: 'In Office', icon: '🏢', color: '#f97316' },
    { id: 'remote', label: 'Remote', icon: '🏠', color: '#a89fff' },
    { id: 'away', label: 'Away', icon: '🌴', color: '#9e9b94' },
  ] as const;
  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-.5px', margin: 0 }}>Update Status</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,.08)', background: dark ? '#1e1c19' : '#f8f7f4', cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {STATUS_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setStatus(o.id)} style={{ flex: 1, padding: '14px 8px', borderRadius: 14, border: `1.5px solid ${status === o.id ? o.color : 'rgba(0,0,0,.08)'}`, background: status === o.id ? `${o.color}15` : 'transparent', cursor: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, font: 'inherit', transition: 'all .2s' }}>
              <span style={{ fontSize: 24 }}>{o.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: status === o.id ? o.color : 'var(--text3)' }}>{o.label}</span>
            </button>
          ))}
        </div>
        <label className="lbl">Note (optional)</label>
        <input className="inp" style={{ marginBottom: 20 }} placeholder="e.g. Working from home today" value={note} onChange={e => setNote(e.target.value)} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={() => { onSave(status, note); onClose() }} style={{ flex: 2, justifyContent: 'center' }}>Save Status</button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ users, onSubmit, onClose, loading }: {
  users: AssignableUser[];
  onSubmit: (d: { title: string; description: string; assigned_to: string; priority: string; due_date: string }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const valid = title.trim() && assignedTo;
  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>Assign Task</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,.08)', background: '#f8f7f4', cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="lbl">Assign to *</label>
          <select className="inp" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Select team member…</option>
            {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name || u.username}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="lbl">Task title *</label>
          <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="lbl">Priority</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['low', 'medium', 'high'] as const).map(p => (
              <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${priority === p ? '#f97316' : 'rgba(0,0,0,.08)'}`, background: priority === p ? 'rgba(249,115,22,.1)' : 'transparent', cursor: 'none', font: '600 12px Outfit,sans-serif', color: priority === p ? '#f97316' : 'var(--text3)', textTransform: 'capitalize', transition: 'all .2s' }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" disabled={!valid || loading} onClick={() => onSubmit({ title, description: desc, assigned_to: assignedTo, priority, due_date: dueDate })} style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? <span className="spin" /> : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ FIND JOB SECTION ══ */
function FindJobSection({ isAdmin, hasCompany, dark }: { isAdmin: boolean; hasCompany: boolean; dark: boolean }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [companyApplications, setCompanyApplications] = useState<{ id: number|string; company_name: string; company_description?: string; status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | string | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [toast, setToastMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState<PostJobForm>({ title: '', description: '', location: 'Remote', type: 'Full-time', salary: '', tags: '' });
  const [postLoading, setPostLoading] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ msg, type }); setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? `${API}/api/jobs/my-company` : `${API}/api/jobs`;
      const r = await axios.get(endpoint, { withCredentials: true });
      setJobs(r.data?.data?.jobs || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, [isAdmin]);

  const fetchMyApplications = useCallback(async () => {
    if (isAdmin) return;
    try {
      const r = await axios.get(`${API}/api/jobs/my-applications`, { withCredentials: true });
      setMyApplications(r.data?.data?.applications || []);
    } catch { setMyApplications([]); }
  }, [isAdmin]);

  const fetchCompanyApplications = useCallback(async () => {
    if (isAdmin || hasCompany) return;
    try {
      const r = await axios.get(`${API}/api/companies/my-applications`, { withCredentials: true });
      setCompanyApplications(r.data?.applications || []);
    } catch { setCompanyApplications([]); }
  }, [isAdmin, hasCompany]);

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
    fetchCompanyApplications();
  }, [fetchJobs, fetchMyApplications, fetchCompanyApplications]);

  const handleApply = async (jobId: number | string, title: string) => {
    setApplying(jobId);
    try {
      await axios.post(`${API}/api/jobs/${jobId}/apply`, {}, { withCredentials: true });
      showToast(`Applied to "${title}"!`); fetchMyApplications();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax?.response?.data?.message || 'Failed to apply', 'error');
    } finally { setApplying(null); }
  };

  const handleDeleteJob = async (jobId: number | string) => {
    try {
      await axios.delete(`${API}/api/jobs/${jobId}`, { withCredentials: true });
      showToast('Job deleted'); fetchJobs();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handlePostJob = async () => {
    if (!postForm.title.trim()) return;
    setPostLoading(true);
    try {
      await axios.post(`${API}/api/jobs`, { ...postForm }, { withCredentials: true });
      showToast('Job posted!');
      setShowPostModal(false);
      setPostForm({ title: '', description: '', location: 'Remote', type: 'Full-time', salary: '', tags: '' });
      fetchJobs();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = ax?.response?.data?.message || 'Failed to post job';
      console.error('Post job error:', ax?.response?.status, msg);
      showToast(msg, 'error');
    } finally { setPostLoading(false); }
  };

  const getAppStatus = (jobId: number | string) => myApplications.find(a => String(a.job_id) === String(jobId));

  const filtered = jobs.filter(j => {
    const q = jobSearch.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q) || (j.tags || []).some(t => t.toLowerCase().includes(q));
    const matchFilter = activeFilter === 'All' || j.type === activeFilter || j.location.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  const JOB_EMOJIS = ['💼', '🚀', '⚡', '🎯', '🔮', '🌿', '🏗️', '🎨', '📊', '🔧'];
  const getEmoji = (id: number | string) => JOB_EMOJIS[Number(id) % JOB_EMOJIS.length];

  return (
    <div>
      {toast && <div className="toast" style={{ background: toast.type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff' }}><span>{toast.type === 'success' ? '✓' : '✕'}</span> {toast.msg}</div>}

      {/* ── USER WITHOUT COMPANY: show applications status + find company button ── */}
      {!isAdmin && !hasCompany && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>Find Job</h2>
              <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>Join a company to access job listings and your team</p>
            </div>
            <button className="btn-primary" onClick={() => router.push('/find-company')} style={{ padding: '12px 24px', fontSize: 13, cursor: 'pointer' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Find Company
            </button>
          </div>

          {/* Applications status */}
          {companyApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--card)', border: '1.5px dashed var(--border2)', borderRadius: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏢</div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>No company yet</h3>
              <p style={{ color: 'var(--text3)', margin: '0 0 24px', fontSize: 14, lineHeight: 1.6 }}>Apply to a company to get access to your team dashboard, job listings, and more.</p>
              <button className="btn-primary" onClick={() => router.push('/find-company')} style={{ margin: '0 auto', cursor: 'pointer' }}>
                Browse Companies →
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
                Your Applications ({companyApplications.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {companyApplications.map(app => {
                  const statusColor = app.status === 'accepted' ? '#16a34a' : app.status === 'rejected' ? '#ef4444' : '#f97316';
                  const statusBg = app.status === 'accepted' ? 'rgba(34,197,94,.1)' : app.status === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(249,115,22,.1)';
                  const statusLabel = app.status === 'accepted' ? '✓ Accepted' : app.status === 'rejected' ? '✕ Rejected' : '⏳ Pending';
                  return (
                    <div key={app.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏢</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{app.company_name}</div>
                        {app.company_description && <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.company_description}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <div style={{ padding: '6px 14px', borderRadius: 100, background: statusBg, color: statusColor, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{statusLabel}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button className="btn-ghost" onClick={() => router.push('/find-company')} style={{ cursor: 'pointer' }}>
                  Apply to more companies →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USER WITH COMPANY or ADMIN: show job board ── */}
      {(isAdmin || hasCompany) && (<>
      {/* Post Job Modal (admin only) */}
      {isAdmin && showPostModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowPostModal(false) }}>
          <div className="sheet" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>Post a Job</h2>
              <button onClick={() => setShowPostModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,.08)', background: dark ? '#1e1c19' : '#f8f7f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="lbl">Job Title *</label><input className="inp" value={postForm.title} onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" /></div>
              <div><label className="lbl">Description</label><textarea className="inp" rows={3} value={postForm.description} onChange={e => setPostForm(p => ({ ...p, description: e.target.value }))} placeholder="What will this person do?" style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="lbl">Location</label><input className="inp" value={postForm.location} onChange={e => setPostForm(p => ({ ...p, location: e.target.value }))} placeholder="Remote" /></div>
                <div><label className="lbl">Type</label>
                  <select className="inp" value={postForm.type} onChange={e => setPostForm(p => ({ ...p, type: e.target.value }))}>
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                </div>
              </div>
              <div><label className="lbl">Salary (optional)</label><input className="inp" value={postForm.salary} onChange={e => setPostForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. $80k–$120k" /></div>
              <div><label className="lbl">Tags (comma separated)</label><input className="inp" value={postForm.tags} onChange={e => setPostForm(p => ({ ...p, tags: e.target.value }))} placeholder="React, TypeScript, Node.js" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowPostModal(false)} style={{ flex: 1, cursor: 'pointer' }}>Cancel</button>
              <button className="btn-primary" disabled={!postForm.title.trim() || postLoading} onClick={handlePostJob} style={{ flex: 2, justifyContent: 'center', cursor: 'pointer' }}>
                {postLoading ? <span className="spin" /> : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>{isAdmin ? 'Post Job' : 'Find Job'}</h2>
          <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>{isAdmin ? 'Post jobs for your company' : 'Discover opportunities from your company'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isAdmin && myApplications.length > 0 && <div style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(34,197,94,.1)', color: '#16a34a', fontSize: 12, fontWeight: 700 }}>{myApplications.length} applied</div>}
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowPostModal(true)} style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
              Post Job
            </button>
          )}
        </div>
      </div>

      {/* User: search + filters */}
      {!isAdmin && (<>
      <div className="job-search-bar">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text4)" strokeWidth="2.2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input className="job-search-inp" placeholder="Search by title, company, or skill…" value={jobSearch} onChange={e => setJobSearch(e.target.value)} />
        {jobSearch && <button onClick={() => setJobSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex', padding: 4 }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg></button>}
      </div>
      <div className="job-filters">
        {JOB_FILTERS.map(f => <button key={f} className={`filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>)}
      </div>
      </>)}

      {/* Jobs Grid */}
      {loading ? (
        <div className="jobs-grid">{[1,2,3].map(i => <div key={i} className="job-card"><div className="sk" style={{ height: 52, width: 52, borderRadius: 16, marginBottom: 16 }} /><div className="sk" style={{ height: 20, width: '70%', marginBottom: 8 }} /><div className="sk" style={{ height: 14, width: '50%', marginBottom: 20 }} /><div className="sk" style={{ height: 44, borderRadius: 14 }} /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--card)', border: '1.5px dashed var(--border2)', borderRadius: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>{isAdmin ? 'No jobs posted yet' : 'No jobs available'}</h3>
          <p style={{ color: 'var(--text3)', margin: '0 0 20px', fontSize: 14 }}>{isAdmin ? 'Click "Post Job" to add your first listing.' : 'Check back later for new opportunities.'}</p>
          {isAdmin && <button className="btn-primary" onClick={() => setShowPostModal(true)} style={{ margin: '0 auto', cursor: 'pointer' }}>Post First Job</button>}
        </div>
      ) : (
        <div className="jobs-grid">
          {filtered.map((job, i) => {
            const appStatus = getAppStatus(job.id);
            const isApplied = !!appStatus;
            return (
              <div key={job.id} className="job-card a-rise" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div className="job-logo">{getEmoji(job.id)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company">{job.company_name}<span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--bg3)', color: 'var(--text3)' }}>{job.type}</span></p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteJob(job.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
                <div className="job-meta">
                  <span className="job-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{job.location}</span>
                  <span className="job-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{timeAgo(job.created_at)}</span>
                  {isAdmin && job.applicant_count !== undefined && <span className="job-tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>👥 {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}</span>}
                </div>
                {job.salary && <div className="job-salary"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="job-salary-val">{job.salary}</span></div>}
                {job.tags && job.tags.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>{job.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{t}</span>)}</div>}
                {!isAdmin && (
                  <button className="job-apply-btn" onClick={() => handleApply(job.id, job.title)} disabled={isApplied || applying === job.id}
                    style={isApplied ? { background: appStatus?.status === 'accepted' ? 'rgba(34,197,94,.1)' : 'rgba(249,115,22,.1)', color: appStatus?.status === 'accepted' ? '#16a34a' : '#d45e00' } : {}}>
                    {applying === job.id ? <span className="spin" /> :
                     isApplied ? <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>{appStatus?.status === 'accepted' ? 'Accepted!' : appStatus?.status === 'rejected' ? 'Not selected' : 'Applied'}</> :
                     <>Apply Now <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>)}
    </div>
  );
}

const NavIcon = ({ id }: { id: string }) => {
  const item = NAV_ALL.find(n => n.id === id);
  if (!item) return null;
  return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>;
};

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
    <div>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--text3)', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [time, setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAttModal, setShowAttModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignUsers, setAssignUsers] = useState<AssignableUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [myAtt, setMyAtt] = useState<AttendanceRecord>({ status: 'office', note: '', since: '—' });

  const [ldUser, setLdUser] = useState(true);
  const [ldTeam, setLdTeam] = useState(true);
  const [ldAct, setLdAct] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isConnected } = useSocket();

  // Socket.io disabled on Vercel — real-time notifications not available
  // useEffect(() => { ... socket.on ... }, [socket]);

  const isAdmin = user?.role === 'admin';
  const NAV = NAV_ALL.filter(n => {
    if (n.adminOnly && !isAdmin) return false;
    if ((n as { userOnly?: boolean }).userOnly && isAdmin) return false;
    return true;
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('timso_theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('timso_theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  // Custom cursor
  useEffect(() => {
    if (!mounted) return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const cur = document.getElementById('cur') as HTMLElement;
    if (!cur) return;
    let mt: ReturnType<typeof setTimeout>;
    const mv = (e: MouseEvent) => {
      cur.style.left = (e.clientX - 2) + 'px';
      cur.style.top = (e.clientY - 2) + 'px';
      document.body.classList.add('cm'); clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cm'), 140);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mousedown', () => document.body.classList.add('ca'));
    document.addEventListener('mouseup', () => document.body.classList.remove('ca'));
    return () => document.removeEventListener('mousemove', mv);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    setLdUser(true);
    axios.get(`${API}/api/auth/me`, { withCredentials: true })
      .then(async r => {
        const d = r.data;
        const u = d?.user || d?.data?.user || d?.data || d || null;
        if (!u) { router.push('/login'); return; }

        // Only redirect non-admin users without company
        if (u.role !== 'admin' && !u.company_id) {
          router.push('/find-company');
          return;
        }

        // Fetch company name
        if (u.company_id) {
          try {
            const cr = await axios.get(`${API}/api/companies`, { withCredentials: true });
            const companies = cr.data?.companies || [];
            const company = companies.find((c: { id: number | string; name: string }) => String(c.id) === String(u.company_id));
            if (company) u.company_name = company.name;
          } catch {}
        }
        setUser(u);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLdUser(false));
  }, [mounted, router]);

  // Load saved attendance
  useEffect(() => {
    if (!mounted) return;
    const saved = getAtt();
    if (saved) setMyAtt(saved);
  }, [mounted]);

  const fetchTeam = useCallback(async (silent = false) => {
    if (!mounted) return;
    if (!silent) setLdTeam(true); else setRefreshing(true);
    try {
      const r = await axios.get(`${API}/api/attendance/team`, { withCredentials: true });
      const d = r.data?.data?.team || r.data?.team || r.data;
      if (Array.isArray(d)) setTeam(normaliseTeam(d));
    } catch { setTeam([]); }
    finally { setLdTeam(false); setRefreshing(false); }
  }, [mounted]);

  const fetchActivity = useCallback(async () => {
    if (!mounted) return;
    setLdAct(true);
    try {
      const r = await axios.get(`${API}/api/activity`, { withCredentials: true });
      const d = r.data?.data?.activity || r.data?.data || r.data;
      if (Array.isArray(d)) setActivity(normaliseActivity(d.slice(0, 15)));
    } catch { setActivity([]); }
    finally { setLdAct(false); }
  }, [mounted]);

  const fetchApplications = useCallback(async () => {
    if (!user?.company_id) return;
    try {
      const r = await axios.get(`${API}/api/companies/applications`, { withCredentials: true });
      if (r.data?.success) setApplications(r.data.applications);
    } catch { }
  }, [user?.company_id]);

  const fetchTasks = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/tasks`, { withCredentials: true });
      const d = r.data?.data?.tasks || r.data?.data || r.data;
      if (Array.isArray(d)) setTasks(d);
    } catch { }
  }, []);

  const fetchAssignUsers = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/tasks/users`, { withCredentials: true });
      const d = r.data?.data?.users || r.data?.users || [];
      setAssignUsers(d);
    } catch { }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchTeam(); fetchActivity(); fetchTasks();
    if (isAdmin) fetchAssignUsers();
  }, [fetchTeam, fetchActivity, fetchTasks, fetchAssignUsers, mounted, isAdmin]);

  useEffect(() => {
    if (isAdmin && user?.company_id) fetchApplications();
  }, [isAdmin, user?.company_id, fetchApplications]);

  const handleSaveAtt = async (status: 'office' | 'remote' | 'away', note: string) => {
    const r = saveAtt(status, note);
    setMyAtt(r);
    try { await axios.post(`${API}/api/attendance`, { status, note }, { withCredentials: true }); fetchTeam(true); } catch { }
    showToast('Status updated!');
  };

  const handleAssignTask = async (d: { title: string; description: string; assigned_to: string; priority: string; due_date: string }) => {
    setTaskLoading(true);
    try {
      await axios.post(`${API}/api/tasks`, d, { withCredentials: true });
      showToast('Task assigned!'); setShowTaskModal(false); fetchTasks();
    } catch { showToast('Failed to assign task', 'error'); }
    finally { setTaskLoading(false); }
  };

  const handleApplication = async (applicationId: number | string, status: 'accepted' | 'rejected') => {
    try {
      const r = await axios.post(`${API}/api/companies/handle-application`, { applicationId, status }, { withCredentials: true });
      if (r.data?.success) { showToast(`Application ${status}!`); fetchApplications(); fetchTeam(); }
    } catch { showToast('Failed', 'error'); }
  };

  const logout = async () => {
    try { await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true }); } catch { }
    clearToken();
    router.push('/login');
  };

  const displayName = user?.full_name || user?.fullname || user?.username || 'Team';
  const greet = () => { const h = new Date().getHours(); if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening'; };

  // Status color map
  const STATUS_DOT: Record<string, string> = { office: '#f97316', remote: '#a89fff', away: '#c8c5be' };
  const STATUS_LABEL: Record<string, string> = { office: 'In Office', remote: 'Remote', away: 'Away' };
  const STATUS_BG: Record<string, string> = { office: 'rgba(249,115,22,.1)', remote: 'rgba(168,159,255,.1)', away: 'rgba(0,0,0,.06)' };

  return (
    <>
      <style>{G}</style>
      <svg id="cur" viewBox="0 0 24 24" fill="none" style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99999, width: 14, height: 14, top: 0, left: 0 }}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill={dark ? '#f0ede8' : '#0f0e0c'} stroke={dark ? '#f0ede8' : '#0f0e0c'} strokeWidth="1" strokeLinejoin="round" />
      </svg>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showAttModal && <AttendanceModal current={myAtt} onSave={handleSaveAtt} onClose={() => setShowAttModal(false)} dark={dark} />}
      {showTaskModal && isAdmin && <TaskModal users={assignUsers} onSubmit={handleAssignTask} onClose={() => setShowTaskModal(false)} loading={taskLoading} />}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* SIDEBAR */}
        <aside className={`sidebar-wrap ${mobileOpen ? 'open' : ''}`}>
          <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: dark ? '#f0ede8' : '#0f0e0c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#0f0e0c' : '#fff', fontWeight: 900, fontSize: 18 }}>T</div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>timso</div>
          </div>

          <nav style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', padding: '0 16px 12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Menu</div>
            {NAV.map(item => (
              <button key={item.id}
                onClick={() => {
                  const ext = (item as { externalLink?: string }).externalLink;
                  if (ext) { router.push(ext); } else { setActiveNav(item.id); }
                }}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}>
                <NavIcon id={item.id} />
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
            {/* Current status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: STATUS_BG[myAtt.status], marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[myAtt.status], flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_DOT[myAtt.status] }}>{STATUS_LABEL[myAtt.status]}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>since {myAtt.since}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--hover2)', marginBottom: 12 }}>
              <Avatar name={displayName} picture={user?.profile_picture} size={36} bg={user?.avatar_color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{isAdmin ? 'Admin' : user?.company_name ? user.company_name : 'Team Member'}</div>
              </div>
              {isAdmin && <div className="admin-badge">Admin</div>}
            </div>
            <button onClick={logout} className="logout-btn" style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'var(--text2)', fontFamily: 'Outfit,sans-serif' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
          <header className="header-pad" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'var(--header)', position: 'sticky', top: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Mobile menu */}
              <button onClick={() => setMobileOpen(p => !p)} style={{ display: 'none', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--bg2)', alignItems: 'center', justifyContent: 'center', cursor: 'none' }} className="mob-menu-btn">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, margin: 0 }}>{NAV.find(n => n.id === activeNav)?.label}</h1>
              {isConnected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: 'rgba(34,197,94,.1)', color: '#16a34a', fontSize: 10, fontWeight: 800 }}>
                  <span className="status-dot status-online" style={{ margin: 0 }} /> LIVE
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'var(--hover2)', fontSize: 13, fontWeight: 700 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {time}
              </div>
              <button onClick={() => setDark(!dark)} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', transition: 'all .2s' }}>
                {dark ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </header>

          <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
            <div className="a-rise">

              {/* ── OVERVIEW ── */}
              {activeNav === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  {/* Greeting */}
                  <div className="greet-card">
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: 100 }}>Welcome Back</span>
                        {user?.company_name && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', background: 'rgba(255,255,255,.12)', padding: '4px 12px', borderRadius: 100 }}>
                            🏢 {user.company_name}
                          </span>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
                        Good {greet()}, {displayName} 👋
                      </h2>
                      <p style={{ fontSize: 15, opacity: .7, marginTop: 14, maxWidth: 480, lineHeight: 1.5 }}>
                        {team.filter(m => m.status === 'office').length} members in office · {tasks.filter(t => t.status !== 'done').length} active tasks today
                      </p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                        <button className="btn-primary" style={{ background: '#fff', color: '#0f0e0c' }} onClick={() => setShowAttModal(true)}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Update My Status
                        </button>
                        <button className="btn-primary" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}
                          onClick={() => isAdmin ? router.push('/admin/jobs') : setActiveNav('findjob')}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          {isAdmin ? 'Post Job' : 'Browse Jobs'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {[
                      { label: 'In Office', value: team.filter(m => m.status === 'office').length, unit: 'members', icon: '🏢', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
                      { label: 'Remote', value: team.filter(m => m.status === 'remote').length, unit: 'members', icon: '🏠', color: '#60a5fa', bg: 'rgba(96,165,250,.1)' },
                      { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'done').length, unit: 'open', icon: '📝', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
                      { label: 'Done Today', value: tasks.filter(t => t.status === 'done').length, unit: 'tasks', icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
                    ].map(s => (
                      <div key={s.label} className="card stat-card">
                        <div className="stat-icon" style={{ color: s.color, background: s.bg }}>{s.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)' }}>{s.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 900 }}>{s.value} <span style={{ fontSize: 13, color: 'var(--text4)' }}>{s.unit}</span></div>
                      </div>
                    ))}
                  </div>

                  {/* Applications section (admin only) */}
                  {isAdmin && applications.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Pending Applications"
                        subtitle={`${applications.length} member${applications.length > 1 ? 's' : ''} want to join your workspace`}
                        action={
                          <button onClick={() => router.push('/admin/applications')} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border2)', background: 'var(--card)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text2)', fontFamily: 'Outfit,sans-serif', transition: 'all .2s' }}>
                            View All →
                          </button>
                        }
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                        {applications.map(app => (
                          <div key={app.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Avatar name={app.full_name || app.username} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{app.full_name || app.username}</div>
                              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{app.email}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => handleApplication(app.id, 'accepted')} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(34,197,94,.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', transition: 'all .2s' }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={() => handleApplication(app.id, 'rejected')} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', transition: 'all .2s' }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {activity.length > 0 && (
                    <div>
                      <SectionHeader title="Recent Activity" subtitle="What's happening with your team" />
                      <div className="card" style={{ padding: 8 }}>
                        {activity.slice(0, 8).map(a => (
                          <div key={a.id} className="act-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                            <Avatar name={a.name} picture={a.profile_picture} size={36} bg={a.bg} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}><span style={{ fontWeight: 800 }}>{a.name}</span> {a.action}</div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text4)', flexShrink: 0 }}>{a.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TEAM ── */}
              {activeNav === 'team' && (
                <div>
                  <SectionHeader title="Team" subtitle={`${team.length} members`} action={
                    <button onClick={() => fetchTeam(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border2)', background: 'var(--card)', fontSize: 12, fontWeight: 700, cursor: 'none', color: 'var(--text2)', fontFamily: 'Outfit,sans-serif', transition: 'all .2s' }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ animation: refreshing ? 'spin .65s linear infinite' : 'none' }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Refresh
                    </button>
                  } />
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {ldTeam ? (
                      [1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                          <div className="sk" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}><div className="sk" style={{ height: 12, width: '40%', marginBottom: 8 }} /><div className="sk" style={{ height: 10, width: '25%' }} /></div>
                          <div className="sk" style={{ height: 24, width: 80, borderRadius: 100 }} />
                        </div>
                      ))
                    ) : team.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>No team members yet</div>
                    ) : (
                      team.map(m => (
                        <div key={m.id} className="team-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                          <Avatar name={m.name} picture={m.profile_picture} size={40} bg={m.bg} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.job_role || m.role || 'Team Member'}</div>
                          </div>
                          {m.where && m.where !== '—' && <div style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.where}</div>}
                          <div className="status-badge" style={{ background: { office: 'rgba(249,115,22,.1)', remote: 'rgba(168,159,255,.1)', away: 'rgba(0,0,0,.06)' }[m.status || 'away'], color: { office: '#d45e00', remote: '#4228cf', away: '#6b6860' }[m.status || 'away'] }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: { office: '#f97316', remote: '#a89fff', away: '#c8c5be' }[m.status || 'away'] }} />
                            {STATUS_LABEL[m.status || 'away']}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── TASKS ── */}
              {activeNav === 'tasks' && (
                <div>
                  <SectionHeader title="Tasks" subtitle={`${tasks.filter(t => t.status !== 'done').length} open · ${tasks.filter(t => t.status === 'done').length} done`} action={
                    isAdmin && <button className="btn-primary" onClick={() => setShowTaskModal(true)} style={{ padding: '10px 20px', fontSize: 13 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
                      Assign Task
                    </button>
                  } />
                  {tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--card)', border: '1.5px dashed var(--border2)', borderRadius: 24 }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                      <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>No tasks yet</h3>
                      <p style={{ color: 'var(--text3)', margin: 0 }}>{isAdmin ? 'Assign your first task to a team member' : 'No tasks have been assigned to you yet'}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {tasks.map(t => (
                        <div key={t.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: { high: '#ef4444', medium: '#f97316', low: '#22c55e' }[t.priority] || '#9e9b94' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--text3)' : 'var(--text)' }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>→ {t.assigned_to_name || 'Team member'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: { todo: 'var(--bg3)', in_progress: 'rgba(249,115,22,.1)', done: 'rgba(34,197,94,.1)' }[t.status], color: { todo: 'var(--text3)', in_progress: '#d45e00', done: '#16a34a' }[t.status] }}>
                              {t.status === 'in_progress' ? 'In Progress' : t.status === 'todo' ? 'To Do' : 'Done'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FIND JOB ── */}
              {activeNav === 'findjob' && <FindJobSection isAdmin={isAdmin} hasCompany={!!user?.company_id} dark={dark} />}

              {/* ── ANALYTICS / MANAGE / SETTINGS (admin stubs) ── */}
              {(activeNav === 'analytics' || activeNav === 'manage' || activeNav === 'settings') && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontSize: 64, marginBottom: 24 }} className="float">🚧</div>
                  <SectionHeader
                    title={`${NAV.find(n => n.id === activeNav)?.label} coming soon`}
                    subtitle="We're working hard to bring this to your workspace."
                  />
                  <button className="btn-primary" onClick={() => setActiveNav('overview')}>Back to Overview</button>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    axios.get(`${API}/api/auth/me`, { withCredentials: true })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u?.id) { window.location.href = '/login'; return; }
        // Non-admin without company → find-company
        if (u.role !== 'admin' && !u.company_id) {
          window.location.href = '/find-company';
          return;
        }
        setUser(u);
        setChecking(false);
      })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  if (!mounted || checking) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,.1)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
    </div>
  );

  return (
    <SocketProvider userId={user?.id}>
      <Dashboard />
    </SocketProvider>
  );
}