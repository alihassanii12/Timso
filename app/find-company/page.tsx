'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const authH = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Company {
  id: number | string;
  name: string;
  description?: string;
  admin_id: number | string;
}

interface Job {
  id: number | string;
  title: string;
  description?: string;
  location: string;
  type: string;
  salary?: string;
  tags: string[];
  applicant_count?: number;
  created_at: string;
}

interface JobApplication {
  id: number | string;
  job_id: number | string;
  status: string;
}

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%}
body{font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}

@keyframes riseIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.a-rise{opacity:0;animation:riseIn .5s cubic-bezier(.16,1,.3,1) forwards}
.a-slide{opacity:0;animation:slideRight .4s cubic-bezier(.16,1,.3,1) forwards}
.sk{background:linear-gradient(90deg,#f2f0eb 25%,#fff 50%,#f2f0eb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.spin-el{width:16px;height:16px;border:2px solid rgba(0,0,0,.1);border-top-color:#f97316;border-radius:50%;animation:spin .65s linear infinite;display:inline-block}
.live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse 2s ease-in-out infinite;display:inline-block}

/* Layout */
.page{display:flex;height:100vh;overflow:hidden}
.left-panel{width:380px;flex-shrink:0;border-right:1px solid rgba(0,0,0,.07);display:flex;flex-direction:column;background:#fff;overflow:hidden}
.right-panel{flex:1;overflow-y:auto;background:#faf9f7}

/* Top bar */
.top-bar{padding:20px 24px;border-bottom:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:12px;background:#fff;flex-shrink:0}
.back-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(0,0,0,.1);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0}
.back-btn:hover{border-color:#0f0e0c;background:#f2f0eb}

/* Search */
.search-wrap{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.06);flex-shrink:0}
.search-bar{display:flex;align-items:center;gap:10px;background:#f8f7f4;border:1.5px solid transparent;border-radius:14px;padding:10px 14px;transition:all .2s}
.search-bar:focus-within{background:#fff;border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.08)}
.search-inp{flex:1;border:none;outline:none;font-size:13px;font-family:'Outfit',sans-serif;color:#0f0e0c;background:transparent}
.search-inp::placeholder{color:#c8c5be}

/* Company list */
.companies-list{flex:1;overflow-y:auto;padding:12px}
.company-item{padding:14px 16px;border-radius:14px;cursor:pointer;transition:all .2s;border:1.5px solid transparent;margin-bottom:6px;display:flex;align-items:center;gap:12px}
.company-item:hover{background:#f8f7f4;border-color:rgba(0,0,0,.06)}
.company-item.active{background:rgba(249,115,22,.06);border-color:rgba(249,115,22,.25)}
.company-icon{width:40px;height:40px;border-radius:12px;background:rgba(249,115,22,.1);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.company-name{font-size:14px;font-weight:800;color:#0f0e0c;margin-bottom:2px}
.company-desc{font-size:11px;color:#9e9b94;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}

/* Right panel content */
.right-content{padding:40px}
.empty-right{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px}

/* Job cards */
.jobs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:24px}
.job-card{background:#fff;border:1.5px solid rgba(0,0,0,.07);border-radius:20px;padding:24px;transition:all .3s cubic-bezier(.16,1,.3,1);cursor:default}
.job-card:hover{border-color:rgba(249,115,22,.3);box-shadow:0 12px 36px rgba(249,115,22,.08);transform:translateY(-3px)}
.job-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:900;margin:0 0 4px;color:#0f0e0c;letter-spacing:-.3px}
.job-meta{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.job-tag{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;background:#f2f0eb;color:#6b6860}
.job-salary{font-size:13px;font-weight:800;color:#16a34a;margin:8px 0 16px;display:flex;align-items:center;gap:6px}

.apply-btn{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.apply-btn:hover{background:#f97316;transform:translateY(-1px)}
.apply-btn:disabled{opacity:.5;pointer-events:none}
.apply-btn.applied{background:rgba(34,197,94,.1);color:#16a34a;cursor:default}

.toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;animation:riseIn .35s cubic-bezier(.16,1,.3,1) forwards;box-shadow:0 8px 28px rgba(0,0,0,.14)}

@media(max-width:768px){
  .page{flex-direction:column;height:auto}
  .left-panel{width:100%;height:auto;border-right:none;border-bottom:1px solid rgba(0,0,0,.07)}
  .companies-list{max-height:280px}
  .right-panel{min-height:60vh}
  .right-content{padding:24px 16px}
  .jobs-grid{grid-template-columns:1fr}
}
`;

const timeAgo = (d: string) => {
  try {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  } catch { return d; }
};

const COMPANY_EMOJIS = ['🏢', '🚀', '💡', '🌿', '⚡', '🎯', '🔮', '🏗️', '🌊', '🎪'];
const getEmoji = (id: number | string) => COMPANY_EMOJIS[Number(id) % COMPANY_EMOJIS.length];
const JOB_EMOJIS = ['💼', '🚀', '⚡', '🎯', '🔮', '🌿', '🏗️', '🎨', '📊', '🔧'];
const getJobEmoji = (id: number | string) => JOB_EMOJIS[Number(id) % JOB_EMOJIS.length];

export default function FindCompanyPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [applying, setApplying] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  // Auth check + poll for acceptance
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkUser = async () => {
      try {
        const r = await axios.get(`${API}/api/auth/me`, { withCredentials: true, headers: authH() });
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u) { router.push('/login'); return; }
        if (u?.role === 'admin') { router.push('/dashboard'); return; }
        // If accepted into a company → go to dashboard
        if (u?.company_id) {
          clearInterval(interval);
          router.push('/dashboard');
          return;
        }
      } catch {
        router.push('/login');
      }
    };

    checkUser();
    // Poll every 15s to detect acceptance
    interval = setInterval(checkUser, 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/companies`, { withCredentials: true, headers: authH() });
      setCompanies(r.data?.companies || []);
    } catch { setCompanies([]); }
    finally { setLoadingCompanies(false); }
  }, []);

  // Fetch my job applications
  const fetchMyApplications = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/jobs/my-applications`, { withCredentials: true, headers: authH() });
      setMyApplications(r.data?.data?.applications || []);
    } catch { setMyApplications([]); }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchMyApplications();
  }, [fetchCompanies, fetchMyApplications]);

  // Fetch jobs for selected company + polling for near-realtime
  const fetchJobs = useCallback(async (companyId: number | string) => {
    setLoadingJobs(true);
    try {
      const r = await axios.get(`${API}/api/jobs/company/${companyId}`, { withCredentials: true, headers: authH() });
      setJobs(r.data?.data?.jobs || []);
    } catch { setJobs([]); }
    finally { setLoadingJobs(false); }
  }, []);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    setJobs([]);
    fetchJobs(company.id);
  };

  // Manual refresh
  const handleRefresh = () => {
    if (selectedCompany) {
      fetchJobs(selectedCompany.id);
      fetchMyApplications();
    }
  };

  const handleApply = async (jobId: number | string, title: string) => {
    setApplying(jobId);
    try {
      await axios.post(`${API}/api/jobs/${jobId}/apply`, {}, { withCredentials: true, headers: authH() });
      showToast(`Applied to "${title}"!`);
      fetchMyApplications();
      // Refresh jobs to update applicant count
      if (selectedCompany) fetchJobs(selectedCompany.id);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax?.response?.data?.message || 'Failed to apply', 'error');
    } finally { setApplying(null); }
  };

  const getAppStatus = (jobId: number | string) =>
    myApplications.find(a => String(a.job_id) === String(jobId));

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{G}</style>

      {toast && (
        <div className="toast" style={{ background: toast.type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff' }}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span> {toast.msg}
        </div>
      )}

      <div className="page">
        {/* ── LEFT PANEL: Companies ── */}
        <div className="left-panel">
          {/* Top bar */}
          <div className="top-bar">
            <button className="back-btn" onClick={() => router.push('/dashboard')}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div>
              <div className="font-syne" style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.3px' }}>Find Company</div>
              <div style={{ fontSize: 11, color: '#9e9b94' }}>
                {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap">
            <div className="search-bar">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9e9b94" strokeWidth="2.2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                className="search-inp"
                placeholder="Search companies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8c5be', padding: 0, display: 'flex' }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Companies list */}
          <div className="companies-list">
            {loadingCompanies ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 6 }}>
                  <div className="sk" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="sk" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                    <div className="sk" style={{ height: 11, width: '80%' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9e9b94' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏙️</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{search ? 'No results' : 'No companies yet'}</div>
              </div>
            ) : (
              filtered.map((company, i) => (
                <div
                  key={company.id}
                  className={`company-item a-rise ${selectedCompany?.id === company.id ? 'active' : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => selectCompany(company)}
                >
                  <div className="company-icon">{getEmoji(company.id)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="company-name">{company.name}</div>
                    <div className="company-desc">{company.description || 'Click to view jobs'}</div>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c8c5be" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Jobs ── */}
        <div className="right-panel">
          {/* Pending applications banner */}
          {myApplications.length > 0 && (
            <div style={{ background: 'rgba(249,115,22,.06)', borderBottom: '1px solid rgba(249,115,22,.15)', padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2.2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#d45e00' }}>
                {myApplications.filter(a => a.status === 'applied').length > 0
                  ? `${myApplications.filter(a => a.status === 'applied').length} application(s) pending review — you'll be redirected automatically when accepted`
                  : myApplications.filter(a => a.status === 'accepted').length > 0
                  ? '✓ Application accepted! Redirecting to dashboard…'
                  : 'You have applied to jobs — waiting for admin review'}
              </span>
            </div>
          )}
          {!selectedCompany ? (
            <div className="empty-right">
              <div style={{ fontSize: 72, marginBottom: 20 }}>👈</div>
              <h2 className="font-syne" style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-1px' }}>
                Select a company
              </h2>
              <p style={{ color: '#9e9b94', fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>
                Click on a company from the left to see their open job listings and apply.
              </p>
            </div>
          ) : (
            <div className="right-content">
              {/* Company header */}
              <div className="a-rise" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(249,115,22,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                  {getEmoji(selectedCompany.id)}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-1px' }}>
                    {selectedCompany.name}
                  </h1>
                  {selectedCompany.description && (
                    <p style={{ fontSize: 14, color: '#6b6860', margin: '0 0 12px', lineHeight: 1.6 }}>
                      {selectedCompany.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9e9b94', fontWeight: 600 }}>
                      {loadingJobs ? 'Loading jobs…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''}`}
                    </span>
                    <button
                      onClick={handleRefresh}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,.1)', background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#6b6860', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s' }}
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Jobs */}
              {loadingJobs ? (
                <div className="jobs-grid">
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.07)', borderRadius: 20, padding: 24 }}>
                      <div className="sk" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                      <div className="sk" style={{ height: 13, width: '50%', marginBottom: 16 }} />
                      <div className="sk" style={{ height: 44, borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', border: '1.5px dashed rgba(0,0,0,.1)', borderRadius: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                  <h3 className="font-syne" style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>No open positions</h3>
                  <p style={{ color: '#9e9b94', margin: 0, fontSize: 14 }}>
                    {selectedCompany.name} hasn't posted any jobs yet. Check back later.
                  </p>
                </div>
              ) : (
                <div className="jobs-grid">
                  {jobs.map((job, i) => {
                    const appStatus = getAppStatus(job.id);
                    const isApplied = !!appStatus;
                    return (
                      <div key={job.id} className="job-card a-slide" style={{ animationDelay: `${i * 0.06}s` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(249,115,22,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {getJobEmoji(job.id)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="job-title">{job.title}</h3>
                            <div style={{ fontSize: 12, color: '#9e9b94', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{selectedCompany.name}</span>
                              <span>·</span>
                              <span>{timeAgo(job.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="job-meta">
                          <span className="job-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {job.location}
                          </span>
                          <span className="job-tag">{job.type}</span>
                          {job.tags?.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(249,115,22,.08)', color: '#d45e00' }}>{t}</span>
                          ))}
                        </div>

                        {job.description && (
                          <p style={{ fontSize: 12, color: '#6b6860', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {job.description}
                          </p>
                        )}

                        {job.salary && (
                          <div className="job-salary">
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {job.salary}
                          </div>
                        )}

                        <button
                          className={`apply-btn${isApplied ? ' applied' : ''}`}
                          onClick={() => !isApplied && handleApply(job.id, job.title)}
                          disabled={isApplied || applying === job.id}
                        >
                          {applying === job.id ? (
                            <span className="spin-el" />
                          ) : isApplied ? (
                            <>
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                              {appStatus?.status === 'accepted' ? 'Accepted!' : appStatus?.status === 'rejected' ? 'Not selected' : 'Applied'}
                            </>
                          ) : (
                            <>
                              Apply Now
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
