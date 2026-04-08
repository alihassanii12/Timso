'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const authH = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface JobApplicant {
  id: number | string;
  user_id: number | string;
  job_id: number | string;
  job_title?: string;
  full_name?: string;
  email?: string;
  username?: string;
  profile_picture?: string;
  status: 'applied' | 'reviewing' | 'accepted' | 'rejected';
  created_at?: string;
}

interface Job {
  id: number | string;
  title: string;
  applicant_count?: number;
}

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c}
.font-syne{font-family:'Syne',sans-serif}
@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
.a-rise{opacity:0;animation:riseIn .5s cubic-bezier(.16,1,.3,1) forwards}
.sk{background:linear-gradient(90deg,#f2f0eb 25%,#fff 50%,#f2f0eb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px}
.btn{border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:8px;padding:10px 18px}
.btn-primary{background:#0f0e0c;color:#fff}
.btn-primary:hover{background:#f97316}
.btn-ghost{background:#fff;color:#0f0e0c;border:1.5px solid rgba(0,0,0,.1)}
.btn-ghost:hover{border-color:#0f0e0c}
.badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;white-space:nowrap}
.badge-applied{background:rgba(249,115,22,.1);color:#d45e00}
.badge-reviewing{background:rgba(96,165,250,.1);color:#2563eb}
.badge-accepted{background:rgba(34,197,94,.1);color:#16a34a}
.badge-rejected{background:rgba(239,68,68,.1);color:#ef4444}
.status-btn{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:none;font-family:'Outfit',sans-serif;transition:all .2s}
.filter-tab{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;font-family:'Outfit',sans-serif;transition:all .2s}
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
const COLORS = ['#f97316', '#a89fff', '#fbbf24', '#34d399', '#fb7185', '#60a5fa'];
const getColor = (id: number | string) => COLORS[Number(id) % COLORS.length];

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<number | string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'applied' | 'reviewing' | 'accepted' | 'rejected'>('all');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/jobs/my-company`, { withCredentials: true, headers: authH() });
      const jobList = r.data?.data?.jobs || [];
      setJobs(jobList);
      // Auto-select first job
      if (jobList.length > 0 && !selectedJob) {
        setSelectedJob(jobList[0]);
      }
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, [selectedJob]);

  const fetchApplicants = useCallback(async (jobId: number | string, silent = false) => {
    if (!silent) setLoadingApplicants(true);
    else setRefreshing(true);
    try {
      const r = await axios.get(`${API}/api/jobs/${jobId}/applications`, { withCredentials: true, headers: authH() });
      setApplicants(r.data?.data?.applications || []);
    } catch { setApplicants([]); }
    finally { setLoadingApplicants(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`, { withCredentials: true, headers: authH() })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u || u.role !== 'admin') router.push('/dashboard');
      })
      .catch(() => router.push('/login'));
    fetchJobs();
  }, [router, fetchJobs]);

  useEffect(() => {
    if (selectedJob) fetchApplicants(selectedJob.id);
  }, [selectedJob, fetchApplicants]);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setFilter('all');
  };

  const handleUpdateStatus = async (appId: number | string, status: string) => {
    setActing(appId);
    try {
      await axios.patch(`${API}/api/jobs/applications/${appId}/status`, { status }, { withCredentials: true, headers: authH() });
      showToast('Status updated!');
      if (selectedJob) fetchApplicants(selectedJob.id, true);
    } catch { showToast('Failed to update', 'error'); }
    finally { setActing(null); }
  };

  const handleRefresh = () => {
    if (selectedJob) fetchApplicants(selectedJob.id, true);
  };

  const filtered = applicants.filter(a => filter === 'all' || a.status === filter);
  const counts = {
    all: applicants.length,
    applied: applicants.filter(a => a.status === 'applied').length,
    reviewing: applicants.filter(a => a.status === 'reviewing').length,
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
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/dashboard')} style={{ padding: '8px 14px', fontSize: 13 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Dashboard
          </button>
          <div>
            <h1 className="font-syne" style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Job Applications</h1>
            <p style={{ fontSize: 12, color: '#9e9b94', margin: 0 }}>People who applied to your job listings</p>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleRefresh} style={{ padding: '8px 14px', fontSize: 13 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ animation: refreshing ? 'spin .65s linear infinite' : 'none' }}>
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 68px)' }}>

        {/* Left: Jobs list */}
        <div style={{ borderRight: '1px solid rgba(0,0,0,.06)', background: '#fff', padding: '20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9e9b94', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, padding: '0 8px' }}>
            Your Jobs ({jobs.length})
          </div>
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ padding: '12px 10px', marginBottom: 6 }}>
                <div className="sk" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                <div className="sk" style={{ height: 11, width: '40%' }} />
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9e9b94' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💼</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No jobs posted yet</div>
              <button className="btn btn-primary" onClick={() => router.push('/admin/jobs')} style={{ marginTop: 12, padding: '8px 14px', fontSize: 12 }}>
                Post a Job
              </button>
            </div>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                onClick={() => handleSelectJob(job)}
                style={{
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 4,
                  background: selectedJob?.id === job.id ? 'rgba(249,115,22,.08)' : 'transparent',
                  border: `1.5px solid ${selectedJob?.id === job.id ? 'rgba(249,115,22,.25)' : 'transparent'}`,
                  transition: 'all .2s'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: '#0f0e0c' }}>{job.title}</div>
                <div style={{ fontSize: 11, color: '#9e9b94' }}>
                  {job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Applicants */}
        <div style={{ padding: '28px 32px' }}>
          {!selectedJob ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9e9b94', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Select a job to see applicants</div>
            </div>
          ) : (
            <>
              {/* Job header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 className="font-syne" style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-.5px' }}>{selectedJob.title}</h2>
                  <div style={{ fontSize: 13, color: '#9e9b94' }}>{applicants.length} total applicant{applicants.length !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {(['all', 'applied', 'reviewing', 'accepted', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    className="filter-tab"
                    onClick={() => setFilter(f)}
                    style={{
                      borderColor: filter === f ? '#0f0e0c' : 'rgba(0,0,0,.1)',
                      background: filter === f ? '#0f0e0c' : 'transparent',
                      color: filter === f ? '#fff' : '#6b6860'
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                  </button>
                ))}
              </div>

              {/* Applicants list */}
              {loadingApplicants ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="card" style={{ padding: 20, display: 'flex', gap: 14 }}>
                      <div className="sk" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="sk" style={{ height: 15, width: '40%', marginBottom: 8 }} />
                        <div className="sk" style={{ height: 12, width: '60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', border: '1.5px dashed rgba(0,0,0,.1)', borderRadius: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <h3 className="font-syne" style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>
                    {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
                  </h3>
                  <p style={{ color: '#9e9b94', margin: 0, fontSize: 14 }}>
                    {filter === 'all' ? 'Share this job to start receiving applications.' : `No applicants with "${filter}" status.`}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map((app, i) => (
                    <div key={app.id} className="card a-rise" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, animationDelay: `${i * 0.04}s` }}>
                      {/* Avatar */}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: getColor(app.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 900, color: '#fff' }}>
                        {getInitials(app.full_name || app.username)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{app.full_name || app.username || 'Unknown'}</span>
                          <span className={`badge badge-${app.status}`}>{app.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6860' }}>{app.email}</div>
                        {app.username && <div style={{ fontSize: 11, color: '#9e9b94' }}>@{app.username}</div>}
                      </div>

                      {/* Time */}
                      <div style={{ fontSize: 11, color: '#9e9b94', flexShrink: 0, marginRight: 12 }}>
                        {timeAgo(app.created_at)}
                      </div>

                      {/* Status actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                        {(['reviewing', 'accepted', 'rejected'] as const).map(s => (
                          <button
                            key={s}
                            className="status-btn"
                            disabled={app.status === s || acting === app.id}
                            onClick={() => handleUpdateStatus(app.id, s)}
                            style={{
                              opacity: app.status === s ? 0.4 : 1,
                              cursor: app.status === s ? 'default' : 'pointer',
                              background: s === 'accepted' ? 'rgba(34,197,94,.1)' : s === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(96,165,250,.1)',
                              color: s === 'accepted' ? '#16a34a' : s === 'rejected' ? '#ef4444' : '#2563eb'
                            }}
                          >
                            {acting === app.id ? '…' : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
