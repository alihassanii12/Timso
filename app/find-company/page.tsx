'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

// Read access token from localStorage or cookie and attach as Bearer header
const authHeaders = () => {
  const token = (typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null)
    || (() => {
      const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/) : null;
      return match ? decodeURIComponent(match[1]) : null;
    })();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%}
body{font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;cursor:none;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}

#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .15s,height .15s,opacity .15s}
body.cm #cur{width:20px!important;height:20px!important}
body.ch #cur{width:17px!important;height:17px!important;opacity:.7}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}

@keyframes riseIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.a-rise{opacity:0;animation:riseIn .55s cubic-bezier(.16,1,.3,1) forwards}
.float{animation:float 3.5s ease-in-out infinite}
.spin-el{width:16px;height:16px;border:2px solid rgba(0,0,0,.15);border-top-color:#f97316;border-radius:50%;animation:spin .65s linear infinite;display:inline-block}
.sk{background:linear-gradient(90deg,#f2f0eb 25%,#fff 50%,#f2f0eb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}

.page-wrap{min-height:100vh;background:#faf9f7}

.top-bar{position:sticky;top:0;z-index:50;background:rgba(250,249,247,.9);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,.06);padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between}

.logo-btn{font-family:'Syne',sans-serif;font-weight:900;font-size:20px;background:none;border:none;cursor:none;color:#0f0e0c;display:flex;align-items:center;gap:4px;padding:0;letter-spacing:-.5px}
.logo-dot{width:8px;height:8px;border-radius:50%;border:2px solid #0f0e0c;display:inline-block;margin-left:2px}

.back-btn{display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:12px;border:1.5px solid rgba(0,0,0,.1);background:#fff;font-size:13px;font-weight:700;cursor:none;transition:all .2s;color:#0f0e0c;font-family:'Outfit',sans-serif}
.back-btn:hover{border-color:#0f0e0c;background:#f2f0eb}

.hero{padding:80px 48px 48px;max-width:1200px;margin:0 auto}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:rgba(249,115,22,.1);color:#d45e00;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:24px}
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,60px);font-weight:900;letter-spacing:-2px;line-height:1;margin:0 0 16px;color:#0f0e0c}
.hero-sub{font-size:16px;color:#6b6860;line-height:1.6;max-width:520px;margin:0}

.search-bar-wrap{padding:0 48px;max-width:1200px;margin:0 auto 48px}
.search-bar{display:flex;gap:12px;align-items:center;background:#fff;border:1.5px solid rgba(0,0,0,.1);border-radius:20px;padding:8px 8px 8px 24px;box-shadow:0 4px 24px rgba(0,0,0,.06);transition:border-color .2s,box-shadow .2s}
.search-bar:focus-within{border-color:#f97316;box-shadow:0 4px 24px rgba(249,115,22,.12)}
.search-inp{flex:1;border:none;outline:none;font-size:15px;font-family:'Outfit',sans-serif;color:#0f0e0c;background:transparent}
.search-inp::placeholder{color:#c8c5be}
.search-btn{background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:12px 24px;font-size:14px;font-weight:700;cursor:none;font-family:'Outfit',sans-serif;display:flex;align-items:center;gap:8px;transition:all .2s;white-space:nowrap}
.search-btn:hover{background:#f97316;transform:translateY(-1px)}

.content-wrap{padding:0 48px 80px;max-width:1200px;margin:0 auto}

.section-label{font-size:11px;font-weight:800;color:#9e9b94;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px}

.companies-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(340px,1fr));gap:20px}

.company-card{background:#fff;border:1.5px solid rgba(0,0,0,.07);border-radius:24px;padding:28px;transition:all .3s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden;cursor:none}
.company-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(249,115,22,.04),transparent);opacity:0;transition:opacity .3s}
.company-card:hover{border-color:rgba(249,115,22,.3);box-shadow:0 16px 48px rgba(249,115,22,.08);transform:translateY(-4px)}
.company-card:hover::before{opacity:1}

.company-icon{width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(249,115,22,.08);margin-bottom:20px;flex-shrink:0}
.company-name{font-family:'Syne',sans-serif;font-size:20px;font-weight:900;margin:0 0 8px;color:#0f0e0c;letter-spacing:-.5px}
.company-desc{font-size:13px;color:#6b6860;line-height:1.6;margin:0 0 24px}
.company-meta{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.company-tag{font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;background:#f2f0eb;color:#6b6860}

.apply-btn{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:13px;font-size:14px;font-weight:700;cursor:none;font-family:'Outfit',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.apply-btn:hover{background:#f97316;transform:translateY(-1px)}
.apply-btn:disabled{opacity:.5;pointer-events:none}
.apply-btn.applied{background:rgba(34,197,94,.1);color:#16a34a;cursor:none}
.apply-btn.applied:hover{background:rgba(34,197,94,.15);transform:none}

.empty-state{text-align:center;padding:80px 40px;background:#fff;border:1.5px dashed rgba(0,0,0,.1);border-radius:24px}

.toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;animation:riseIn .35s cubic-bezier(.16,1,.3,1) forwards;box-shadow:0 8px 28px rgba(0,0,0,.14)}

.status-banner{background:rgba(249,115,22,.06);border:1.5px solid rgba(249,115,22,.15);border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:12px;margin-bottom:32px}

@media(max-width:768px){
  .top-bar{padding:0 20px}
  .hero{padding:60px 20px 32px}
  .search-bar-wrap{padding:0 20px;margin-bottom:32px}
  .content-wrap{padding:0 20px 60px}
  body{cursor:auto}
  #cur{display:none}
}
@media(max-width:480px){
  .companies-grid{grid-template-columns:1fr}
}
`;

interface Company {
  id: number | string;
  name: string;
  description?: string;
  admin_id: number | string;
}

interface Application {
  id: number | string;
  company_id: number | string;
  status: 'pending' | 'accepted' | 'rejected';
}

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div className="toast" style={{ background: type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff' }}>
    <span>{type === 'success' ? '✓' : '✕'}</span> {msg}
  </div>
);

const COMPANY_EMOJIS = ['🏢', '🚀', '💡', '🌿', '⚡', '🎯', '🔮', '🏗️', '🌊', '🎪'];
const getEmoji = (id: number | string) => COMPANY_EMOJIS[Number(id) % COMPANY_EMOJIS.length];

export default function FindCompanyPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<{ id?: number | string; company_id?: number | string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Custom cursor
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const cur = document.getElementById('cur') as HTMLElement;
    if (!cur) return;
    let mt: ReturnType<typeof setTimeout>;
    const mv = (e: MouseEvent) => {
      cur.style.left = (e.clientX - 2) + 'px';
      cur.style.top = (e.clientY - 2) + 'px';
      document.body.classList.add('cm');
      clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cm'), 140);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mousedown', () => document.body.classList.add('ca'));
    document.addEventListener('mouseup', () => document.body.classList.remove('ca'));
    return () => document.removeEventListener('mousemove', mv);
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`, { withCredentials: true, headers: authHeaders() })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (u) {
          setUser(u);
          // If already in a company, redirect to dashboard
          if (u.company_id) router.push('/dashboard');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/companies`, { withCredentials: true, headers: authHeaders() });
      if (r.data?.success) setCompanies(r.data.companies);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/companies/my-applications`, { withCredentials: true, headers: authHeaders() });
      if (r.data?.success) setMyApplications(r.data.applications || []);
    } catch {
      setMyApplications([]);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchMyApplications();
  }, [fetchCompanies, fetchMyApplications]);

  const handleApply = async (companyId: number | string) => {
    setApplying(companyId);
    try {
      const r = await axios.post(`${API}/api/companies/apply`, { companyId }, { withCredentials: true, headers: authHeaders() });
      if (r.data?.success) {
        showToast('Application sent! Waiting for admin approval.');
        fetchMyApplications();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax?.response?.data?.message || 'Failed to apply.', 'error');
    } finally {
      setApplying(null);
    }
  };

  const getAppStatus = (companyId: number | string) =>
    myApplications.find(a => String(a.company_id) === String(companyId));

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = myApplications.filter(a => a.status === 'pending').length;

  return (
    <>
      <style>{G}</style>
      <svg id="cur" viewBox="0 0 24 24" fill="none" style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99999, width: 14, height: 14, top: 0, left: 0 }}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round" />
      </svg>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-wrap">
        {/* TOP BAR */}
        <header className="top-bar">
          <button className="logo-btn" onClick={() => router.push('/')}>
            timso
            <span className="logo-dot" />
          </button>
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Dashboard
          </button>
        </header>

        {/* HERO */}
        <div className="hero a-rise">
          <div className="hero-badge">
            <span className="float" style={{ display: 'inline-block' }}>🔍</span>
            Find Your Workspace
          </div>
          <h1 className="hero-title font-syne">
            Join your team's<br />workspace
          </h1>
          <p className="hero-sub">
            Browse available companies, request to join, and start collaborating with your team in real-time.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="search-bar-wrap a-rise" style={{ animationDelay: '.1s' }}>
          <div className="search-bar">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9e9b94" strokeWidth="2.2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="search-inp"
              placeholder="Search by company name or description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'none', color: '#9e9b94', padding: 4, display: 'flex' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button className="search-btn" onClick={fetchCompanies}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content-wrap">
          {/* Pending applications banner */}
          {pendingCount > 0 && (
            <div className="status-banner a-rise">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2.2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c' }}>
                  {pendingCount} pending application{pendingCount > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: '#6b6860', marginTop: 2 }}>
                  Your requests are being reviewed by the company admins. We'll notify you when there's an update.
                </div>
              </div>
            </div>
          )}

          <div className="section-label">
            {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'company' : 'companies'} available`}
          </div>

          {loading ? (
            <div className="companies-grid">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.07)', borderRadius: 24, padding: 28 }}>
                  <div className="sk" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: 20 }} />
                  <div className="sk" style={{ height: 22, width: '60%', marginBottom: 10 }} />
                  <div className="sk" style={{ height: 13, width: '90%', marginBottom: 6 }} />
                  <div className="sk" style={{ height: 13, width: '70%', marginBottom: 24 }} />
                  <div className="sk" style={{ height: 46, borderRadius: 14 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="float" style={{ fontSize: 64, marginBottom: 24, display: 'block' }}>🏙️</div>
              <h3 className="font-syne" style={{ fontSize: 24, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-1px' }}>
                {search ? 'No companies found' : 'No companies yet'}
              </h3>
              <p style={{ color: '#9e9b94', margin: '0 0 24px', lineHeight: 1.6 }}>
                {search
                  ? `No results for "${search}". Try a different search term.`
                  : 'No companies are registered yet. Ask your admin to sign up first!'}
              </p>
              {search && (
                <button className="back-btn" style={{ margin: '0 auto' }} onClick={() => setSearch('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="companies-grid">
              {filtered.map((company, i) => {
                const appStatus = getAppStatus(company.id);
                const isPending = appStatus?.status === 'pending';
                const isAccepted = appStatus?.status === 'accepted';
                const isRejected = appStatus?.status === 'rejected';

                return (
                  <div
                    key={company.id}
                    className="company-card a-rise"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                      <div className="company-icon">
                        {getEmoji(company.id)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="company-name font-syne">{company.name}</h3>
                        <div className="company-meta">
                          <span className="company-tag">🏢 Company</span>
                          {isPending && <span className="company-tag" style={{ background: 'rgba(249,115,22,.1)', color: '#d45e00' }}>⏳ Applied</span>}
                          {isAccepted && <span className="company-tag" style={{ background: 'rgba(34,197,94,.1)', color: '#16a34a' }}>✓ Accepted</span>}
                          {isRejected && <span className="company-tag" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>✕ Rejected</span>}
                        </div>
                      </div>
                    </div>

                    <p className="company-desc">
                      {company.description || 'No description provided. Apply to learn more about this team.'}
                    </p>

                    {isAccepted ? (
                      <button
                        className="apply-btn"
                        style={{ background: 'rgba(34,197,94,.1)', color: '#16a34a' }}
                        onClick={() => router.push('/dashboard')}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Go to Dashboard
                      </button>
                    ) : isPending ? (
                      <button className="apply-btn" disabled style={{ background: 'rgba(249,115,22,.1)', color: '#d45e00', opacity: 1 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Request Pending…
                      </button>
                    ) : isRejected ? (
                      <button
                        className="apply-btn"
                        onClick={() => handleApply(company.id)}
                        disabled={applying === company.id}
                      >
                        {applying === company.id ? <span className="spin-el" /> : '↩ Apply Again'}
                      </button>
                    ) : (
                      <button
                        className="apply-btn"
                        onClick={() => handleApply(company.id)}
                        disabled={applying === company.id}
                      >
                        {applying === company.id ? (
                          <><span className="spin-el" /> Applying…</>
                        ) : (
                          <>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 4v16m8-8H4" />
                            </svg>
                            Request to Join
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}