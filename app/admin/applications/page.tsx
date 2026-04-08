'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const authH = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Applicant {
  id: number | string;
  user_id: number | string;
  company_id: number | string;
  status: 'pending' | 'accepted' | 'rejected';
  full_name?: string;
  email?: string;
  username?: string;
  created_at?: string;
}

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}
@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
.a-rise{opacity:0;animation:riseIn .5s cubic-bezier(.16,1,.3,1) forwards}
.sk{background:linear-gradient(90deg,#f2f0eb 25%,#fff 50%,#f2f0eb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px;transition:all .3s}
.btn{border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:8px;padding:10px 20px}
.btn-accept{background:rgba(34,197,94,.1);color:#16a34a}
.btn-accept:hover{background:rgba(34,197,94,.2)}
.btn-reject{background:rgba(239,68,68,.1);color:#ef4444}
.btn-reject:hover{background:rgba(239,68,68,.2)}
.btn-back{background:#0f0e0c;color:#fff;padding:10px 20px}
.btn-back:hover{background:#f97316}
.badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px}
.badge-pending{background:rgba(249,115,22,.1);color:#d45e00}
.badge-accepted{background:rgba(34,197,94,.1);color:#16a34a}
.badge-rejected{background:rgba(239,68,68,.1);color:#ef4444}
`;

const timeAgo = (d?: string) => {
  if (!d) return '';
  try {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  } catch { return d; }
};

const getInitials = (name?: string) => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const COLORS = ['#f97316','#a89fff','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id: number | string) => COLORS[Number(id) % COLORS.length];

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/companies/applications`, { withCredentials: true, headers: authH() });
      setApplicants(r.data?.applications || []);
    } catch { setApplicants([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`, { withCredentials: true, headers: authH() })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u || u.role !== 'admin') router.push('/dashboard');
      })
      .catch(() => router.push('/login'));
    fetchApplicants();
  }, [router, fetchApplicants]);

  const handleAction = async (applicationId: number | string, status: 'accepted' | 'rejected') => {
    setActing(applicationId);
    try {
      await axios.post(`${API}/api/companies/handle-application`, { applicationId, status }, { withCredentials: true, headers: authH() });
      showToast(`Application ${status}!`);
      fetchApplicants();
    } catch { showToast('Action failed', 'error'); }
    finally { setActing(null); }
  };

  const filtered = applicants.filter(a => filter === 'all' || a.status === filter);
  const counts = {
    all: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    accepted: applicants.filter(a => a.status === 'accepted').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
  };

  return (
    <>
      <style>{G}</style>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 18px', borderRadius: 14, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: toast.type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff', boxShadow: '0 8px 28px rgba(0,0,0,.14)' }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)', padding: '0 48px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-back" onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', fontSize: 13 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Dashboard
          </button>
          <div>
            <h1 className="font-syne" style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Company Applications</h1>
            <p style={{ fontSize: 12, color: '#9e9b94', margin: 0 }}>People who want to join your company</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', borderColor: filter === f ? '#0f0e0c' : 'rgba(0,0,0,.1)', background: filter === f ? '#0f0e0c' : 'transparent', color: filter === f ? '#fff' : '#6b6860', fontFamily: 'Outfit,sans-serif', transition: 'all .2s' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="sk" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="sk" style={{ height: 16, width: '40%', marginBottom: 8 }} />
                  <div className="sk" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1.5px dashed rgba(0,0,0,.1)', borderRadius: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
            <h3 className="font-syne" style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p style={{ color: '#9e9b94', margin: 0 }}>
              {filter === 'all' ? 'Share your company with people to start receiving applications.' : `No applications with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((app, i) => (
              <div key={app.id} className="card a-rise" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, animationDelay: `${i * 0.05}s` }}>
                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: getColor(app.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>
                  {getInitials(app.full_name || app.username)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{app.full_name || app.username || 'Unknown'}</span>
                    <span className={`badge badge-${app.status}`}>{app.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b6860' }}>{app.email}</div>
                  {app.username && <div style={{ fontSize: 12, color: '#9e9b94' }}>@{app.username}</div>}
                </div>

                {/* Time */}
                <div style={{ fontSize: 12, color: '#9e9b94', flexShrink: 0, marginRight: 16 }}>
                  {timeAgo(app.created_at)}
                </div>

                {/* Actions */}
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-accept" onClick={() => handleAction(app.id, 'accepted')} disabled={acting === app.id}>
                      {acting === app.id ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,.1)', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block' }} /> : (
                        <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>Accept</>
                      )}
                    </button>
                    <button className="btn btn-reject" onClick={() => handleAction(app.id, 'rejected')} disabled={acting === app.id}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      Reject
                    </button>
                  </div>
                )}
                {app.status !== 'pending' && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: app.status === 'accepted' ? '#16a34a' : '#ef4444', flexShrink: 0 }}>
                    {app.status === 'accepted' ? '✓ Accepted' : '✕ Rejected'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
